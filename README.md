# 食品安全智慧管理云平台 — Monorepo (Skeleton)

本仓库为单体 Monorepo 骨架，采用 pnpm 管理，多端多服务代码结构已就位，可按需继续扩展为完整功能。

## 技术栈（已确认）

- Node.js 20
- 前端 Web：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
- 移动端：UniApp（HBuilderX 兼容），提供演示壳工程
- 后端：NestJS（api-gateway、user-service 示例）
- 数据/缓存/对象存储/消息队列：PostgreSQL、Redis、MinIO、Kafka
- 反向代理：Nginx（含 WebSocket 转发）

## 目录结构

- `apps/`
  - `web-school` 学校端（Vite + Vue3）
  - `web-regulator` 监管端（Vite + Vue3）
  - `mobile-device` 设备管理（UniApp 壳）
  - `mobile-emergency` 应急管理（UniApp 壳）
- `services/`
  - `api-gateway` 网关（NestJS + Swagger）
  - `user-service` 用户服务（NestJS 示例）
- `libs/shared/models` TypeScript 接口 + Zod 校验
- `infra/` docker-compose 与 nginx 配置
- `scripts/` 一键演示脚本骨架

## 快速开始

1. 使用 npm（免 Corepack）：确保 Node 20，运行 `npm --version` 验证
2. 安装依赖（工作区）：`npm install --workspaces`
3. 本地开发（多包并行）：
   - 一键启动（全仓库热更新/HMR）：`make dev-all` 或 `npm run dev:all`
   - Web（HMR）：`make dev-web` 或分别在 `apps/web-*` 里 `npm run dev`
   - 后端（热更新）：`make dev-services`（nodemon + ts-node + swc 监听 TS 变更自动重启）
   - 后端（稳定运行，无热更新）：`make start-services`（编译后跑 dist）
   - 也可运行：`npm run dev --workspaces --if-present`（顺序启动，可能只保留第一个阻塞的服务）
4. 构建：`npm run build --workspaces --if-present`
5. 一键演示（容器）：`bash scripts/demo.sh`

> 说明：当前仅为骨架，可启动基础服务与示例接口，后续可逐步补全数据库、鉴权、AI 事件流、导出等能力。

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改。

## 运行

- 学校端：`cd apps/web-school && npm run dev` 打开 http://localhost:4200（含 HMR）
- 监管端：`cd apps/web-regulator && npm run dev` 打开 http://localhost:4300（含 HMR）
- 后端服务热更新：`make dev-services`（基于 nodemon + ts-node + swc）
- 全部一键：`make dev-all` 或 `npm run dev:all`（同时起 Web 与服务，支持热更新/HMR）
- 后端稳定启动：`make start-services`（编译后运行，避免文件监听限制）

### 学校端快速体验（推荐给一线用户演示）

- 首页：查看“入/出库、卫生合格率、设备在线率、AI 预警、家长满意度”等 KPI 与图表；支持刷新与导出当日数据。
- 每日报表：按日期/餐次查看“晨检/留样/消毒/陪餐/废弃物/AI 预警”等汇总，提供饼图/柱图与入/出库、卫生/设备简表；支持导出 CSV（PDF 为占位）。
- AI 事件：学校端“AI 汇总/事件”可查看并处置；监管端可联动巡查任务与远程提醒。
- 明厨亮灶：查看直播/回放/抓拍与通道；`WVP_BASE` 配置后即可播放。
- 终端用户手册：监管人员与后勤主任请阅读 docs/USER_GUIDE_ENDUSER.md；更细分角色清单见 docs/USER_MANUAL.md。

## 测试与质量

- Lint（Prettier）：`npm run lint`
- Lint（ESLint）：`npm run lint:eslint`，自动修复：`npm run lint:fix`
- Type Check（vue-tsc）：`npm run typecheck`
- E2E（Playwright）：
  1. 安装浏览器依赖：`npx playwright install`（首次执行需要）
  2. 运行测试：`npm run test:e2e`
  3. 查看报告：`npm run e2e:report`
  - Playwright 会自动启动两端 Web 服务器（4200/4300），等待可用后执行用例。
  - 若已手动启动服务，测试会复用现有实例。

更多细节与问题排查，请见根目录 `TESTING.md`。

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
- 后端 API：NestJS 服务（api-gateway、user-service、食品安全相关服务）+ OpenAPI 文档，按 prompt/init.md 模块分组补齐。
- 数据层：Prisma schema、迁移与种子数据（学校/食堂/人员/设备/摄像头/台账/AI 事件样例）。
- 导出：后端导出 CSV/Excel、PDF 报表模板（每日报表、预警看板）。
- AI 事件：ai-vision-service（Mock 定时产出）→ Kafka → alert-service 入库与推送，前端 WebSocket 看板联动。
- 视频：iot-service（RTSP/回放/快照 Mock），前端明厨亮灶页面接入快照与通道配置。
- 设备移动端/应急移动端：UniApp 骨架与页面对齐，接统一鉴权。
- DevOps：Dockerfile、docker-compose（一键起 Postgres/Redis/MinIO/Kafka/Nginx）、.env.example、Makefile、scripts/demo.sh、CI（GitHub Actions）。
- 质量：关键页面 E2E、后端单测覆盖、Lint/Prettier/Husky/Commitlint。

如需我优先接哪一块，请备注（例如先补后端 API 与数据库）。

## OpenAPI

- API 文档：启动 `api-gateway` 后访问 `http://localhost/api/docs`

## 备注

- UniApp 项目建议用 HBuilderX 打开进行运行/打包。
- docker-compose 已包含 Postgres/Redis/MinIO/Kafka/Nginx 与示例服务镜像构建（Dockerfile 已改为使用 npm）。

### 单独运行某个包（npm 示例）

- 网关开发：`npm --prefix services/api-gateway run dev`
- 用户服务开发：`npm --prefix services/user-service run dev`
- 学校端 Web：`npm --prefix apps/web-school run dev`
- 监管端 Web：`npm --prefix apps/web-regulator run dev`
- Lint/ESLint：补全 ESLint 生态（eslint、@typescript-eslint、eslint-plugin-vue）与规则；将 lint 升级为 ESLint + Prettier 协同。
- E2E：补充更多场景（AI 预警处置、导出校验、权限拦截）。
