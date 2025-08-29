# 食品安全智慧管理云平台 — 角色分工用户手册（可落地）

本手册根据本仓库的可运行骨架，按“角色—要做的事—如何做”的方式编写，覆盖学校端、监管端、平台/运维与开发者。即使在尚未接入真实数据库/鉴权的阶段，也能用于演示、验收与扩展。

> 说明：当前为演示骨架，已实现页面、表格、筛选、部分新增/处置、CSV 导出（前端），PDF 导出为占位弹窗；API 为网关 Mock/聚合。后续可无缝替换为真实服务。

---

## 1. 快速上手（所有角色）

- 环境：Node.js 20；浏览器 Chrome/Edge；如需移动端演示安装 HBuilderX。
- 安装依赖（根目录）：`npm install --workspaces`
- 启动服务（任选其一）：
  - 全局并行开发：`npm run dev --workspaces --if-present`
  - 仅学校端：`npm --prefix apps/web-school run dev`（默认 http://localhost:4200）
  - 仅监管端：`npm --prefix apps/web-regulator run dev`（默认 http://localhost:4300）
  - 网关后端：`npm --prefix services/api-gateway run dev`（默认容器外映射 http://localhost:3300，OpenAPI http://localhost:3300/api/docs；本地开发默认 3000）
- 环境变量：复制 `.env.example` 为 `.env` 并按需设置（如 `WVP_BASE`）。
- E2E 测试（可选）：`npx playwright install && npm run test:e2e && npm run e2e:report`

---

## 2. 账号与权限（演示阶段说明）

- 当前演示版未启用真实鉴权（JWT/RBAC/多租户），前后端可直接访问。
- 角色与菜单已按真实业务划分，功能按钮/导出路径与后续真实版保持一致。
- 上线版将接入统一登录、角色权限与租户隔离；本手册已按目标角色编写，可直接沿用。

---

## 3. 学校端（Web）

入口：`apps/web-school`（默认 http://localhost:4200）

### 3.1 校级管理员（信息与配置）

你要完成的事（首次配置 → 日常保障）：

1. 基础配置

- 系统配置：系统公告、食堂信息、联动设置、App 下载（菜单：系统）
- 组织档案：仓库、供应商、资质证件（菜单：供应商/仓库/证件）
- 设备接入：设备与摄像头通道（菜单：设备、明厨亮灶-通道/直播/回放/抓拍）

2. 日常治理

- 首页总览：今日待办、入/出库、卫生/设备、家长反馈（首页）
- 预警中心：AI 事件总览与处置（菜单：预警、AI 汇总/事件）
- 报表导出：各台账与统计页面支持 CSV 导出（按钮：“导出 CSV”）

3. 常见流程（示例）

- 入库/出库 → 库存/索证：库存流水闭环（菜单：出入库/库存/索证/添加剂）
- 晨检/留样/陪餐/农残/消毒/废弃物：各自台账按日登记，可筛选导出
- 卫生检查/资产维护：发现问题 → 建立隐患 → 跟踪整改（菜单：卫生检查、隐患）
- 证件管理：人员健康证、资质证照到期提醒与导出（菜单：资质证件）
- 应急管理：预案、值守、事件、视频联动、资源台账（菜单：应急）

操作指引（页面共同点）：

- 导航侧栏定位模块 → 顶部操作区选择“新增/导出 CSV/导出 PDF(占位)” → 表格筛选 → 明细页编辑/处置。
- CSV 导出为 UTF-8 BOM，适配 Excel 打开；PDF 将在接入后端模板后可用。

### 3.2 从业人员/库管/后厨主管（按岗台账）

你要完成的事（高频清单）：

- 晨检：体温/健康状态登记；对不合格项标注与复检。
- 留样：每餐菜品称重、时间戳、留样位置与清理记录。
- 陪餐：学校领导/老师陪餐登记与问题反馈。
- 农残快检：抽样项目、结果、不合格上报与整改跟进。
- 消毒：餐具/设备消毒记录与不合格复检。
- 废弃物：四分类称重与去向登记，问题拍照留存（前端示例）。
- 出入库：入库单、出库单、即时库存盘点；索证与添加剂登记。
- 卫生检查/资产维护：问题上报 → 生成隐患 → 跟踪整改闭环。
- 预警处置：AI 事件查看与“已整改”反馈（菜单：预警/AI 事件）。

