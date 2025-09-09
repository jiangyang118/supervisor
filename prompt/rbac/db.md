你是资深后端架构师，请基于以下 RBAC 体检与修订结论，生成一套可直接落地的后端实现方案（NestJS + TypeORM + MySQL），包含角色定义、权限矩阵初始化、系统约束校验、中间件与审计，并对【监管端】与【学校端】进行差异化优化与强隔离。

# 背景
这是一个食安监管平台，分为监管端（教育局/监管机构域）与学校端（按 school_id 隔离）。

# 统一术语与层级 Scope
- PLATFORM_SUPER：平台根账号，仅内部持有；不可删除，可改密/找回。
- REGULATOR_ADMIN：监管端超管；看不到 PLATFORM_SUPER。
- REGULATOR_ACADEMIC：监管端教务/业务角色，仅业务数据读/导出。
- SCHOOL_OWNER：学校端超级管理员（单校域最高），不可删除自身；保证至少一个 OWNER 存活。
- SCHOOL_ADMIN：学校端管理员（受限于 OWNER 配置的权限包）。

# 端别差异化目标
- 监管端：多校聚合、强审计、严格跨校访问控制、可观测与导出吞吐。
- 学校端：本校高频 CRUD、强自我保护、软删除、弱网容忍、最小暴露面（流/密钥不出校域）。

# 权限对象（resource）与动作（action）
- 资源示例：Tenant、School、Campus、User、Role、Permission、Device、Camera、AI_Capture、FoodSafety（晨检/留样/快检/消毒/卫生）、Inventory、Stream、Report、AuditLog、Config。
- 动作：R读、C建、U改、D删、M成员管理、B绑定/授权、A敏感操作、S配置策略、EX导出、IMP导入。

# 权限矩阵（默认策略）
请初始化一张 role_permissions 表，并写入如下矩阵：
- PLATFORM_SUPER：全量 CRUDMAS（跨租户）
- REGULATOR_ADMIN：监管域 CRUDMAS；下属学校档案 CRU/B；聚合与监管数据只读/导出；配置 S
- REGULATOR_ACADEMIC：仅业务数据与报表只读/导出；不具备超管能力
- SCHOOL_OWNER：本校全量 CRUDMAS；不可删除自身；至少一 OWNER 存活
- SCHOOL_ADMIN：本校 CRU；D 仅限非关键实体；删除关键数据需 OWNER 授权；不可删除自身与 OWNER

实现要求：
- 权限点形如 `resource:action:scope`（持久化时分列 resource/action/scope），匹配时允许通配（`resource:*`、`*:*`）。
- REGULATOR_* 不得拥有 SCHOOL 私域密钥相关权限；取流需临时授权（下文说明）。

# 系统约束（必须在代码中实现校验）
1. 最小权限：所有查询必须校验 resource:action:scope 粒度。
2. 多租隔离：所有查询默认注入 tenant_id/school_id，DAO 层强校验。
3. 自我保护：
   - 不允许删除自身账号
   - 不允许使本校最后一个 OWNER 失效
4. 审计：所有敏感操作（A/S/D）写入 audit_logs（记录操作者、资源、前后值、IP、UA、时间）。
5. 凭证不外泄：流地址/密钥仅在学校私域；监管端取流需“临时授权+审计”。
6. 删除=停用（soft delete），保留审计链。

补充约束：
- 路由层强隔离：以 `/r/*` 归属监管域、`/s/*` 归属学校域；JWT 中 scope 必须与域匹配。
- 跨校访问：学校端任何带 `:schoolId` 的接口参数必须与 JWT.profile.school_id 一致，否则直接 403。
- 导出与大查询：强制服务端分页与任务化导出，避免锁表；导出落盘至对象存储并回传下载地址（审计）。

# 数据库表
- tenants(id, type[PLATFORM/REGULATOR/SCHOOL], parent_id, name, status,…)
- campuses(id, school_id, name,…)
- users(id, tenant_id, phone, email, pwd_hash, mfa_secret, status,…)
- roles(id, tenant_id, code, name, scope, is_system,…)
- permissions(id, resource, action, scope,…)
- role_permissions(role_id, permission_id)
- user_roles(user_id, role_id)
- audit_logs(id, actor_user_id, resource, action, before, after, ip, ua, ts,…)

