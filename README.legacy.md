# 食品安全智慧管理云平台 — Monorepo（Skeleton，已重构）

本仓库为单体 Monorepo 骨架（pnpm 工作区）。近期对项目做了较大结构调整：合并/删除历史服务、增加新应用与领域模块，并切换数据库至 MySQL。本文档已同步至当前代码状态。

## 技术栈（已确认）
- Node.js 20
- 前端 Web：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
- 移动端：UniApp（HBuilderX 兼容），提供演示壳工程
- 后端：NestJS（统一为 gateway-service）
- 数据/缓存/对象存储/消息队列：MySQL 8、Redis、MinIO、Kafka
- 反向代理：Nginx（含 WebSocket 转发）

## 重要变更（合并/新增/删除）
- 删除：`services/regulator-service`（已合并至 `gateway-service`）。
- 删除：`services/device-mock` 独立服务（心跳能力改由网关内的 `DeviceMockController` 提供兼容端点）。
- 新增：`apps/screen` 智慧食安驾驶舱（大屏）。
- 新增：`services/gateway-service` 内增设学校/监管分域模块与多类台账模块（晨检、就餐、消杀、农残、废弃物、库存等），并提供 SQL 迁移。
- 数据库：由 PostgreSQL 切换为 MySQL 8；通过 `DATABASE_URL` 或 `MYSQL_*` 环境变量配置；提供 `db:migrate` 迁移脚本。

## 目录结构（当前）
- `apps/`
  - `web-school`：学校端（Vite + Vue3）
  - `web-regulator`：监管端（Vite + Vue3）
  - `screen`：智慧食安驾驶舱（大屏，可 2K/4K 自适配）
  - `mobile-device`：设备管理（UniApp 壳）
  - `mobile-emergency`：应急管理（UniApp 壳）
- `services/`
  - `gateway-service`：统一网关与后端（NestJS + Swagger + MySQL）
- `libs/`
  - `shared/models`：TypeScript 模型与 Zod 校验
  - `db`：预置 Prisma Client（可选）
- `infra/`：docker-compose 与 nginx 配置
- `scripts/`：演示或运维脚本（部分仍在对齐新结构）

## 服务命名规范（统一）
- 规则：`<领域>-service`（kebab-case）；当前仅保留 `gateway-service`。
- Mock/工具：以脚本形式提供（`scripts/`），或在网关内提供兼容端点。
- Docker Compose 服务键：`gateway-service`。

## 快速开始
使用 npm 或 pnpm：确保 Node 20（`node -v`）。

- 安装依赖：`pnpm i`（或 `npm install --workspaces`）
- 本地开发（多包并行）：
  - 一键启动（HMR）：`make dev-all`
  - 前端单独启动：在 `apps/web-*` 运行 `npm run dev`
  - 后端（热更新）：`make dev-services`（nodemon + ts-node + swc）
  - 后端（稳定运行）：`make start-services`（编译后运行 dist）
- 构建：`pnpm build`（或 `npm run build --workspaces --if-present`）

容器演示（推荐使用 docker compose）：
- 启动基础设施与网关：
  - `docker compose -f infra/docker-compose.yml up -d mysql redis minio zookeeper kafka kafka-ui gateway-service nginx`
- 首次需要执行数据库迁移：
  - `make migrate`
  - 或手动：`DATABASE_URL="mysql://foodsafe:secret@127.0.0.1:3306/foodsafe_dev" pnpm -C services/gateway-service db:migrate`
- 查看日志：`docker compose -f infra/docker-compose.yml logs -f gateway-service`
- 备注：`scripts/demo.sh` 正在适配 MySQL 版服务清单，优先使用上述 compose 命令。

容器版启动成功后（浏览器访问）
- 网关 API 健康检查：`http://localhost:3300/health`
- OpenAPI 文档（经 Nginx 转发）：`http://localhost/api/docs`
- Kafka UI：`http://localhost:8080`
- MinIO 控制台：`http://localhost:9001`（默认账号/密码：`minioadmin/minioadmin`，如 `.env` 未覆盖）
- 远程访问：将 `localhost` 换为宿主机 IP，例如 `http://192.168.11.133/api/docs`

