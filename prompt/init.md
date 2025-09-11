你将担任首席系统架构师 & 全栈交付工程负责人，目标是在单一 Monorepo 内一次性生成一套可运行、可部署、可演示的“中小学食品安全智慧管理云平台”（含学校端、监管端、设备管理移动端、应急指挥系统（Web+移动端）与AI视频巡检/物联接入），并逐项满足下方功能清单的验收条款。

交付目标（必须全部产出）

1.工程结构（Monorepo）

- Nx + pnpm 管理；packages: apps/web-school, apps/web-regulator, apps/mobile-device, apps/web-emergency, apps/mobile-emergency, services/gateway-service, services/food-safety-service, services/inventory-service, services/iot-service, services/ai-vision-service, services/alert-service, libs/shared, infra. 2.技术栈约束
- 前端 Web：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus，SSR 关闭；国际化 i18n 预留。
- 移动端f：UniApp（HBuilderX 兼容）或 React Native（二选一，优先 UniApp），与后端同一鉴权体系。
- 后端：Node.js 20 + NestJS（模块化微服务），API Gateway（REST + WebSocket 推送 + OpenAPI 3.1）。
- 数据：PostgreSQL（主库）+ Redis（缓存/会话/队列延时）+ MinIO（对象存储，留样照片/视频快照）。
- 消息总线：Kafka（事件溯源与异步解耦）。
- 视频/设备：RTSP/GB28181（通过 services/iot-service 统一抽象，NVR 接入适配）；支持海康/大华常见协议；AI 事件通过 services/ai-vision-service（可模拟模型）。
- AI 巡检：提供可运行的伪装推理服务（定时从摄像头流读取帧→规则/Mock 模型→产出违规事件），并暴露 /events Webhook。
- 安全：JWT + RBAC + 最小权限；审计日志；敏感信息加密；文件签名校验；基础分区分域网络说明与网关校验。3.核心能力
- 统一登录与多租户：教育局（监管端）、学校（学校端）、供应商、设备运维、家长（只读H5）角色模型与租户隔离。
- 可运行 Demo 数据：初始化脚本 + 种子数据（学校、食堂、人员、设备、摄像头、台账、AI 抓拍样例）。
- 完整 OpenAPI 文档：按模块分组；提供 Postman/Apifox JSON 导出。
- 数据库建模与迁移：SQL 脚本 + Prisma/TypeORM（任选其一，优先 Prisma）。
- 端到端用例：每一大模块至少 1 条可演示“创建→上报/抓拍→预警→处置→统计→导出”的闭环。
- 导出能力：表格 CSV/Excel、报表 PDF（学校/监管的“每日报表”与“预警看板”PDF）。
  4.DevOps 与运行
- 所有服务提供 Dockerfile、docker-compose.yml 一键起本地环境；.env.example；make dev/make demo。
- 提供 infra/ 下的 Nginx 反向代理（含静态资源与 WebSocket 转发）、示例 TLS（自签证书）。5.验收脚本
- scripts/demo.sh：一键初始化数据库→导入种子→启动→打开预置账号→触发 3 条 AI 违规事件→生成两端每日报表 PDF。

---

功能需求清单（
逐项落地，逐项可测
）

说明：以下条款直接映射为API、UI 页面、数据库表、事件与报表。每一条必须在代码中有实现或可演示的 Mock 实现；所有“支持导出”的条目都提供导出按钮与后端导出接口；“AI 抓拍/预警”由 ai-vision-service 产出事件并经 Kafka 分发给 alert-service 入库与推送。

1）食品安全智慧管理云平台——学校端（Web）

