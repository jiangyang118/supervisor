# Role
你是资深前端架构师与全栈工程师。请使用 **uni-app(vue3 + script setup + TypeScript + Pinia + Vite)** 生成一个“中小学食品安全监管”移动端小程序（支持 H5 与 微信小程序），满足以下业务需求与交付标准。务必输出**完整项目代码**（包含 pages、components、store、api、utils、pages.json、manifest.json、tsconfig、vite.config、package.json）与**README**。不得留伪代码或 TODO。

# 目标与范围（把以下 16 项功能落成可运行页面）
1. 每天的智能检查数据：仪表盘+折线图/柱状图（ECharts），支持按日/周/月切换与下钻。
2. 实时监控视频：可播放 HLS/FLV/RTMP/RTC；H5 用 <video> HLS，微信小程序用 <live-player>。失败时回退截图轮询。
3. 食堂日报：汇总 晨检/消毒/废弃物/留样/陪餐/卫生检查 的上报率、异常数、环比。
4. 每日待办：今日未上报清单+隐患排查待办（可一键跳转到对应表单）。
5. 工勤人员健康：健康证总数/过期数/即将到期数，支持列表与证件详情。
6. 学校食堂信息：基本信息+食安等级+工勤人员列表（增删改查）。
7. 物资库存：登记入库/出库/盘点/库存查询，含入库记录、出库记录、盘点记录视图。
8. 供应商信息：查看与维护供应商（增删改查、黑白名单标记）。
9. 台账上报：留样、消毒、晨检、废弃物处理、陪餐、卫生检查、食品添加剂使用等表单与提交结果页。
10. 隐患闭环：创建隐患任务→执行排查→整改→提交验收→验收结果。
11. 监督检查结果：显示不合格项清单，支持提交针对性整改并回传。
12. 培训考试：课程学习与在线考试（单/多选），交卷后显示得分、答案与解析。
13. 公众投诉：投诉列表、详情、办理进度与反馈记录。
14. 预警中心：摄像头AI/食品安全/证照/台账异常等预警列表与详情。
15. 食安资讯：资讯列表+详情（Markdown 渲染）。
16. 食物浪费排行：学校/档口/菜品维度排行；明细=库存损耗、加工制作损耗。

# 技术要求
- uni-app + Vue3 + `<script setup lang="ts">`，路由按 `pages.json` 管理；状态管理用 **Pinia**；网络层用封装的 `request.ts`（uni.request Promise 化、拦截器、重试、401 处理、离线缓存）。
- UI：统一采用卡片式信息密度（对标行业监管类小程序），色板：主色 `#1677FF`，警告 `#FAAD14`，错误 `#F5222D`，成功 `#52C41A`，中性色 `#1F1F1F/#595959/#BFBFBF/#F0F0F0`。
- 组件库：原生+自建组件。图表用 **@jiaminghi/charts-miniprogram** 或 **echarts-for-weixin**（任选其一，H5 用 ECharts）。
- 视频播放：封装 `<VideoPlayer>`，根据平台编译指令选择实现：
  - H5：`<video :src="m3u8Url" webkit-playsinline playsinline controls />`
  - MP-WEIXIN：`<live-player :src="liveUrl" mode="live" autoplay muted />`
  - 失败回退：轮询快照 `<image :src="snapshotWithTs" />`
- 表单校验：`yup` 或轻量自写校验器；所有上报表单必须具备**必填校验、草稿保存、离线重传**。
- 权限与多角色：`role` ∈ {canteen_admin, worker, inspector, regulator_view}，基于 Pinia 的路由守卫与按钮级鉴权。
- 性能：首屏骨架屏、分包加载、页面级懒加载、列表虚拟滚动（长列表）。
- 可观测：在 `utils/logger.ts` 打点 PV/点击/错误；网络失败告警 toast。

# 目录结构（生成真实文件）
.
├─ src/
│  ├─ api/            # 按领域拆分的 API 客户端（typesafe）
│  ├─ components/     # 通用组件
│  ├─ pages/
│  │  ├─ dashboard/   # (1)(3)(14)(16)
│  │  ├─ video/       # (2)
│  │  ├─ todo/        # (4)
│  │  ├─ staff/       # (5)(6)
│  │  ├─ inventory/   # (7)
│  │  ├─ supplier/    # (8)
│  │  ├─ ledger/      # (9)
│  │  ├─ hazard/      # (10)
│  │  ├─ inspect/     # (11)
│  │  ├─ training/    # (12)
│  │  ├─ complaint/   # (13)
│  │  └─ news/        # (15)
│  ├─ store/          # pinia modules（user, kpi, todo, ledger, inventory 等）
│  ├─ utils/          # request/logger/validate/date/echarts-adapter
│  ├─ styles/         # 全局样式与主题
│  └─ static/         # 占位图标、占位视频封面
├─ pages.json
├─ manifest.json
├─ vite.config.ts
├─ tsconfig.json
└─ README.md