前端 Web（容器未包含，需要本地启动）
- 学校端：`cd apps/web-school && npm i && npm run dev`（默认 `http://localhost:5173`）
- 监管端：`cd apps/web-regulator && npm i && npm run dev`（默认 `http://localhost:5174`）
- 大屏端：`cd apps/screen && pnpm dev`（默认 `http://localhost:5208`）
- 与容器网关联调：设置 `VITE_API_BASE=http://<宿主机IP>:3300`

说明：当前为骨架版，可启动基础服务与示例接口。数据库已切换为 MySQL 并提供基础迁移；后续可逐步补全鉴权、AI 事件流、导出等能力。

## 环境变量
复制 `.env.example` 为 `.env` 并按需修改。

## 运行
- 后端（统一：gateway-service）：`cd services/gateway-service && npm i && npm run dev`（默认 `http://localhost:3300`）
  - 监管侧：`POST /regulator/morning-checks/push`、`GET /regulator/morning-checks`（兼容旧路径 `/api/regulator/*`）
  - 学校侧：`GET/POST /school/morning-checks`、`PATCH /school/morning-checks/:id/measure` 等
  - 可选鉴权：设置 `INGEST_API_KEY` 后，`/regulator/*` 调用需带 `x-api-key: <同值>` 头
- 学校端：`cd apps/web-school && npm run dev` 打开 `http://localhost:5173`
- 监管端：`cd apps/web-regulator && npm run dev` 打开 `http://localhost:5174`
- 大屏端：`cd apps/screen && pnpm dev` 打开 `http://localhost:5208`

## 学校端快速体验（推荐给一线用户演示）
- 首页：查看“入/出库、卫生合格率、设备在线率、AI 预警、家长满意度”等 KPI 与图表。
- 每日报表：按日期/餐次查看“晨检/留样/消毒/陪餐/废弃物/AI 预警”等汇总；支持 CSV 导出（前端）。
- AI 事件：学校端“AI 汇总/事件”查看/处置；监管端可联动巡查任务与远程提醒。
- 明厨亮灶：配置 `WVP_BASE` 后可播放（当前为占位）。
- 终端用户手册：详见 `docs/USER_GUIDE_ENDUSER.md`、`docs/USER_MANUAL.md`。

## 测试与质量
- Lint（Prettier）：`npm run lint`
- Lint（ESLint）：`npm run lint:eslint`，自动修复：`npm run lint:fix`
- Type Check（vue-tsc）：`npm run typecheck`
- E2E（Playwright）：
  - 安装浏览器依赖：`npx playwright install`
  - 运行测试：`npm run test:e2e`
  - 查看报告：`npm run e2e:report`
  - 细节与排查：见根目录 `TESTING.md`

CI 示例：见 `.github/workflows/ci.yml`（会跑 Lint/Typecheck/E2E）。

## 提交规范（Husky + Commitlint）
- 已添加 `.husky` 与 `commitlint.config.cjs` 配置。
- 首次安装：`npm run prepare`（安装 husky 钩子）。
- 若缺少 commitlint 依赖：`npm i -D @commitlint/cli @commitlint/config-conventional`。

## 已实现（前端演示）
- 学校端：概览、每日报表（占位导出按钮）、AI 预警占位、明厨亮灶入口、晨检、留样记录/清理、陪餐、农残快检、消毒、废弃物、卫生检查/资产维护、出入库/库存/索证/添加剂、供应商、仓库、资质证件、应急入口、隐患、预警、设备、统计、食安指数、系统配置入口。
- 监管端：总览、每日报表入口、AI 巡查入口、明厨亮灶入口、各类台账（晨检/留样/陪餐/农残/消毒/废弃物/出入库+索证+添加剂）、演示大屏、预警/统计/食安指数/系统配置入口。

说明：当前为可运行的前端演示版，表格/筛选（部分）、新增/处置（部分）、CSV 导出（前端）已可用。

