喂给 Codex 的一体化改造 Prompt（前后端联动｜实时视频页从样式1改为样式2）

你是资深企业级全栈工程师。基于我已生成的 Monorepo（Nx + pnpm）与现有项目，请一次性完成“学校端·明厨亮灶·实时视频页面”重构，把当前页面（样式如第一张图）改造成第二张图的四宫格+左侧树+顶部搜索+底部状态栏风格，并串起后端 IoT 网关接口获取摄像头与播放地址。直接输出可运行代码（包含前端 Vue3 组件、Pinia store、API 封装、后端 NestJS 控制器/服务/实体/缓存、OpenAPI 注释、单测样例），遵循本 Prompt 的文件路径与验收标准。

⸻

约束与背景
	•	Monorepo packages（已存在）：apps/web-school、services/iot-service、services/gateway-service、libs/shared 等。
	•	前端：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus；SSR 关闭。
	•	播放器：优先 HLS（m3u8）或 FLV。若只拿到 RTSP，由后端 /streams/play 转换为 HLS/FLV（可用 Mock/转发服务），前端自动选择可用源。
	•	鉴权：与项目现有 JWT 体系一致；接口走 services/gateway-service 反向代理（或 axios 直连网关，按项目既有风格）。
	•	第三方上游接口（已有）：http://trustivs.biokee.com/gatewayGBS/openApi/getCameraByCompany
	•	请求 Header：time=<毫秒时间戳>、uuid=cpt；业务固定账号：CPT/123456，在 TokenService 中换取/刷新 token（已在项目内或本次完善）。
	•	固定请求参数：fthirdcomnum=cpt0904、deviceSn=HQDZKFGBDJGCJ0017。
	•	列表展示字段：摄像头名称取返回值的 fname。
	•	页面要求：删除“输入单位ID查询”组件；当前单位固定为“北京康比特体育科技股份有限公司”。
	•	.env（或配置文件）新增统一前缀变量（写入 .env.example 并在代码中读取）：

ylt_baseurl=http://trustivs.biokee.com
ylt_uuid=cpt
ylt_account=CPT
ylt_password=123456
ylt_thirdcom=cpt0904
ylt_device_sn=HQDZKFGBDJGCJ0017


	•	缓存策略：SWR（本地 Postgres L1 + Redis L2 可选）；摄像头与播放地址 5 分钟缓存；token 过期自动刷新。
	•	OpenAPI 3.1 注释与 Postman 导出（补充/更新 iot-service 的 swagger）。

⸻

你要交付的代码改动（按文件/模块列出）

1）后端（NestJS）

目标：在 services/iot-service 内提供摄像头列表 & 播放地址统一抽象层，并由 gateway-service 统一对外。

新增/修改文件：
	1.	services/iot-service/src/modules/streams/streams.controller.ts
	2.	services/iot-service/src/modules/streams/streams.service.ts
	3.	services/iot-service/src/modules/streams/dto/get-cameras.dto.ts、get-play.dto.ts
	4.	services/iot-service/src/modules/streams/entities/camera.entity.ts（Prisma/TypeORM 二选一，按仓库现状）
	5.	services/iot-service/src/modules/auth/token.service.ts（第三方 token 获取/刷新，落库）
	6.	services/iot-service/src/modules/streams/streams.repository.ts（L1 落库 + L2 Redis 可选）
	7.	services/iot-service/src/common/axios.client.ts（注入超时/重试/签名 Header：time 毫秒、uuid）
	8.	services/iot-service/src/modules/streams/streams.module.ts
	9.	OpenAPI 注解（controller 层）+ Jest 单测样例（service 关键分支、token 过期续期、缓存命中/失效）

对外 API（由 gateway 转发或直接暴露，保持 api 前缀）：
	•	GET /api/iot/cameras?company=北京康比特体育科技股份有限公司
	•	描述：调用第三方 getCameraByCompany，将返回值标准化为：

interface CameraDTO {
  id: string;           // 内部ID（hash 或库ID）
  name: string;         // 第三方 fname
  deviceSn: string;
  channelId: string;
  vendor: 'hik'|'dahua'|'gb28181'|'unknown';
  online: boolean;
  lastSeen?: string;
}


	•	缓存：5 分钟；强制刷新参数 force=true。

	•	GET /api/iot/streams/play?cameraId=xxx
	•	描述：返回最优播放源（优先 HLS、其次 FLV；RTSP 则返回 rtcOffer 或占位 rtsp 并由前端提示/降级）。

interface PlaySourceDTO {
  cameraId: string;
  hlsUrl?: string;
  flvUrl?: string;
  webrtcUrl?: string;
  rtspUrl?: string;
  token?: string; // 可选一次性签名
  expiresAt?: string;
}


	•	GET /api/iot/streams/snapshot?cameraId=xxx
	•	描述：返回快照的签名 URL（接入 MinIO/或透传第三方快照）

要点：
	•	Header 中 time 为毫秒时间戳自动生成，uuid 固定为 cpt。
	•	Token 持久化：表 thirdparty_token（provider=‘GBS’，value、expiredAt）。
	•	配置项读取前缀 ylt_，集中在 ConfigService。
	•	失败兜底：返回 mock 播放地址（内置 demo m3u8）并在响应里标记 mock=true。

OpenAPI 示例（片段）（请写入 Controller 注解中）：

@Get('cameras')
@ApiOperation({ summary: '按公司获取摄像头列表' })
@ApiQuery({ name: 'company', required: true })
@ApiQuery({ name: 'force', required: false, schema: { type: 'boolean' } })
@ApiOkResponse({ type: [CameraResponse] })


⸻

2）前端（apps/web-school）

