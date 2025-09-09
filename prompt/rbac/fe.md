你是资深前端架构师，请用 **Vue3 + TypeScript + Pinia + Vue Router + Element Plus + Vite** 为“食安监管平台（监管端/学校端）”生成一套高可用的 RBAC 前端落地方案，覆盖登录、权限拉取、路由守卫、菜单渲染与按钮级权限控制，并对【学校端】与【监管端】进行差异化优化。方案需可运行、可切换真实接口，附 README。

优化目标：
- 学校端：聚焦本校业务高频操作（台账、明厨亮灶、出入库、留样等），入口清晰、按钮权限细颗粒，离线/弱网更稳。
- 监管端：聚焦多校监管视角（总览、学校档案、专项监管、报表导出），跨域路由权限与检索性能优先。

# 角色/域（与后端约定一致）
- 作用域 Scope：PLATFORM / REGULATOR / SCHOOL
- 角色：PLATFORM_SUPER、REGULATOR_ADMIN、REGULATOR_ACADEMIC、SCHOOL_OWNER、SCHOOL_ADMIN
- 权限点命名：`<resource>:<action>`，支持通配 `*`
- 典型资源示例（需可扩展）：tenant、school、campus、user、role、permission、device、camera、ai_capture、food_safety、inventory、stream、report、audit、config
- 典型动作：R/C/U/D/M/B/A/S/EX/IMP

# 多端入口与路由前缀
- 入口区分：
  - 监管端：默认前缀 `/r`，示例：`/r/dashboard`、`/r/schools`。
  - 学校端：默认前缀 `/s`，示例：`/s/overview`、`/s/ledger`。
- 登录后根据用户 `scope` 与 `profile.school_id` 自动跳转对应首页（监管端跳转多校总览，学校端跳转本校总览）。

# 目录结构
src/
  main.ts
  router/
    index.ts            # 路由 & meta.perms
    guards.ts           # beforeEach：登录校验 & 权限校验 & 首次拉取 me/permissions
  store/
    auth.ts             # token/profile/roles/permissions/scope，持久化
    menu.ts             # 根据 permissions + scope 过滤可见菜单
  api/
    http.ts             # Axios 封装（token 注入、401 刷新、错误处理）
    auth.ts             # login/refresh/logout/me
    rbac.ts             # 拉取角色/权限点
    report.ts           # 报表导出（监管端高频）
  directives/
    perm.ts             # v-perm 指令 & <Permission> 组件
  layouts/
    AppLayout.vue       # 左侧菜单（按权限过滤）+ 顶部用户区 + 端别切换（仅内部调试）
  pages/
    login/index.vue
    dashboard/index.vue # 监管端总览
    overview/index.vue  # 学校端总览
    settings/{user,role,policy}/index.vue
    error/{403.vue,404.vue}
  mocks/
    auth.mock.ts
    rbac.mock.ts
  types/
    auth.ts
    rbac.ts
  utils/
    perm.ts             # 权限匹配、公用工具

# 登录 & 会话
- /login：账号/密码；成功后保存 accessToken/refreshToken、profile(tenant_id/school_id)、roles、permissions
- 401 自动刷新一次，失败则登出到 /login
- 会话持久化（localStorage），刷新页面不丢失
- 首次登录后并行拉取：用户信息（/auth/me）、权限（/auth/me 或 /rbac/permissions）、端别首页必要数据（提升首屏）

# 路由与守卫
- 路由 meta：
  - meta.requiresAuth = true
  - meta.perms = ['food_safety:R', 'report:EX']  // 命中任一即可
- 守卫逻辑：
  1) 未登录 → /login（带上 redirect）
  2) 首次进入且未拉取权限 → await loadMe() 再判定
  3) 已登录但无 meta.perms → 直接放行
  4) 有 meta.perms → 调用 hasPerm() 校验，失败 → /403
  5) 强制 scope 路由：访问 `/r/*` 必须 scope=REGULATOR，访问 `/s/*` 必须 scope=SCHOOL

# 菜单渲染
- 菜单项结构：{ path, name, icon, children?, requiredPerms?: string[] }
- 根据 store.auth.permissions + scope 过滤显示
- 监管端与学校端菜单根据 scope 自动切换（REGULATOR 展示监管菜单；SCHOOL 展示学校菜单）
- 支持「强制保留但禁用」模式用于教学/引导（通过 v-perm:disabled）