## 待办（下次迭代）
- 鉴权与登录：统一登录、角色与租户隔离（JWT + Pinia 状态）。
- 后端 API：继续完善 `gateway-service` 模块，OpenAPI 覆盖度提升。
- 数据层：补充迁移与种子数据（学校/食堂/人员/设备/摄像头/台账/AI 事件样例）。
- 导出：后端导出 CSV/Excel、PDF 报表模板（每日报表、预警看板）。
- AI 事件：ai-vision-service（Mock 定时产出）→ Kafka → alert-service 入库与推送，前端 WebSocket 看板联动。
- 视频：iot-service（RTSP/回放/快照 Mock），前端明厨亮灶页面接入快照与通道配置。
- 设备移动端/应急移动端：UniApp 骨架与页面对齐，接统一鉴权。
- DevOps：Dockerfile、docker-compose（MySQL/Redis/MinIO/Kafka/Nginx）、.env.example、Makefile、scripts/demo.sh、CI（GitHub Actions）。
- 质量：关键页面 E2E、后端单测覆盖、Lint/Prettier/Husky/Commitlint。

## OpenAPI
- API 文档：启动 gateway-service 后访问 `http://localhost/api/docs`

## 晨检对接（MEGO）说明（最新）
重构后不再提供独立的 `services/device-mock` 服务；为保留兼容性，在 `gateway-service` 内提供心跳端点：
- `POST /device/morningChecker/heartBeatInfo`（`x-www-form-urlencoded`，参数 `equipmentCode`/`machineCode`）

演示脚本（`scripts/mego.*`）仍包含对历史 `device-mock` 的引用，后续会统一迁移到网关或纯脚本模式。当前建议：
- 启动 `gateway-service` 后，直接通过监管或学校端 API 进行演示：
  - 推送晨检记录（监管侧接收）：`POST /regulator/morning-checks/push`
  - 学校侧查询/写入：`GET/POST /school/morning-checks`
  - 兼容旧路径：`/api/regulator/*`、`/api/school/*` 会被自动归一化

示例（curl，本机端口 3300）：

```
curl -X POST http://localhost:3300/regulator/morning-checks/push \
  -H 'Content-Type: application/json' \
  -d '{"schoolId":"1","schoolName":"示例学校","staff":"张三","temp":36.6}'

curl -X POST http://localhost:3300/school/morning-checks \
  -H 'Content-Type: application/json' \
  -d '{"schoolId":1,"staff":"李四","temp":36.5,"source":"manual"}'
```

## 环境与脚本（说明）
- `.env.example`：包含常用端口与连接字符串示例（已切换为 MySQL）。
- `scripts/demo.sh`：容器一键脚本，正在适配 MySQL 版服务清单；建议直接使用上文的 docker compose 命令。

## 验收映射（参考）
- 场景1（心跳/在线）：POST 心跳端点成功，设备列表在线状态更新。
- 场景2（晨检上报/回传）：通过监管 `push` 或学校侧 `create` 产生记录，前端页面可查询与导出。
- 场景3（报表/台账）：监管端台账页可基于网关持久化数据查询与统计。

## 技术栈（已确认）
- Node.js 20
- 前端 Web：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
- 移动端：UniApp（HBuilderX 兼容），提供演示壳工程
- 后端：NestJS（gateway-service、user-service 示例）
- 数据/缓存/对象存储/消息队列：PostgreSQL、Redis、MinIO、Kafka
- 反向代理：Nginx（含 WebSocket 转发）

## 目录结构
- apps/
  - web-school 学校端（Vite + Vue3）
  - web-regulator 监管端（Vite + Vue3）
  - mobile-device 设备管理（UniApp 壳）
  - mobile-emergency 应急管理（UniApp 壳）
- services/
  - gateway-service 网关（NestJS + Swagger）
  - device-mock 设备端 Mock（心跳/员工/晨检上报 + CLI）
  - regulator-service 已合并至 gateway-service（原独立服务已移除）
- libs/shared/models TypeScript 接口 + Zod 校验
- infra/ docker-compose 与 nginx 配置
- scripts/ 一键演示脚本骨架

