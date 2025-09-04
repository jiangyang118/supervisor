# 食品安全智慧管理云平台 — Monorepo（Skeleton）

本仓库为单体 Monorepo（pnpm 工作区），包含：
- 统一后端网关（NestJS + Swagger + MySQL）
- 前端学校端与监管端（Vite + Vue3）
- 智慧食安驾驶舱（大屏）
- 基础设施（docker compose + nginx）与常用脚本

## 技术栈
- Node.js 20
- 前端：Vue 3、Vite、TypeScript、Pinia、Vue Router、Element Plus
- 后端：NestJS（`services/gateway-service`）
- 数据/中间件：MySQL 8、Redis、MinIO、Kafka
- 反向代理：Nginx

## 目录结构
- `apps/`
  - `web-school`：学校端 Web
  - `web-regulator`：监管端 Web
  - `screen`：智慧食安驾驶舱（大屏）
  - `mobile-device`：移动端（设备管理，UniApp 壳）
  - `mobile-emergency`：移动端（应急管理，UniApp 壳）
- `services/`
  - `gateway-service`：统一网关与后端
- `libs/`
  - `shared/models`：通用 TS 模型与 Zod 校验
  - `db`：预置 Prisma Client（可选）
- `infra/`：docker-compose 与 nginx 配置
- `scripts/`：开发/演示脚本

## 快速开始
前置：Node 20，pnpm（或使用 npm 工作区）。

- 安装依赖：`pnpm i`
- 本地开发：
  - 启动全部（HMR）：`make dev-all`
  - 仅后端（HMR）：`make dev-services`
  - 仅前端：在 `apps/web-school`、`apps/web-regulator` 分别 `npm run dev`
- 构建：`pnpm build`（或 `npm run build --workspaces --if-present`）

## 启动方式

### 方式一：Docker 启动（推荐）
- 启动基础设施与网关：
  - `docker compose -f infra/docker-compose.yml up -d mysql redis minio zookeeper kafka kafka-ui gateway-service nginx`
- 数据库初始化：服务启动时会自动执行迁移与初始化（可通过 `DB_AUTO_MIGRATE=0` 关闭）。
  - 也可手动执行迁移：`make migrate`
  - 或：`DATABASE_URL="mysql://foodsafe:secret@127.0.0.1:3306/foodsafe" pnpm -C services/gateway-service db:migrate`
- 查看日志：
  - `docker compose -f infra/docker-compose.yml logs -f gateway-service`

启动成功后（浏览器访问）：
- 网关健康检查：`http://localhost:3300/health`
- OpenAPI 文档（经 Nginx）：`http://localhost/api/docs`
- Kafka UI：`http://localhost:8080`
- MinIO 控制台：`http://localhost:9001`（默认 `minioadmin/minioadmin`）

前端（需本地启动）：
- 学校端：`cd apps/web-school && npm i && npm run dev`（默认 `http://localhost:5173`）
- 监管端：`cd apps/web-regulator && npm i && npm run dev`（默认 `http://localhost:5174`）
- 大屏：`cd apps/screen && pnpm dev`（默认 `http://localhost:5208`）
- 与容器网关联调：前端设置 `VITE_API_BASE=http://<宿主机IP>:3300`

### 方式二：Make 本地启动（多环境）
- 环境切换：通过 `ENV` 选择 `local|test|prod`（默认 `local`）
  - 本地：`make dev-local`（或 `make dev-all ENV=local`）
  - 测试：`make dev-test`
  - 生产模拟：`make dev-prod`
- 数据库连接：优先读取 `.env` 和 `.env.$(ENV)`；你也可以直接覆盖 `DATABASE_URL`/`MYSQL_*` 环境变量。
  - 本地默认示例：`DATABASE_URL=mysql://root:ygyg1344@127.0.0.1:3306/foodsafe`
- 迁移与初始化：
  - 自动执行：非生产环境默认自动执行（`DB_AUTO_MIGRATE` 未设置或为 `1/true`）
  - 手动执行：`make migrate ENV=local`

### 停止与清理
- Docker 停止：
  - 停止但保留容器：`docker compose -f infra/docker-compose.yml stop`
  - 完全停止并删除容器/网络：`docker compose -f infra/docker-compose.yml down`
  - 同时删除数据卷（会清空 MySQL/MinIO 数据）：`docker compose -f infra/docker-compose.yml down -v`
- 本地开发停止：
  - 使用 `make dev-*` 启动的开发进程：在对应终端按 `Ctrl+C` 结束。
  - 使用 `make start-services`（无 HMR）启动的进程：`make stop-services` 结束后台网关进程。
  - 如需手动：查找并结束占用 3300 端口的进程（macOS 示例）`lsof -i :3300 -sTCP:LISTEN -Pn`。