- 首页
- 查看：学校基础数据、晨检、工勤人员健康证、实时监控、入库/出库、卫生上报、AI 预警、设备信息、家长分析
- 今日待办：晨检、消毒、留样、陪餐、废弃物处理、卫生检查
- 每日报表
- 自动汇总（晨检、留样、消毒、陪餐、废弃物、卫生检查），可导出
- 统计 AI 抓拍（未戴口罩/帽/工作服/手套、打电话、吸烟、烟火、鼠患），按日/周/月/自定义，导出
- 智能检查管理
- 违规抓拍明细→处置→记录处理措施
- 互联网+明厨亮灶
- 实时视频/回放（按摄像头/日期/时间段），快照留存（可筛选），通道配置（编辑/预览）
- 晨检管理
- 人员晨检录入与台账上报（导出）；晨检仪接入（自动上报）；异常查看与处置（导出）
- 留样管理
- 样品信息/时长/图片/重量；留样秤与留样柜接入（称重→拍照→存放→自动上报）；样品清理记录（可由留样柜自动生成）；记录/异常查看与导出
- 陪餐管理
- 餐次/人员/图片/评价，上报与导出；陪餐二维码；人脸识别摄像头接入→自动生成陪餐记录
- 农残快检管理
- 农残检测仪接入与结果上报；异常查看与处置（导出）
- 消毒管理
- 方式/时长/物品/图片台账（导出）；异常处置（导出）
- 废弃物管理
- 日期/种类/数量/收购单位/收运人等（导出）
- 卫生检查管理
- 卫生检查台账（导出）；固定资产维护台账（导出）
- 出入库管理
- 商品管理（手动、云食材库导入、模板导入）
- 入库登记（数量/供应商/影像）（导出与台账）
- 库存记录与盘点；出库登记（用途/出库人）（导出）
- 电子秤接入自动上报；索票索证查看与补传；食品添加剂使用记录（导出）
- 供应商管理；仓库信息管理
- 资质证件管理
- 食堂/人员/供应商资质证件维护与到期自动异常、处置（导出）
- 培训考试管理
- 培训课程；考试（单选/多选/判断、乱序、结果显示策略、自动判卷与合格判定、短信/移动端通知），针对课程建考；台账导出
- 食品浪费管理
- 库存损耗/加工损耗/剩菜剩饭损耗的重量/金额/原因统计
- 公示管理
- 公众投诉/建议/表扬/评论处理与一键回复
- 公示项配置：是否公开直播、用户评价、机构证件、人员证件、食安等级、食材溯源信息（单价/金额/数量/过期/供应商）、是否公开营养菜品
- 应急管理
- 概览（事件/演练/视频会议/任务提醒，短信与AI 语音通知），快捷接警/消警/启动预案/入会/处理任务
- 预案管理（流程/法规/行动）
- 值守管理（小组/班组）
- 事件/演练管理（接警、消警、公示）
- 指挥调度（视频会议：预开关麦/摄像头、入会后控制、共享屏幕、邀请；任务管理）
- 视频监控管理（学校下摄像头流）
- 资源库（图片/视频/Word/Excel/PPT 分类管理）
- 隐患排查管理
- 隐患记录、任务分配（移动端整改与上报）、风险清单
- 预警汇总
- 看板：证件/食材/行为/设备/农残/上报/投诉 等预警
- 预警接收配置（短信/站内）、内容自定义（时间/接收人/范围）
- 已接入设备信息：网关、公示盒、分析器（配置分析项）、传感器、留样柜/秤（含权限分配）
- 大数据统计
- 数据看板：数据统计、实时监控、人员健康证、AI 预警、晨检、上报、今日入/出库、满意度、菜品、用途等
- 食安指数查看
- 系统配置
- 公告公文；学校食堂信息维护；与监管端关联申请处理；APP 下载；餐次设置；用户/角色/RBAC

2）食品安全智慧管理云平台——监管端（Web）

- 首页（统计与点击钻取学校全量信息）
- 每日报表（辖区上报统计+AI 抓拍统计，导出）
- 智能巡查监管（AI 抓拍明细导出；发布巡查任务；喊话摄像头自动语音警告；远程喊话）
- 明厨亮灶监管（实时/回放/快照）
- 晨检/留样/陪餐/农残/消毒/废弃物/出入库/索证/添加剂等各类台账（区间查询+导出）
- 资质证件监管（食堂/人员/供应商 基本信息+异常与处置台账）
- 培训考试监管（培训/考试台账导出）
- 食品浪费监管（排行与明细）
- 公示监管（公众反馈）
- 监督检查（日常/专项/双随机，网格化检查人员配置，检查内容/公示/处罚类型配置）
- 预警汇总（维度统计、实时同步、预警配置、自定义推送）
- 大数据统计（基础、任务、人员画像、上报、监控、菜单、满意度、排名、物联网在线离线）
- 食安指数（排名+配置指标/类别/权重/等级）
- 系统配置（资讯推送、平台关联、APP 下载、用户与角色、监管单位信息）

3）设备管理平台（移动端）

- 多学校/多食堂智能终端管理；网关/分析器/公示盒/电子秤/手持仪/留样柜/留样秤 自动扫描与手动添加
- 远程状态查看与操作（重启/删除）
- NVR/摄像头视频播放与统一管理

4）智能平板（86”）——**生成“演示版控制台页面”**以模拟大屏（无需驱动硬件）

- 大屏分区：预警、摄像头轮巡、今日上报进度、AI 抓拍榜单、学校对比

5）风险预警与应急管理系统（Web + 移动端）

- 指挥中心概览（事件数量、会议提醒、短信/AI 语音通知）
- 预案管理（流程/法规/行动；可下发至下属学校）
- 事件/演练管理（已接警事件/演练，进度跟踪）
- 指挥调度（视频会议管理与会中控制、任务分配）
- 视频监控管理（各校摄像头）
- 资源库（含下发同步）
- 移动端需支持：事件/演练跟踪、参会、主持人权限控制、任务处理

---

数据与接口（最低要求）

1.核心数据模型（请在 libs/shared/models 定义 TypeScript 接口 + Zod 校验）