## 服务命名规范（统一）
- 规则：`<领域>-service`（kebab-case），示例：`gateway-service`。
- Mock/工具：带 `-mock` 或放在 scripts 下（如 `device-mock`）。
- Docker Compose 中服务键：`gateway-service`。

## 快速开始
使用 npm（免 Corepack）：确保 Node 20，运行 `npm --version` 验证

- 安装依赖（工作区）：`npm install --workspaces`
- 本地开发（多包并行）：
  - 一键启动（全仓库热更新/HMR）：`make dev-all` 或 `npm run dev:all`
  - Web（HMR）：`make dev-web` 或分别在 `apps/web-*` 里 `npm run dev`
  - 后端（热更新）：`make dev-services`（nodemon + ts-node + swc 监听 TS 变更自动重启）
  - 后端（稳定运行，无热更新）：`make start-services`（编译后跑 dist）
  - 也可运行：`npm run dev --workspaces --if-present`（顺序启动，可能只保留第一个阻塞的服务）
- 构建：`npm run build --workspaces --if-present`
- 一键演示（容器）：`bash scripts/demo.sh`
  - 前台查看详细日志：`bash scripts/demo.sh --foreground`
  - 国内镜像加速：`bash scripts/demo.sh --cn`（覆盖 Compose 使用国内镜像与 Node 基础镜像）

容器版启动成功后（浏览器访问）
- 网关 API 健康检查：`http://localhost:3300/health`
- OpenAPI 文档（经 Nginx 转发）：`http://localhost/api/docs`
- Kafka UI：`http://localhost:8080`
- MinIO 控制台：`http://localhost:9001`（默认账号/密码：`minioadmin/minioadmin`，如 `.env` 未覆盖）
- 远程访问：将 `localhost` 换为宿主机 IP，例如 `http://192.168.11.133/api/docs`

前端 Web（容器未包含，需要本地启动）
- 学校端：`cd apps/web-school && npm i && npm run dev`（默认 `http://localhost:5173`）
- 监管端：`cd apps/web-regulator && npm i && npm run dev`（默认 `http://localhost:5174` 或 Vite 提示）
- 如网关走容器的 3300 端口，请在前端设置 `VITE_API_BASE=http://<宿主机IP>:3300`（或使用已有默认 `http://localhost:3300`）

同时提供“MEGO 设备对接（本地 Node 版）”一键脚本（无需 Docker）：
- 启动：`bash scripts/mego.sh --host 192.168.11.133`（或省略 host 使用 localhost）
- 启动并自动生成 10 条晨检：`bash scripts/mego.sh --host 192.168.11.133 --emit`
- 如不需要监管端：`bash scripts/mego.sh --skip-reg`
- DEMO-EC-0001 此为页面上的equipmentCode
说明：当前仅为骨架，可启动基础服务与示例接口，后续可逐步补全数据库、鉴权、AI 事件流、导出等能力。

## 环境变量
复制 `.env.example` 为 `.env` 并按需修改。

## 运行
- 后端（合并后，仅 gateway-service）：`cd services/gateway-service && npm i && npm run dev`（默认 `http://localhost:3300`）
  - Regulator 接口：`POST /api/regulator/morning-checks/push`、`GET /api/regulator/morning-checks`
  - 可选鉴权：设置 `INGEST_API_KEY` 后，调用需带 `x-api-key: <同值>` 头
- 学校端：`cd apps/web-school && npm run dev` 打开 `http://localhost:5173`（含 HMR）
- 监管端：`cd apps/web-regulator && npm run dev` 打开 `http://localhost:5174`（含 HMR）

## 学校端快速体验（推荐给一线用户演示）
- 首页：查看“入/出库、卫生合格率、设备在线率、AI 预警、家长满意度”等 KPI 与图表；支持刷新与导出当日数据。
- 每日报表：按日期/餐次查看“晨检/留样/消毒/陪餐/废弃物/AI 预警”等汇总，提供饼图/柱图与入/出库、卫生/设备简表；支持导出 CSV（PDF 为占位）。
- AI 事件：学校端“AI 汇总/事件”可查看并处置；监管端可联动巡查任务与远程提醒。
- 明厨亮灶：查看直播/回放/抓拍与通道；`WVP_BASE` 配置后即可播放。
- 终端用户手册：监管人员与后勤主任请阅读 `docs/USER_GUIDE_ENDUSER.md`；更细分角色清单见 `docs/USER_MANUAL.md`。