## 环境变量
- 复制 `.env.example` 为 `.env` 并按需配置。
- 数据库可通过 `DATABASE_URL` 或 `MYSQL_*`（`MYSQL_HOST/PORT/USER/PASSWORD/DATABASE`）配置。
 - 多环境文件：可另存 `.env.local`、`.env.test`、`.env.prod`，通过 `ENV=...` 自动加载。

## 运行（后端与接口）
- 运行网关：`cd services/gateway-service && npm i && npm run dev`（默认 `http://localhost:3300`）
- 监管侧：`POST /regulator/morning-checks/push`、`GET /regulator/morning-checks`
- 学校侧：`GET/POST /school/morning-checks`、`PATCH /school/morning-checks/:id/measure`
- 鉴权（可选）：设置 `INGEST_API_KEY` 后，监管侧接口需带 `x-api-key: <同值>`
- 兼容路径：同时支持以 `/api/` 前缀访问相同路由。

## 晨检对接（MEGO）
- 设备心跳：`POST /device/morningChecker/heartBeatInfo`（`application/x-www-form-urlencoded`，参数 `equipmentCode`/`machineCode`）
- 晨检数据：
  - 监管侧接收：`POST /regulator/morning-checks/push`
  - 学校侧管理：`GET/POST /school/morning-checks`

示例（curl）：
```
curl -X POST http://localhost:3300/regulator/morning-checks/push \
  -H 'Content-Type: application/json' \
  -d '{"schoolId":"1","schoolName":"示例学校","staff":"张三","temp":36.6}'

curl -X POST http://localhost:3300/school/morning-checks \
  -H 'Content-Type: application/json' \
  -d '{"schoolId":1,"staff":"李四","temp":36.5,"source":"manual"}'
```

## 学校端快速体验
- 首页：查看“入/出库、卫生合格率、设备在线率、AI 预警、家长满意度”等 KPI 与图表。
- 每日报表：按日期/餐次查看“晨检/留样/消毒/陪餐/废弃物/AI 预警”等汇总；支持 CSV 导出（前端）。
- AI 事件：学校端“AI 汇总/事件”查看/处置；监管端可联动巡查任务与远程提醒。
- 明厨亮灶：配置 `WVP_BASE` 后可播放（当前为占位）。
- 终端用户手册：见 `docs/USER_GUIDE_ENDUSER.md`、`docs/USER_MANUAL.md`。

## 测试与质量
- Lint（Prettier）：`npm run lint`
- Lint（ESLint）：`npm run lint:eslint`（自动修复：`npm run lint:fix`）
- Type Check（vue-tsc）：`npm run typecheck`
- E2E（Playwright）：
  - 浏览器依赖安装：`npx playwright install`
  - 运行：`npm run test:e2e`
  - 报告：`npm run e2e:report`
  - 细节：见根目录 `TESTING.md`

CI 示例：`.github/workflows/ci.yml`

## 提交规范（Husky + Commitlint）
- 初始化：`npm run prepare`（安装 husky 钩子）
- 依赖：`@commitlint/cli @commitlint/config-conventional`

## 已实现（前端演示）
- 学校端：概览、每日报表、AI 预警占位、明厨亮灶入口、晨检、留样记录/清理、陪餐、农残快检、消毒、废弃物、卫生检查/资产维护、出入库/库存/索证/添加剂、供应商、仓库、资质证件、应急入口、隐患、预警、设备、统计、食安指数、系统配置入口。
- 监管端：总览、每日报表入口、AI 巡查入口、明厨亮灶入口、台账（晨检/留样/陪餐/农残/消毒/废弃物/出入库+索证+添加剂）、演示大屏、预警/统计/食安指数/系统配置入口。

## 待办
- 鉴权与登录（JWT + 角色 + 多租户）
- 后端模块完善与 OpenAPI 覆盖提升
- 数据层迁移与种子数据（学校/食堂/人员/设备/摄像头/台账/AI 事件）
- 导出能力：CSV/Excel/PDF 模板
- AI 事件链路：摄取 → Kafka → 持久化与推送 → 前端看板（SSE/WebSocket）
- 视频：RTSP/回放/快照对接
- 移动端（UniApp）：页面与统一鉴权对齐
- DevOps：Dockerfile/compose、.env.example、Makefile、CI
- 质量：关键页面 E2E、后端单测、Lint/Prettier/Husky/Commitlint

## OpenAPI
- 启动网关后访问：`http://localhost/api/docs`