- School, Canteen, Staff, HealthCertificate, Device{Gateway/Analyzer/DisplayBox/Scale/Sampler/NVR/Camera/Sensor}, Inventory{Item, Inbound, Outbound, Stock, TicketCert, AdditiveUsage}, Inspection{Hygiene, AssetMaintenance}, Sampling{Record, Cleanup}, DineWith{Record}, MorningCheck, Disinfection, Waste, PesticideTest, PublicFeedback, Training{Course, Exam, Question, Result}, AIEvent{type, snapshot, handledBy, measure}, Alert{type, level, status, routedTo}, Emergency{Plan, Event, Drill, Task, Conference}, RiskHidden{Record, Task}, FoodWaste{lossType, weight, amount, reason}, SafetyIndex{Indicator, Weighting, Score}. 2.接口规范
- 所有 CRUD + 统计 + 导出接口；分页、排序、过滤统一参数；OpenAPI 注释完整。
- 事件流：/ai/events（Webhook In），/alerts/subscribe（WS 推送），/emergency/notify（短信/语音 Mock）。
- 设备接入：/devices/register、/devices/:id/commands（重启/设置）、/streams/play（签名 URL）、/streams/snapshot。3.权限与审计
- RBAC（角色：RegulatorAdmin、SchoolAdmin、CanteenStaff、Supplier、DeviceOps、GuardianReadOnly 等）；
- 审计日志表（用户、操作、资源、时间、IP、结果）。

---

页面与用例（示例，需全部实现）

- 学校端/首页：今日待办卡片 + 预警卡片 + 监控墙 + 台账快捷录入。
- 监管端/智能巡查：AI 抓拍明细 → 一键远程喊话 → 处置记录 → 报表导出。
- 学校端/陪餐管理：二维码生成与扫码表单；人脸抓拍自动入库（以 Mock 视频帧模拟）。
- 出入库管理：电子秤回传重量自动入库；索票索证补传；添加剂使用登记与导出。
- 应急指挥：接收到预警→一键建事件→选预案→开会议→分派任务→事件公示。

---

种子与演示

- seed.ts：生成 3 个区县监管单位、10 所学校、每校 2 个食堂、人员 50、设备 30、摄像头 40、近 7 日全量台账。
- demo.sh：启动后
  a.向 /ai/events 注入 3 条违规（未戴口罩/吸烟/鼠患）；
  b.在监管端触发远程喊话；
  c.生成学校与监管“每日报表”PDF到 /exports；
  d.WebSocket 客户端展示预警弹窗。

---

安全与合规（最小集合）

- JWT 双 Token（访问/刷新）；密码 Bcrypt；关键字段（证件号、手机号）加密存储；对象存储私有桶 + 一次性签名 URL；操作审计。
- 分区分域示意：public（家长/公示）、school、regulator、device，网关基于路径与角色隔离。

---

质量门槛

- 后端：每个服务 ≥80% 覆盖率的单元测试（关键用例）；
- 前端：关键页面 E2E（登录、AI 预警处置、报表导出）；
- Lint/Prettier/Commitlint/Husky；CI（可提供 GitHub Actions 示例）。

---

账户与演示入口（写入 README）

- 监管端：admin@reg.gov / Admin@1234
- 学校端：principal@school.cn / Admin@1234
- 设备运维：ops@vendor.cn / Admin@1234

---

生成顺序（严格执行）

1.生成 Monorepo 目录与 Nx 配置 → package.json、pnpm-workspace.yaml、根级脚本。2.为每个服务生成 NestJS 脚手架、模块骨架、DTO、实体、控制器、服务、路由与 OpenAPI。3.生成 Prisma Schema 与迁移脚本、种子数据、Docker Compose（Postgres/Redis/MinIO/Kafka/ZooKeeper/Nginx）。4.生成 前端应用（路由、布局、登录、RBAC 菜单、关键页面与表格/表单/统计图、导出按钮）。5.生成 AI 事件 Mock 服务 与 视频流适配器（提供伪造 RTSP 源与快照 API）。6.编写 demo.sh 与 README（含启动步骤与验收路径）。7.添加 Postman/Apifox 导出、示例报表模板（PDF/Excel）。8.补齐测试、Lint、CI、.env.example。

---

输出格式（一次性给全量代码）

- 以代码块输出：目录树预览、关键文件的完整内容（可分批次连续输出，保证可复制运行）。
- 最后附：docker-compose.yml、.env.example、README.md、scripts/demo.sh、postman_collection.json / apifox.json 全文。

---

严格对照的需求清单原文（用于逐条映射与生成）

将下方清单逐条实现/可演示，字段、动作、报表名与“支持导出/回放/快照/配置/预案/值守/验收”等关键词必须在 UI 与 API 中出现并可用。
（以下为原始条款，保持不改动，用于代码与测试映射）

[粘贴用户上方“学校端/监管端/设备管理/智能平板/应急系统（Web+移动端）”的全部条款清单原文——已在本次消息中提供，可原样包含到你的 Prompt 中，或作为附录 A 引用。]

---

评审与自检

- 生成后，请输出一份条款满足矩阵（Requirement → 实现位置：页面/接口/表/事件/导出），确保100% 覆盖；列出任何以 Mock 方式替代的点与未来可替换的真实设备/算法接口。

开始生成代码。
