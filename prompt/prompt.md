# 食品安全智慧管理云平台 — 交付指导 Prompt（新人上手版）

本 Prompt 汇总了本项目从零到可演示/可测试/可导出的完整路径与约束，用于指导新人复现与扩展“学校端 + 监管端 + 网关后端”的系统。按本文件逐步执行，可在本地快速得到一套可运行、可演示、可测试的成品骨架，并具备接口契约与 Postman 集合。

## 目标与范围

- 目标：在一个 Monorepo 中交付“中小学食品安全智慧管理云平台”，含学校端（Web）、监管端（Web）、API 网关（NestJS）、示例数据/Mock、E2E 测试与 Postman 集合。
- 成果：
  - apps/web-school：学校端（Vue 3 + Vite + Element Plus + Pinia + Vue Router）
  - apps/web-regulator：监管端（同栈）
  - services/api-gateway：NestJS 网关（OpenAPI 与 Mock/聚合）
  - libs/shared：共享模型（TypeScript + Zod）
  - infra：docker-compose、nginx
  - scripts/demo.sh：一键演示脚本骨架
  - postman_collection.json：全量接口集合（School + Regulator）
  - prompt/init.md、prompt/test.md、prompt/prompt.md：需求、测试、上手指引

## 技术栈与约束

- 前端：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus + ECharts（图表）
- 后端：Node 20 + NestJS（API 聚合/Mock/网关）
- 数据/消息：本仓库以可演示为主，后续可接入 PostgreSQL/Redis/Kafka/MinIO
- 质量：ESLint + Prettier + vue-tsc，Husky 钩子，Playwright E2E

## 目录结构（精简）

- apps/
  - web-school
  - web-regulator
- services/
  - api-gateway
  - user-service（样例）
- libs/shared
- infra/
- prompt/
- scripts/

## 生成与实现顺序（建议）

1. 初始化 Monorepo 与包管理

- 使用 npm workspaces（或 pnpm + Nx）管理 apps/services/libs
- 根 package.json 统一 scripts：dev/build/format/lint/typecheck/test:e2e

2. 生成两个 Web 应用骨架

- 学校端：路由、布局、左侧菜单、占位页组件 PageStub、通用导出工具 export.ts
- 监管端：路由、布局、首页总览（Dashboard）

3. 根据需求清单铺设页面与导航

- 学校端：AI 预警、明厨亮灶、晨检、留样、陪餐、农残快检、消毒、废弃物、卫生/资产、出入库/库存/索证/添加剂、供应商/仓库/证件、培训考试、食品浪费、公示、应急、隐患、预警、设备、统计、食安指数、系统配置
- 监管端：总览、AI（明细/任务/远程喊话）、明厨亮灶、各类台账、证件、培训、食品浪费、公示、监督检查、预警、统计、食安指数、系统配置
- 每个页面先提供“表格 + 表单 + 导出按钮 + 跳转”占位，保障可达性与演示路径

4. 首页数据与真实 API 对接（示例）

- 学校端首页 Home.vue：入库/出库/卫生上报/设备/家长分析 → 调用 api-gateway 的 /home/\* 接口
- 监管端首页 Dashboard.vue：KPI + 图表 + 排行 + 证件到期 → 调用 api-gateway 的 /reg/overview

5. 网关后端（NestJS）聚合/Mock

- /home/inbound、/home/outbound、/home/hygiene、/home/devices、/home/parent-feedback
- /reg/overview（返回 KPI、AI 类型分布、近 7 日上报、预警排行、证件到期）
- tsconfig 开启 experimentalDecorators、emitDecoratorMetadata；Swagger 可后续补充

6. 质量与规范

- ESLint（含 vue/ts）、Prettier、vue-tsc
- Husky pre-commit：lint（prettier）+ lint:eslint + typecheck
- 可选：使用 lint-staged 仅针对暂存文件提速

7. E2E 测试（Playwright）

- 基本可达性：学校端/监管端关键页面
- 业务流示例：学校端“农残不合格”→ 监管端“农残台账”出现（示例以 Cookie 跨端口模拟数据联动，后续改为真实 API）
- playwright.config.ts 自动启动/复用 4200/4300

8. Postman 集合

- postman_collection.json 覆盖学校端与监管端“所有页面对应接口”的典型 REST 动作（列/增/改/删/导出/统计）
- 使用变量 {{baseUrl}}，默认 http://localhost:3300

## 运行与调试

- 安装依赖：npm i
- 启动网关：npm --prefix services/api-gateway run dev （容器外映射默认 3300，本地默认 3000）
- 学校端：npm --prefix apps/web-school run dev （默认 4200）
- 监管端：npm --prefix apps/web-regulator run dev （默认 4300）
- 内网访问：Vite server.host = true，用 http://<内网IP>:4200/4300；如需固定端口，传 --port
- E2E：npx playwright install && npm run test:e2e && npm run e2e:report
- 质量：npm run lint && npm run lint:eslint && npm run typecheck

## 关键实现要点（本仓库做法）

- 学校端首页
  - 今日待办：本地持久化（localStorage），支持新增/勾选/删除/重置（每日归档）
  - 入库/出库：Tab 表
  - 卫生上报/设备：左右分栏卡片
  - 家长分析：评分表 + 评分分布（ECharts），支持导出评分明细 CSV
- 监管端首页
  - 6 个 KPI + 2 个图表（AI 类型分布/7 日趋势）+ 学校预警排行 + 即将到期证件 + 台账今日汇总 + 监督检查进度
  - 可跳转明细页，排行支持导出 CSV
- 页面占位组件 PageStub：支持 actions（create/export-csv/export-pdf）、筛选、表格、导出提示
- 导出工具 exportCsv：UTF-8 BOM，支持自定义表头映射