页面操作要点：

- 新增/编辑/删除：均为表格上方按钮或行内操作。
- 筛选：按日期/类型/状态组合筛选后导出 CSV 归档。
- 图片/快照：当前为示例字段，接入对象存储后自动生效。

### 3.3 应急负责人（移动端配合）

你要完成的事：

- 制定/维护应急预案与通讯录，安排值守班次。
- 突发事件：在“应急事件”发起/处置，记录时间线、联动视频。
- 指挥调度：查看“应急指挥”页的任务状态与资源调度。
- 移动端：`apps/mobile-emergency`（UniApp 壳），建议使用 HBuilderX 打开运行；登录/消息待与网关鉴权打通。

---

## 4. 监管端（Web）

入口：`apps/web-regulator`（默认 http://localhost:4300）

### 4.1 一线监管员/执法人员

你要完成的事：

- 首页总览：KPI、AI 类型分布、7 日趋势、学校预警排行、证件到期提醒（Dashboard）。
- AI 巡查：
  - 明细与任务：`/ai/details`、`/ai/tasks` 查看待办与历史；
  - 远程喊话：`/ai/broadcast` 文本示例（调用网关 `POST /reg/ai/broadcast`，前端演示）。
- 明厨亮灶：查看学校摄像头视频（大屏/通道页），支持 1/4/9 分屏与轮巡（演示用 flv/hls）。
- 台账监督：晨检/留样/陪餐/农残/消毒/废弃物/库存等全量台账列表与筛选导出。
- 证件/培训/食品浪费/公示：集中查看与抽查导出。
- 预警与整改：汇总预警、下发整改与跟进状态（演示占位流程）。
- 报表：`/reports` 支持 CSV 导出；PDF 待模板接入。

操作要点：

- 导出：多数页面右上角“导出 CSV”。
- 视频：若需接入你们的 wvp-GB28181 播放服务，将 `.env` 中 `WVP_BASE` 指向实际地址，前端无需改动。

### 4.2 监管端管理员

你要完成的事：

- 组织/辖区管理：配置辖区学校清单（演示由网关 `/reg/schools` 提供）。
- 检查计划：制定监督检查计划与任务（页面占位，可扩展）。
- 用户与权限：后续接入统一登录后，在“系统”模块维护账号、角色与权限。
- 指标配置：食安指数维度、加权规则（页面占位，可与后端联动）。

---

## 5. 平台管理员/运维（DevOps）

你要完成的事：

- 部署与运行：
  - 本地：`npm install --workspaces` → 各包 `npm run dev`。
  - 容器（建议）：完善 `infra/docker-compose` 与 `infra/nginx` 后执行一键脚本（骨架：`scripts/demo.sh`）。
- 环境变量（`.env`）：
  - `WVP_BASE`：明厨亮灶播放服务基地址（例如 `http://wvp:18080`）。
  - 数据服务（未来）：PostgreSQL/Redis/MinIO/Kafka 连接串。
- 端口与反向代理：
- Web：4200（学校）/4300（监管）；API 网关：3300（容器外）/3000（容器内/本地）；Nginx 转发 WebSocket。
- 健康检查：
  - 网关：`GET /health` 返回 `{ok, service, time}`。
  - OpenAPI：`GET /api/docs`（Swagger UI）。
- 日志与数据：容器化时将数据卷/日志映射到宿主机，制定备份与保留策略。
- 升级与回滚：
  - 版本化镜像 → Nginx 蓝绿/金丝雀切换；
  - 回滚：重新切换镜像标签并重启服务。

常见问题：

- 端口冲突：前端可 `--port` 指定；Playwright `webServer.timeout` 可调大。
- 播放失败：检查 `WVP_BASE` 与跨域；HLS Safari 原生、其他浏览器用 hls.js；flv 用 flv.js。
- Swagger 空白：确认网关已启动且访问 `http://<host>:3300/api/docs`（容器外）或 3000（本地）。