索引建议：
- users(tenant_id), roles(tenant_id), user_roles(user_id, role_id), role_permissions(role_id, permission_id)
- audit_logs(actor_user_id, ts desc), permissions(resource, action, scope)

# 输出要求
1. NestJS 模块化代码：
   - entities（User、Role、Permission、AuditLog…）
   - repositories（强制注入 tenant_id/school_id 过滤，封装 QueryBuilder）
   - services（包含校验逻辑：最小权限、自我保护、软删除）
   - guards/interceptors（JWT + 权限校验 + Scope 路由前缀校验）
2. 初始化脚本：在 migration 或 seed 中写入默认角色与权限矩阵。
3. 审计中间件：拦截敏感操作写入 audit_logs。
4. 示例 API：
   - POST /schools → 仅 REGULATOR_ADMIN 可调用
   - POST /users → SCHOOL_OWNER/SCHOOL_ADMIN 调用；含校验不可删除自身/不可失去最后 OWNER
   - GET /reports → 权限点控制导出
5. README：说明角色体系、默认策略、如何扩展新 resource/action、如何审计。

请直接生成完整代码结构与关键实现片段，重点包含以下关键细节：

一、权限校验与装饰器
- 装饰器：`@Perm('resource:action', 'SCHOOL'|'REGULATOR')`，配合守卫 PermissionGuard。
- PermissionGuard：
  - 从 JWT 解析 scope、tenant_id、school_id、permissions。
  - 校验路由前缀与 scope，一致性不通过直接 403。
  - 解析装饰器需求集合，支持通配匹配与多项“任一命中”。

二、DAO 层多租隔离
- BaseRepository 封装：
  - `withTenant(qb, { tenantId, schoolId? })` 自动注入 where 条件。
  - 统一 `findOneById(id, ctx)` 与 `findPaged(filter, ctx)` 均强制调用 `withTenant`。
- TypeORM Subscriber：对含 tenant_id/school_id 的实体，持久化与查询均强校验上下文。

三、软删除与自我保护
- 实体启用 `@DeleteDateColumn()`；删除改为 `softRemove`。
- Service 层删除用户：
  - 禁止删除自身（比较 actor_user_id === target.id）。
  - 删除 OWNER 前统计本校 OWNER 数量，若仅剩 1 则拒绝。

四、审计
- Nest Interceptor：拦截 A/S/D 动作，记录 before/after（敏感字段脱敏），落 audit_logs。
- 为导出/取流等关键读操作记录审计摘要（不存完整数据）。

五、临时授权（取流示例）
- 学校端 API：`POST /s/streams/:cameraId/tickets` 需 `stream:B`，返回 `{ticket, expiredAt}`，写审计。
- 监管端 API：`GET /r/streams/play?ticket=...` 需 `stream:R`，校验 ticket，成功后反代播放（不泄露学校私钥）。
- Ticket 存储：Redis，TTL 60~300s，一次性；结合限流与 IP 绑定。

六、初始化与种子
- migration：建表 + 索引。
- seed：写入默认角色（REGULATOR_ADMIN、REGULATOR_ACADEMIC、SCHOOL_OWNER、SCHOOL_ADMIN）与其 role_permissions 矩阵；创建平台根账号。

七、示例代码片段（需给出）
- PermissionGuard（解析 JWT、校验前缀与权限）。
- `@Perm()` 装饰器定义。
- BaseRepository 的 `withTenant()` 与 `findPaged()` 示例。
- 用户删除 Service 片段（自我保护 + 软删除）。
- 审计拦截器片段（脱敏规则示例）。

八、扩展指引
- 新增 resource/action 的步骤（建 `permissions`，绑定 `role_permissions`，前后端常量与校验同步）。
- 性能建议：聚合报表使用只读从库或物化视图；导出使用任务队列（e.g., BullMQ）。
