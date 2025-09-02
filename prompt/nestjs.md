# 角色
你是资深后端架构师。请用 NestJS v10、TypeScript、TypeORM 0.3+、MySQL 8 实现一个采用“分层架构（Controller → Service → Repository → DataSource）”的企业级项目。要求输出**完整可运行代码**与**README**，并给出迁移/种子/测试/Swagger 文档。不要留 TODO。



# 技术与依赖
- NestJS v10（@nestjs/config、@nestjs/swagger、class-validator、class-transformer）
- TypeORM 0.3+（DataSource 配置）+ MySQL 8
- 统一日志（winston 或 pino），全局 ValidationPipe，异常过滤器 HttpExceptionFilter，成功响应拦截器 TransformInterceptor
- 认证：JWT（访问令牌+刷新令牌），密码 hash（bcrypt）
- Swagger：路径 `/docs`
- 测试：Jest（unit + e2e）
- 代码风格：ESLint + Prettier；git 提交钩子可选

# 目录结构（请生成）
.
├─ src/
│  ├─ app.module.ts
│  ├─ common/
│  │  ├─ filters/http-exception.filter.ts
│  │  ├─ interceptors/transform.interceptor.ts
│  │  ├─ pipes/validation.pipe.ts
│  │  └─ utils/paginate.ts
│  ├─ config/
│  │  ├─ configuration.ts            # 读取 .env 并导出强类型 Config
│  │  └─ typeorm.config.ts           # TypeORM DataSourceOptions
│  ├─ database/
│  │  ├─ datasource.ts               # new DataSource(...)
│  │  ├─ migrations/                 # 迁移文件
│  │  └─ seed/seed.ts                # 种子脚本
│  ├─ auth/                          # 模块化 + 分层
│  │  ├─ auth.module.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.service.ts
│  │  ├─ dto/login.dto.ts
│  │  └─ strategies/{jwt.strategy.ts, refresh.strategy.ts}
│  ├─ users/
│  │  ├─ users.module.ts
│  │  ├─ users.controller.ts
│  │  ├─ users.service.ts
│  │  ├─ users.repository.ts
│  │  ├─ dto/{create-user.dto.ts, update-user.dto.ts}
│  │  └─ entities/user.entity.ts
│  ├─ suppliers/
│  │  ├─ suppliers.module.ts
│  │  ├─ suppliers.controller.ts
│  │  ├─ suppliers.service.ts
│  │  ├─ suppliers.repository.ts
│  │  ├─ dto/{create-supplier.dto.ts, update-supplier.dto.ts, query-supplier.dto.ts}
│  │  └─ entities/supplier.entity.ts
│  ├─ inventory/
│  │  ├─ inventory.module.ts
│  │  ├─ inventory.controller.ts
│  │  ├─ inventory.service.ts
│  │  ├─ inventory.repository.ts
│  │  ├─ dto/{create-item.dto.ts, update-item.dto.ts, stock-move.dto.ts}
│  │  ├─ entities/{inventory-item.entity.ts, inventory-log.entity.ts}
│  │  └─ enums/move-type.enum.ts
│  └─ main.ts
├─ test/{unit,e2e}/...
├─ docker-compose.yml
├─ ormconfig.mts / or use src/config/typeorm.config.ts
├─ .env.example
└─ README.md

# 数据模型（TypeORM 实体，含索引/唯一约束，时间戳）
User(id pk uuid, username unique, passwordHash, role enum('admin','user'), createdAt, updatedAt)
Supplier(id pk uuid, name unique, contactName nullable, contactPhone nullable, createdAt, updatedAt)
InventoryItem(id pk uuid, sku unique, name, unit, quantity decimal(18,3) default 0, createdAt, updatedAt)
InventoryLog(id pk uuid, itemId fk, moveType enum('IN','OUT'), qty decimal(18,3), operatorId fk User, remark nullable, createdAt)

# 关键实现要求
1) **分层**：Controller 仅接收/返回 DTO；Service 写业务；Repository 只封装持久化（TypeORM QueryBuilder），禁止在 Service 里直接操作 DataSource。
2) **事务**：入库/出库接口在 Service 层使用 `QueryRunner` 开启事务：更新 InventoryItem.quantity，同步插入 InventoryLog。
3) **验证与映射**：
   - DTO 上使用 class-validator（必填、长度、枚举、正数等）。
   - 全局 ValidationPipe：`transform: true, whitelist: true, forbidNonWhitelisted: true`。
4) **错误处理**：Repository 捕获唯一约束/外键错误并抛出业务异常；全局 HttpExceptionFilter 统一返回：
   ```json
   { "success": false, "code": 400|409|500, "message": "...", "path": "...", "timestamp": "ISO" }