# 路由与 TabBar（请在 pages.json 写好）
- tabBar 5 个：Dashboard(总览)、Work(待办)、Ledger(台账)、Warn(预警)、Mine(我的)。
- 非 tabBar 页面以导航进入（视频、培训、库存、隐患、投诉等）。

# 页面与交互要点（选列，余下按需求生成）
## Dashboard
- 顶部 KPI：今日已上报/未上报、异常预警数、健康证将到期数、浪费指数。
- 图表：智能检查趋势（日/周/月），浪费排行 Top5（可切换维度）。
- 日报卡片：晨检/消毒/废弃物/留样/陪餐/卫生检查（点击进入 ledger 对应列表）。
## Video 实时监控
- `VideoPlayer` 组件：props `{ hlsUrl?: string; rtcUrl?: string; snapshot?: string }`
- 失败自动降级：live→hls→snapshot 轮询，提供“全屏/切换码流/声音开关”。
## Todo 待办
- “今日未上报”清单 + “隐患排查任务”；可一键跳表单/任务详情；支持批量完成。
## Ledger 台账
- 分类标签：留样、消毒、晨检、废弃物、陪餐、卫生检查、食品添加剂。
- 每类均含：查询列表、创建表单、详情页；表单支持草稿保存与离线重传。
## Staff & Canteen
- 学校食堂信息卡；工勤人员表（增删改查），证照到期高亮。
## Inventory 物资
- 入库/出库/盘点/库存查询四个子页；每次操作写入记录并可回溯。
## Supplier
- 供应商 CRUD + 黑白名单标记；联动库存入库选择器。
## Hazard 隐患闭环
- 新建任务→拍照/标注→整改→提交验收→验收人审核；展示全链路进度条。
## Inspect 监督检查
- 不合格项列表→整改单→提交监管复验结果。
## Training
- 课程播放/资料阅读→考题（单/多选）→交卷显示得分与解析→成绩记录。
## Complaint
- 公众投诉列表→详情→办理记录→反馈结果。
## Warn 预警
- 预警列表（按严重级别/来源筛选）→详情→处置动作与流转记录。
## News 资讯
- 资讯列表→详情（Markdown 渲染）。

# API 约定（生成可切换的 Mock 与真实 BaseURL）
- `src/api/http.ts`：封装 `request`，支持：
  - BASE_URL=环境变量；`X-Auth-Token` 自动注入；失败重试（幂等 GET 3 次指数退避）；
  - `cache: true` 时写入本地缓存（uni.setStorage），过期时间可配置。
- `src/api/modules/*.ts`：按域导出函数与 TS 类型（示例）：
  - `getDailySmartCheck(params: { date: string }) => Promise<{ trend: Array<{time:string, pass:number, fail:number}>, kpi: {...} }>`
  - `getLiveStream(deviceId:string) => Promise<{ hls?:string, rtc?:string, snapshot?:string }>`
  - `getCanteenDailyReport(date:string)`
  - `getTodos(date:string)`
  - `getStaffHealthStats()`
  - `listStaff() / createStaff(dto) / updateStaff(id,dto) / deleteStaff(id)`
  - `inventory.{list, inbound, outbound, stocktaking, records}(...)`
  - `supplier.{list, create, update, remove}(...)`
  - `ledger.{list, create, detail}(type, ...)`
  - `hazard.{createTask, execute, rectify, submitForReview, review}` 
  - `inspect.{list, rectifySubmit}`
  - `training.{courses, paper, submit, result}`
  - `complaint.{list, detail, progress}`
  - `warn.{list, detail, ack}`
  - `waste.{rank, detail}`

# 数据类型（举例，其余按需生成）
```ts
export type HealthCert = { id:string; staffId:string; number:string; start:string; end:string; status:'valid'|'expiring'|'expired' }
export type SmartCheckKPI = { reported:number; unreported:number; alerts:number; expiringCerts:number; wasteIndex:number }
export type WasteRankItem = { dimension:'school'|'booth'|'dish'; name:string; score:number }
export type InventoryRecord = { id:string; type:'in'|'out'|'stocktaking'; operator:string; time:string; items:Array<{sku:string; name:string; qty:number; unit:string}> }