## 测试与质量
- Lint（Prettier）：`npm run lint`
- Lint（ESLint）：`npm run lint:eslint`，自动修复：`npm run lint:fix`
- Type Check（vue-tsc）：`npm run typecheck`
- E2E（Playwright）：
  - 安装浏览器依赖：`npx playwright install`（首次执行需要）
  - 运行测试：`npm run test:e2e`
  - 查看报告：`npm run e2e:report`
  - Playwright 会自动启动两端 Web 服务器（4200/4300），等待可用后执行用例。若已手动启动服务，测试会复用现有实例。
  - 更多细节与问题排查，请见根目录 `TESTING.md`。

CI 示例：见 `.github/workflows/ci.yml`（会跑 Lint/Typecheck/E2E）。

## 提交规范（Husky + Commitlint）
- 已添加 `.husky` 与 `commitlint.config.cjs` 配置。
- 首次安装：`npm run prepare`（安装 husky 钩子）。
- 若缺少 commitlint 依赖：`npm i -D @commitlint/cli @commitlint/config-conventional`。

## 已实现（前端演示）
- 学校端：概览、每日报表（占位导出按钮）、AI 预警占位、明厨亮灶入口、晨检、留样记录/清理、陪餐、农残快检、消毒、废弃物、卫生检查/资产维护、出入库/库存/索证/添加剂、供应商、仓库、资质证件、应急入口、隐患、预警、设备、统计、食安指数、系统配置入口。
- 监管端：总览、每日报表入口、AI 巡查入口、明厨亮灶入口、各类台账（晨检/留样/陪餐/农残/消毒/废弃物/出入库+索证+添加剂）、演示大屏、预警/统计/食安指数/系统配置入口。

说明：当前为可运行的前端演示版，各页面支持表格、筛选（部分）、新增/处置（部分）、CSV 导出（前端生成，UTF-8 BOM）。PDF 导出按钮为占位弹窗，待接入后端或前端模板。

## 待办（下次 Codex 继续）
- 鉴权与登录：统一登录、角色与租户隔离（JWT + Pinia 状态）。
- 后端 API：NestJS 服务（gateway-service）+ OpenAPI 文档，按 prompt/init.md 模块分组补齐。
- 数据层：Prisma schema、迁移与种子数据（学校/食堂/人员/设备/摄像头/台账/AI 事件样例）。
- 导出：后端导出 CSV/Excel、PDF 报表模板（每日报表、预警看板）。
- AI 事件：ai-vision-service（Mock 定时产出）→ Kafka → alert-service 入库与推送，前端 WebSocket 看板联动。
- 视频：iot-service（RTSP/回放/快照 Mock），前端明厨亮灶页面接入快照与通道配置。
- 设备移动端/应急移动端：UniApp 骨架与页面对齐，接统一鉴权。
- DevOps：Dockerfile、docker-compose（一键起 Postgres/Redis/MinIO/Kafka/Nginx）、.env.example、Makefile、scripts/demo.sh、CI（GitHub Actions）。
- 质量：关键页面 E2E、后端单测覆盖、Lint/Prettier/Husky/Commitlint。

如需我优先接哪一块，请备注（例如先补后端 API 与数据库）。

## OpenAPI
- API 文档：启动 gateway-service 后访问 `http://localhost/api/docs`

## 备注
- UniApp 项目建议用 HBuilderX 打开进行运行/打包。
- docker-compose 已包含 Postgres/Redis/MinIO/Kafka/Nginx 与示例服务镜像构建（Dockerfile 已改为使用 npm）。
- 单独运行某个包（npm 示例）

# 晨检对接一体化演示（MEGO）