目标：把“明厨亮灶·实时视频”改为第二张图样式：左侧组织/设备/通道树 + 顶部搜索 + 右侧 2x2 播放宫格 + 每窗格工具条（播放/暂停、截图、全屏、清晰度/码率）+ 底部状态条（通道总数/在线/离线）。

路由与页面：
	•	路由保持：/bright/live（或与当前一致）。
	•	主组件：apps/web-school/src/pages/bright/LiveView.vue（新建或重构）
	•	组合式 Store：apps/web-school/src/stores/streams.ts
	•	API 封装：apps/web-school/src/api/streams.ts

UI 要求（Element Plus + 自定义样式）：
	•	左侧：
	•	搜索框（过滤树节点）
	•	树形结构：公司 -> 设备(NVR) -> Channel，节点名用 fname
	•	节点右键/更多：预览、编辑通道、设为常看
	•	右侧：
	•	2x2 宫格播放器（首屏显示最近 4 个/常看 4 个）
	•	每个窗格悬浮工具条：播放/暂停、静音、截图（调用 /api/iot/streams/snapshot）、清晰度切换（hls/flv）、全屏
	•	码率/分辨率/时延叠加水印（右上角）
	•	空窗格显示“暂无视频”占位
	•	顶部：关键字搜索（按 fname、channel）
	•	底部状态栏：“通道总数：X 在线：Y 离线：Z”（根据 online 字段汇总）
	•	删除旧的“输入单位ID查询”表单。

播放器实现建议：
	•	优先 hls.js（m3u8）、兜底 flv.js（flv）；按 PlaySourceDTO 自动选择。
	•	组件化：PlayerTile.vue，props：camera: CameraDTO、source: PlaySourceDTO。
	•	错误重试（指数退避，3 次）；失败后显示“切换到备用源/重试”按钮。
	•	截图：使用 <video> canvas 截取并通过后端 snapshot 接口补齐。
	•	快捷键：数字键 1-4 切换主画面。

状态管理（Pinia）：
	•	streamsStore：
	•	cameras: CameraDTO[]、selected: string[]、sources: Record<cameraId, PlaySourceDTO>
	•	actions：fetchCameras(company)、loadSource(cameraId)、refreshSources()
	•	5 分钟轮询刷新 cameras 在线状态；visibilitychange 后前台自动恢复。

类型与校验：
	•	在 libs/shared/models 新增/对齐：CameraDTO、PlaySourceDTO 的 TS Interface + Zod Schema；前端 API 响应用 zod 校验并在控制台警告不合规字段。

代码风格：
	•	TS 严格模式、eslint+prettier、中文 i18n 预留 key：bright.live.*。
	•	所有按钮带 data-test-id 方便 E2E。

⸻

验收脚本（本需求最小闭环）
	1.	make dev 或 pnpm -w dev 启动：Postgres/Redis/Nginx/Kafka/服务/前端。
	2.	访问 apps/web-school 登录为 principal@school.cn / Admin@1234。
	3.	打开“明厨亮灶 > 实时视频”：
	•	左侧树自动加载“北京康比特体育科技股份有限公司”的设备与通道，列表名称取 fname。
	•	右侧出现四宫格播放；可点击树节点把通道推入播放格。
	•	工具条可截图、全屏、静音/播放；底部展示通道总数/在线/离线统计。
	4.	断网/切源测试：HLS 不可用时自动尝试 FLV；失败显示兜底 mock 视频并标记。
	5.	apps/web-school 的 E2E：
	•	bright-live-grid-renders、play-source-switch、snapshot-works、statusbar-counters 通过。

⸻

单测与文档
	•	services/iot-service：
	•	streams.service.spec.ts：token 过期→刷新、缓存命中/失效、第三方异常→mock 兜底。
	•	更新 services/iot-service 的 Swagger，并在根目录 postman_collection.json 里新增：
	•	GET /api/iot/cameras
	•	GET /api/iot/streams/play
	•	GET /api/iot/streams/snapshot
	•	.env.example 增加 ylt_* 配置项。
	•	README.md 的“实时视频”章节：说明页面操作与接口对接。

⸻

关键实现细节（请在代码中落实）
	•	Header time：每次外呼第三方前动态生成 Date.now()；uuid 固定 cpt。
	•	TokenService：
	•	登记第三方 provider=GBS；过期阈值提前 5 分钟刷新；落库字段：value、expiredAt。
	•	字段映射：树节点与播放列表名称 严格使用 fname。
	•	固定参数：fthirdcomnum=cpt0904、deviceSn=HQDZKFGBDJGCJ0017（可在 ConfigService 中覆盖）。
	•	删除页面上“输入单位ID查询”输入框与相关逻辑。
	•	Nginx：确保 /api/iot/* 与 /api/streams/* WebSocket/HTTP 透传已配置（若已有仅补充说明）。
	•	可访问性：给按钮与树节点加 aria-label。

⸻

输出格式
	•	以完整代码块输出：
1）后端 streams.controller.ts / streams.service.ts / token.service.ts / repository.ts / dto / entity / module；
2）前端 LiveView.vue / PlayerTile.vue / streams.ts / api/streams.ts；
3）.env.example 追加项；
4）OpenAPI 注解片段；
5）Jest 单测样例（关键逻辑）；
6）Postman 片段（JSON）。
	•	确保复制即可运行，路径与 import 与现有 Monorepo 一致；如需适配，给出 sed/patch 提示。

⸻

成功标准（强制）
	•	UI 与交互接近第二张图（左树+四宫格+工具条+底部状态）。
	•	名称严格使用**fname**；无“单位ID”输入框。
	•	通过 IoT 网关拿到摄像头与播放地址，前端能自动选择 HLS/FLV 源并播放。
	•	5 分钟缓存、token 自动续期、失败兜底可播放 demo。
	•	Postman 导入即测；E2E 关键用例通过。