---

## 6. 开发者手册

你要完成的事：快速理解目录、开服、加页面/接口、过质检。

- 目录结构
  - `apps/web-school`、`apps/web-regulator`：Vue3 + Vite + Element Plus
  - `services/api-gateway`：NestJS 聚合/Mock + Swagger
  - `libs/shared/models`：共享类型与 Zod 校验（可扩展）
  - `infra`：docker-compose 与 nginx
- 启动命令
  - 根：`npm run dev --workspaces --if-present`
  - 单包：`npm --prefix <path> run dev`
- 加页面（前端）
  - 新增路由：各端 `src/router/index.ts` 中添加；视图放 `src/views`；通用占位组件 `PageStub`；导出工具 `utils/export.ts`（`exportCsv`）。
  - UI 规范：Element Plus；图表用 ECharts；状态管理 Pinia；路由 Vue Router。
- 加接口（网关）
  - 新建控制器：`services/api-gateway/src/modules/*.controller.ts`；使用装饰器 `@Controller/@Get/@Post`；在 `app.module.ts` 注册；在 `main.ts` 配置 Swagger。
  - 现有示例：
    - 学校首页：`GET /home/inbound|outbound|hygiene|devices|parent-feedback`
    - 监管总览：`GET /reg/overview|schools|schools/stats|schools/:id/cameras`
    - AI：`GET /school/ai/events`、`POST /school/ai/events/handle`、`GET /reg/ai/inspections|tasks`、`POST /reg/ai/broadcast`
    - 明厨亮灶：`GET /bright/channels`、`GET /bright/start/:schoolId/:cameraId`
- 质量与规范
  - Lint：`npm run lint`；ESLint：`npm run lint:eslint`；自动修复：`npm run lint:fix`
  - 类型检查：`npm run typecheck`
  - 提交规范：Husky + Commitlint（需 `npm run prepare` 安装钩子）
  - E2E：`npm run test:e2e`（Playwright 自动启动/复用 4200/4300）
- 调试与联动
  - Postman 集合：根目录 `postman_collection.json`（变量 `{{baseUrl}}`，默认 `http://localhost:3300`）
  - OpenAPI 契约：`docs/openapi.yaml` 与 Swagger UI 对应

---

## 7. 导出与报表

- CSV 导出：各页面右上角“导出 CSV”，编码 UTF-8 BOM；字段映射在前端 `utils/export.ts` 中维护。
- PDF 导出：目前为占位弹窗；后续将接入后端模板（每日报表、预警看板等）。
- 统计与食安指数：学校端/监管端均有“统计/食安指数”入口，后续可接 KPI 计算逻辑。

---

## 8. 术语与约定

- 明厨亮灶：对接 wvp-GB28181 风格播放服务，`WVP_BASE` 决定 flv/hls 链接。
- 台账：晨检、留样、陪餐、农残快检、消毒、废弃物、出入库/库存/索证/添加剂等记录表。
- 预警：AI 事件/规则触发的异常记录，支持学校处置与监管复核。

---

## 9. 常见问题（FAQ）

- 页面可见但无数据？演示数据由网关 Mock 生成，请确保 `services/api-gateway` 正常启动并与前端同源或允许跨域。
- 导出乱码？CSV 使用 UTF-8 BOM；请用 Excel 或 WPS 打开，或导入前选择 UTF-8。
- 视频无法播放？检查 `WVP_BASE` 是否可达、跨域响应头、浏览器兼容性（Safari 原生 HLS，其他浏览器 hls.js；flv.js 需 MSE 支持）。
- 测试失败？先执行 `npx playwright install` 安装浏览器依赖；如端口被占用，先停掉本地已开的 dev 服务器。

---

## 10. 路线图（与 README 同步）

- 鉴权与登录（JWT + 租户 + RBAC）、数据库与对象存储、Kafka 事件流、PDF 报表、AI 事件链路、设备/应急移动端联动、容器一键起与 CI。

> 有新的落地需求（如先对接后端/数据库、完善某类台账、接第三方设备），请在 Issue 中标注角色与流程，我方可按本手册结构快速补齐。