本仓库基于 `prompt/miguo_dev.md` 落地“米果智能晨检仪”端到端对接（学校端 + 监管端 + 设备端 Mock + Web 界面）。

含以下模块（合并后）：
- services/gateway-service：平台网关 + 学校侧集成 + 监管侧接口（OpenAPI 文档/聚合入口）
- services/device-mock：设备端 Mock（心跳/员工/晨检上报 + CLI）
- apps/web-school：学校端 Web（设备管理增强 + 晨检管理增强 + 集成配置 Banner）

说明：为便于演示，服务端使用内存存储，上传图片保存在 `data/uploads/`；后续可替换 SQLite/Prisma。

## 一步跑通（推荐）

1) 启动（3300/4003）
- 本机：`npm run demo:mego`（启动 gateway-service 与 device-mock）
- 内网（将 192.168.11.133 替换为你的主机 IP）：
  - `HOST=192.168.11.133 npm run demo:mego`

2) 启动 Web-School 前端
- `cd apps/web-school && npm i && npm run dev`
- 浏览器打开前端（vite 默认提示的地址，如 http://localhost:5173）。

- 编辑 `apps/web-school/public/integration.config.json`（或使用页面 Banner 的“设置”按钮写入 localStorage）：
  - `"SCHOOL_INTEGRATION_BASE": "http://192.168.11.133:3300"`
  - `"MEGO_CANDIDATES": "http://192.168.11.133:4003"`
- 刷新前端页面，顶部出现“设备集成”绿色 Banner，点“测试连接”应为“已连接”。

4) 设备自动搜索接入（设备管理）
- Web-School → 菜单“设备” → “新增设备（米果晨检仪）”
- 填写：
  - `equipmentCode`: `DEMO-EC-0001`
  - 候选上游域名池：`http://192.168.11.133:4003`
- 点击“自动搜索” → 显示“米果智能晨检仪（已兼容）”，可“保存并接入”。

5) 员工缓存与查看
- 在抽屉中点击“刷新员工缓存” → 成功后显示员工列表（含健康证起止日期）。

6) 生成并查看晨检记录
- 方式 A（批量自动）在另一个终端生成 10 条数据：
  - 本机：`npm run demo:mego:emit`
  - 内网：`HOST=192.168.11.133 npm run demo:mego:emit`
  - 命令解读：
    - 作用：依次执行“心跳 → 员工缓存刷新 → 循环上报 10 条晨检（含占位图片）”。
    - 默认目标：`SCHOOL_API_BASE=http://localhost:4001`、`REGULATOR_API_BASE=http://localhost:4002`、`DEVICE_MOCK_BASE=http://localhost:4003`、`EQUIPMENT_CODE=DEMO-EC-0001`。
    - 自定义：可通过环境变量覆盖上述地址，例如
      - `SCHOOL_API_BASE=http://<IP>:4001 REGULATOR_API_BASE=http://<IP>:4002 DEVICE_MOCK_BASE=http://<IP>:4003 EQUIPMENT_CODE=DEMO-EC-0001 npm run demo:mego:emit`
    - 监管端可选：未启动 4002 时，监管推送会报错但不影响学校端上报；仅做联调可忽略。
- 方式 B（单条手动）向学校端直传一条记录：
  - `curl -X POST 'http://192.168.11.133:4001/api/integrations/morning-checks/mego' -H 'Content-Type: application/x-www-form-urlencoded' --data-raw 'equipmentCode=DEMO-EC-0001&uuid=uuid_001&userId=E001&foreheadTemp=36.6&checkTime=2025-08-29 10:15:00&normalTemperatureRange=35.9-37.3&handCheckResult=&healthAskResult=&abnormalTemp=0&health=0'`
- Web-School → “晨检管理”页面点击“同步设备记录”，即可看到设备来源的晨检数据（体温/判定/时间）。

7) 可选：监管端验证
- 打开 `http://192.168.11.133:4002/api/regulator/morning-checks` 查看推送到监管端的数据。

## 手动启动（可选）
- 学校侧：`cd services/school-service && npm i && npm run dev`（容器内服务名：school-service）
- 监管端：`cd services/regulator-service && npm i && npm run dev`
- 设备端：`cd services/device-mock && npm i && npm run dev`