# v-perm 指令（按钮级）
- 使用：`v-perm="'report:EX'"` 或 `v-perm="['user:C','user:U']"`
- 支持两种模式：
  - 默认：无权限直接不渲染
  - `v-perm:disabled`：无权限时渲染但禁用（样式置灰，并加 tooltip “无权限”）

# 权限计算
- hasPerm(perm: string|string[])：
  - 支持完全匹配（resource:action）
  - 支持通配：`resource:*`、`*:*`
  - 多角色合并去重
  - 允许传 scope（如 SCHOOL/REGULATOR），若传 scope 则要求用户 scope 匹配
  - 可选传上下文过滤：`{ schoolId }`，当存在时，仅在 `profile.school_id === schoolId` 判定为通过（用于学校端跨校隔离）

# API 协议（可 Mock）
- POST /auth/login {username,password} → {accessToken,refreshToken,profile:{id,tenant_id,school_id,scope},roles:string[],permissions:string[]}
- POST /auth/refresh {refreshToken} → {accessToken}
- GET /auth/me → {profile,roles,permissions}
- GET /reports/export?range=... → Blob（二进制导出，需 report:EX）

# 示例菜单（可扩展）
- 监管端（REGULATOR）：
  - 总览 Dashboard（report:R）
  - 学校档案（school:R）
  - 专项监管（food_safety:R）
  - 报表中心（report:EX）
  - 审计日志（audit:R）
  - 配置策略（config:S）
- 学校端（SCHOOL）：
  - 学校总览（report:R）
  - 台账中心（food_safety:R）
  - 出入库（inventory:R）
  - 明厨亮灶（stream:R）
  - 留样与快检（food_safety:R）
  - 系统设置（user:R, role:R）

# 学校端优化要点
- 首屏并行预取：本校基础信息、近 7 天台账概览、摄像头在线数（减少首屏白屏）。
- 常用操作置顶：台账新增、出入库扫码、留样登记（可放置快捷按钮）。
- 网络容错：接口失败降级为空态 + 兜底提示，不阻塞其它区域渲染。
- 权限更细颗粒：如“导出”与“批量导出”分别控制（report:EX 和 report:EX_BULK）。

# 监管端优化要点
- 全局检索与筛选：学校名称/学段/区域/风险标签等，服务端分页。
- 导出体验：任务化导出，弹出任务中心（需 report:EX），完成后下载；避免大导出卡顿。
- 跨校权限：严格依赖权限点与组织结构，路由访问 `/r/schools/:id` 验证是否可见。
- 审计可见：页面级展示最近 20 条敏感操作（仅只读，不含敏感值）。

# 关键代码点（请实现）
1) store/auth.ts
   - state: token, refreshToken, profile, roles, permissions, scope
   - actions: login, refresh, logout, loadMe
2) utils/perm.ts
   - export function hasPerm(required:string|string[], owned:string[]): boolean
   - 通配匹配规则：'tenant:*' 命中 'tenant:R'；'*:*' 万能
3) router/guards.ts
   - 应用 requiresAuth & meta.perms 校验 & scope 前缀校验
 4) directives/perm.ts
   - v-perm & v-perm:disabled 实现
 5) layouts/AppLayout.vue
   - 左侧菜单按 requiredPerms 过滤；顶部展示用户信息与退出
 6) pages/login/index.vue
   - 表单、错误提示、回车提交、记住我
 7) api/report.ts
    - 导出接口返回 Blob；结合 v-perm 控制导出按钮

# mocks（默认账号）
- admin / 123456 → REGULATOR_ADMIN，permissions=['*:*']
- owner / 123456 → SCHOOL_OWNER，permissions=['report:*','food_safety:*','inventory:*','stream:*','user:*','role:*']
- staff / 123456 → SCHOOL_ADMIN，permissions=['food_safety:R','inventory:R']

# README
- 说明角色/权限点命名规范（resource:action + 通配）
- 如何切换 Mock/真实接口（VITE_USE_MOCK）
- 如何新增资源/动作、如何在菜单与路由中声明权限
- 示例：如何在按钮上用 v-perm 保护“导出”
 - 端别说明：`/r` 与 `/s` 路由前缀、默认首页与跨端跳转限制

# 验收
- 未登录访问受保护路由 → /login
- 不同账号看到不同菜单；访问无权限路由 → /403
- 按钮级控制生效：无权限“导出”不可见或禁用
- 刷新页面权限不丢失；401 自动刷新一次 token
 - 监管端不得访问学校端前缀 `/s/*`，反之亦然