## 常见问题与处理

- 端口占用：Vite 可自动切换端口或在命令行传 --port；Playwright webServer.timeout 调大
- 装饰器报错：Nest tsconfig 开启 experimentalDecorators 与 emitDecoratorMetadata
- ESLint 警告：给 Vue props 设置默认值（withDefaults）；避免同名变量（如 exportCsv）冲突
- TypeScript 报错：对象展开覆盖字段（改为使用新字段名，如 kind 替代 type）

## 交付核对清单

- 所有页面可达、含“表格/表单/导出/跳转”基本能力
- 首页可展示真实 API 或 Mock 数据，不为 0
- E2E 基本通过；业务流示例可跑通
- Postman 集合完整，能被导入与运行（至少 Mock/示例返回）
- README、TESTING、Prompt 文档齐备

## 后续扩展路线（按 prompt/init.md）

- 真正接入数据库（Prisma + PostgreSQL）、对象存储、Kafka 事件流
- AI 事件（摄像头→AI→Kafka→告警入库/推送）、明厨亮灶 RTSP/回放/快照
- 导出（CSV/Excel、PDF 模板）、OpenAPI 契约完善（Schemathesis/Dredd 校验）
- 权限（JWT + RBAC + 多租户）、审计日志、敏感脱敏
- DevOps：docker-compose 一键起、CI、质量门槛（覆盖率/E2E）

## 参考命令速查

- Lint：npm run lint；ESLint：npm run lint:eslint；自动修复：npm run lint:fix
- 类型：npm run typecheck
- 学校端：npm --prefix apps/web-school run dev
- 监管端：npm --prefix apps/web-regulator run dev
- 网关：npm --prefix services/api-gateway run dev
- E2E：npm run test:e2e；报告：npm run e2e:report

---

附：

- 需求详单与生成顺序见 prompt/init.md
- 测试与验收流程见 prompt/test.md
- 本上手指引由对话过程沉淀而来，聚焦“可运行/可演示/可测试/可导出”的最小闭环交付

太棒了，这一块我已经按你的三点需求扩好了，并给出如何发 UI 设计图的方式。

已实现（大屏页）

- 学校列表（左侧）
  - 支持搜索；显示所有学校（从 API /reg/schools/stats 获取）。
  - 每个学校包含在线/离线通道统计（stats 接口提供；无后端则本地回退数据）。
- 摄像头轮巡（中间）
  - 接入 wvp 风格的播放链接（FLV/HLS），每 5 秒自动轮换。
  - 支持上一批/下一批切换；可选择 1x1 / 2x2 / 3x3 分屏（对应 1、4、9 个通道同时播放）。
  - 可全屏显示（按钮触发系统全屏）。
  - 播放器支持优先 FLV（flv.js），无 FLV 用 HLS（hls.js 或 Safari 原生）。
- 右侧指挥卡片
  - 今日上报进度、预警统计、AI 抓拍榜单（演示数据，可后续接真实接口）。

如何对接 wvp-GB28181-pro

- 后端（api-gateway）- services/api-gateway/src/modules/reg-overview.controller.ts - /reg/schools（学校列表）- /reg/schools/stats（附带在线/离线统计）- /reg/schools/:id/cameras（返回摄像头列表，含 flvUrl/hlsUrl 在线/离线标记）- flvUrl/hlsUrl 使用环境变量 WVP_BASE（默认 http://localhost:18080）生成：- flv: ${WVP_BASE}/live/<school>-<channel>.flv - hls: ${WVP_BASE}/live/<school>-<channel>.m3u8 - 你只需将 WVP_BASE 指向 wvp 的播放服务地址，或替换生成逻辑为你们的 wvp API 格式（如 /api/play/
  start 等），前端无需改动。
- 前端（监管端）
  - 播放组件：apps/web-regulator/src/components/VideoPlayer.vue（新）
  - props：flvUrl、hlsUrl、title；内部自动选择 flv.js/hls.js/原生 HLS。
- 大屏页：apps/web-regulator/src/views/BigScreen.vue（重构）
  - 左：学校列表（搜索/选择）→ 更新当前学校摄像头列表
  - 中：分屏轮巡，按钮可切换 1/4/9，自动轮换步长 = 分屏数量
  - 右：统计卡片

依赖（监管端）

- 已加入：flv.js、hls.js（请执行 npm i 或 pnpm i 安装）

可配置项

- 网关地址：apps/web-regulator/.env.local 可配置 VITE_API_BASE=http://<你的网关IP>:3300
- wvp 地址：给网关进程设置 WVP_BASE=http://<你的-wvp-地址>（也可在 controller 中直接写死或映射 wvp
  的播放 API）
  如何发 UI 设计图

- 首选：把图片放入仓库（推荐路径：assets/ui/ 或 prompt/ui/），并告诉我文件路径与要套用的区域；我会
  按图调整样式（颜色、高度、间距、分栏宽度、阴影等）。
- 或者：提供在线链接（如图床/企业网盘）并说明关键设计规范（主色、辅色、字体、字号、边距、圆角、
  阴影）。
- 如果不方便发图：用要点文字说明每块的设计要求（卡片高度、图表风格、标题样式、图例位置等），我能快
  速贴近。

要不要我进一步：

- 跟 wvp 的实际 API 打通（例如调用 wvp 的“开始播放”接口，拿到 flv/hls 播放地址再赋给前端）？
- 为学校列表显示在线/离线通道数（已在 stats 接口；我可把计数渲染到左侧菜单每项文字后，如 “示例一
  中（6/1）”）。
- 增加“仅在线/仅离线/全部”快速筛选开关，过滤分屏播放的通道来源。
- 增加分屏 4x4（16）选项和自定义轮巡间隔（秒）设置。