## 网关与用户服务的区别
- `services/gateway-service`（API 网关）
  - 定位：统一入口与路由聚合，统一 OpenAPI 文档；可扩展鉴权、限流、协议适配、BFF 编排等。
  - 面向对象：前端与对外 API 调用者。
  - 何时使用：需要统一网关/文档/代理聚合时；米果最小演示链路可不依赖。
- `services/user-service`（用户服务）
  - 定位：用户/租户/角色等领域的微服务样例，由网关或其他服务调用。
  - 面向对象：内部微服务协作（非直接面向前端）。
  - 何时使用：完整平台化时承载账户体系、RBAC、租户隔离等能力。

## Web-School 端改动一览
- 新增设备抽屉（Devices 页面）：
  - 自动搜索：调用学校端 `/api/devices/discover` 探测心跳并自动勾选。
  - 刷新员工缓存：调用 `/api/employees/refresh` → `/api/employees` 展示员工与健康证日期。
- 晨检管理页面新增“同步设备记录”：
  - 从学校端 `/api/morning-checks` 拉取设备上报数据并合并展示。
- 集成配置 Banner：
  - 读取 `public/integration.config.json` 或本地存储覆盖；支持“测试连接/设置”。

## 学校侧服务（路径：services/school-service，对外名称：school-service）接口
- `POST /api/devices/discover`：自动搜索（心跳探测）
- `POST /api/employees/refresh`、`GET /api/employees`：员工缓存
- `POST /api/integrations/morning-checks/mego`：接收晨检数据（multipart/form-data 支持 `faceFile/palmFile/backOfHandFile`）
- `GET /api/morning-checks`：晨检记录查询

要点：
- 兼容 `equipmentCode/machineCode`；容错解析 `text/html` 返回 JSON；
- 幂等键：`equipmentCode + userId + checkTime (+uuid)`；
- 图片落地 `data/uploads/<recordId>/`，二进制不入日志。

## 设备端 Mock（services/device-mock）
- 上游接口模拟：
  - `POST /device/morningChecker/heartBeatInfo`（返回 `statusCode=200` 且 `text/html`）
  - `GET /device/morningChecker/employeeList?equipmentCode=...`
- CLI：`npm run demo:online`（在 `services/device-mock` 内）按环境变量上报至学校/监管端。

## 监管端服务（services/regulator-service）
- `POST /api/regulator/morning-checks/push`、`GET /api/regulator/morning-checks`

## 环境与脚本
- `.env.example`：端口与默认地址（4001/4002/4003）
- 一键脚本：
  - `npm run demo:mego`：启动三服务（支持 `HOST`/`EQUIPMENT_CODE` 环境变量）
  - `npm run demo:mego:emit`：生成 10 条晨检数据
  - `bash scripts/demo.sh`（容器版）：加 `--foreground` 可直观查看拉镜像/构建日志
  - `bash scripts/mego.sh`（本地 Node 版）：`--host/--emit/--skip-reg` 可选

## 验收映射
- 场景1（自动搜索）：“设备”页 → 自动搜索返回 200 → 显示“已兼容”并接入。
- 场景2（在线状态/心跳）：“设备”页完成搜索后，学校端可刷新员工缓存（基于可达上游）。
- 场景3（员工缓存）：“刷新员工缓存”成功，展示健康证起止日期。
- 场景4（晨检上报/回传）：“demo:mego:emit”后，“晨检管理”页同步到设备记录。

## 故障排查
- 无法自动搜索：确认候选域名指向设备 Mock（默认 4003）；或在 `school-api` 设 `MEGO_BASE_URLS`。
- 员工缓存失败：先完成“自动搜索”以记录 `baseUrl`，再刷新；或检查 4003 是否启动。
- 同步无数据：`GET /api/morning-checks` 检查是否已有记录；如无，请重新上报或运行 emit 脚本。
- 跨域：school-integration/device-mock 默认启用 CORS；确保浏览器可访问 4001/4003。
