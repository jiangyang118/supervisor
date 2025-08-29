# 角色
你是资深全栈工程师与集成测试工程师。请基于下述「米果智能-晨检仪 API」对接要点，为我们的「中小学食品安全智慧管理云平台」实现以下两件事，并交付可运行代码与测试用例：

A. 学校端（Web 管理后台）的「设备管理模块」新增设备时，支持对接“米果智能晨检仪”，实现“自动搜索并自动勾选支持设备”的体验，同时提供单独的“设备端 Mock 服务”配合联调与回归测试。  
B. 在“设备端 Mock 服务”中可模拟人员晨检流程，并将生成的数据**自动**上报到学校端与监管端对应的“晨检模块”。

------------------------------------------------------------
# 上游 API（米果智能晨检仪）要点（据此实现对接与 Mock）
- 协议：HTTP，UTF-8；请求方法 POST/GET；返回 JSON 字符串（服务端可能以 `Content-Type: text/html;charset=UTF-8` 返回，但内容为 JSON，请在客户端做容错解析）。
- 安全：签名（MD5）暂不启用；若未来开启，遵循“参数 ASCII 字典序 + key 拼接后 MD5，再小写”的通用约定。
- 设备唯一标识：`equipmentCode`（或 `machineCode`，文档两处命名并存，需兼容）；员工唯一标识：`userId`（字符串）。

## 主流程 API
1) **员工列表**（拉取员工与健康证等信息，用于设备端识别与本地缓存）
   - GET `${BASE_URL}/device/morningChecker/employeeList?equipmentCode=...`
   - 返回字段示例（只列关键项）：  
     - `statusCode`(200/300), `message`, `data`(数组)  
     - 员工对象含：`userId`(字符串,必有)、`name`(必有)、`post`、`portraitPhoto`(头像 URL)、`healthNumber`、`healthStartTime`、`healthEndTime`、`healthUrl`、`updateTime` 等
   - 业务约束：如需显示健康证到期，`healthStartTime` 与 `healthEndTime` 均需存在。

2) **提交晨检数据**（设备向平台/上游提交单次晨检记录）
   - POST `${BASE_URL}/device/morningChecker/checkData`，`multipart/form-data` 或 `form-data`
   - 字段（关键）：
     - 设备与用户：`equipmentCode` 或 `machineCode`，`uuid`（唯一上报 ID），`userId`(字符串)
     - 体温：`foreheadTemp`(float)，`checkTime`(`YYYY-MM-DD HH:mm:ss`)
     - 阈值与判定：`normalTemperatureRange`（如 `35.9-37.3`），`abnormalTemp`（0 正常 | 1 异常，依据阈值自动判定）
     - 手部检测：`handCheckResult`（异常用逗号分隔：`异物,创可贴,戒指,指甲油,伤口,灰指甲`；无异常为空字符串）
     - 健康询问：`healthAskResult`（异常用逗号分隔：`发烧,腹泻,呕吐,疥疮,咳嗽,湿疹,咽喉痛`；健康为空字符串）
     - 晨检结果：`health`（0 合格 | 1 不合格；需按“体温合格 + 手部合格 + 健康询问合格”的逻辑综合判定）
     - 图片（文件：**不是 URL**）：`faceFile`（仅 1 张）、`palmFile`（手心 1 张）、`backOfHandFile`（手背 1 张）
   - 返回：`statusCode`(200/300), `message`

3) **设备心跳**（设备在线状态与接入可达性探测）
   - POST `${BASE_URL}/device/morningChecker/heartBeatInfo`
   - 入参：`equipmentCode` 或 `machineCode`
   - 返回：`statusCode`(200/300), `message`

4) **获取健康咨询列表**（可选；需确保包含“健康”选项）
   - GET `${BASE_URL}/device/morning/getSymptomList?equipmentCode=...`
   - 返回示例：`data:[{"number":0,"symptomName":"健康"}, ...], statusCode:200, success:true`

5) **上传本地注册人脸**（可选；仅 JPG）
   - POST `${BASE_URL}/device/face/employeeupload`，`multipart/form-data`
   - 入参：`deviceId`、`userId`、`multipartFiles`(File[])，返回 `statusCode`/`message`

> 以上字段命名与返回约束务必严格兼容；对 `equipmentCode/machineCode` 做兜底适配；对 `text/html` 的 JSON 返回做容错解析。资料引用：米果智能-晨检仪 API 文档（v1.0）。【请在实现中将 BASE_URL 做成可配置项】。

------------------------------------------------------------
# 我方平台要实现的目标与交付

## 目标 A：学校端接入（设备管理模块）
1. **UI/UX**  
   - 新增设备 → 选择“米果智能晨检仪” → 点击“自动搜索”  
   - “自动搜索”逻辑：  
     - 通过配置的「候选上游域名池」(可在平台参数中维护) + 管理员输入/扫码得到的 `equipmentCode`，向 `${BASE_URL}/device/morningChecker/heartBeatInfo` 发送探测；返回 `statusCode=200` 视为可达。  
     - 若返回 200，则设备卡片展示“米果智能晨检仪（已兼容）”并自动勾选。  
     - 失败时给出可读错误与手动录入通道（仅录入 `equipmentCode`，后续可在“设备详情”里联测）。
2. **后端集成（学校端）**  
   - 提供“上游对接服务”模块：  
     - 拉取员工列表并缓存：周期任务（默认 15min），同时支持手动刷新；缓存字段含 `userId/name/portraitPhoto/health*` 等。  
     - 设备在线探测：调用心跳 API，写入设备状态。  
     - 健康咨询：调用并校验须含“健康”项；如无则在前端列表中自动补齐“健康”。  
   - **映射与幂等**  
     - 以 `equipmentCode + userId + checkTime(+uuid)` 作为幂等键，避免重复写入。  
     - 将上游字段映射到我方“晨检记录”域模型（见下文数据模型）。  
3. **数据模型（学校端）**  
   - `Device{ id, vendor:'MEGO', equipmentCode, onlineStatus, lastHeartbeatAt, baseUrl }`  
   - `Employee{ userId, name, post, portraitUrl, healthNumber, healthStartTime, healthEndTime, healthCertUrl, updateTime }`  
   - `MorningCheck{ id, equipmentCode, userId, checkTime, foreheadTemp, normalTemperatureMin, normalTemperatureMax, abnormalTemp(0/1), handCheckResult[], healthAskResult[], health(0/1), images{face,palm,backOfHand}, raw }`
4. **学校端 API（供“设备端 Mock 服务”与真实设备回传）**  
   - `POST /api/integrations/morning-checks/mego`  
     - Body 同“提交晨检数据”字段（支持 `multipart/form-data`，存储三类图片）；  
     - 返回 200 JSON：`{ success:true, id: "<recordId>" }`；  
     - 入库后触发事件总线（Kafka/RedisStream 可选）用于监管端同步。

## 目标 B：监管端同步（Web+移动）
1. **监管端接收**  
   - 暴露内部同步 API（仅平台内部调用或经网关授权）  
   - `POST /api/regulator/morning-checks/push`（由学校端事件/任务驱动）  
   - 字段与学校端一致，附加 `schoolId、schoolName`。  
2. **报表与告警联动**  
   - 当 `abnormalTemp=1` 或 `health=1` 或 `handCheckResult/healthAskResult` 含异常项时，写入告警表并推送移动端。

## 目标 C：设备端 Mock 服务（独立可运行）
1. **功能**  
   - 可配置 `BASE_URL`（上游米果）、`equipmentCode`、以及我方平台的学校端与监管端回调地址；  
   - 提供 CLI/HTTP 界面模拟以下流程：  
     a) 设备心跳（周期 30s）  
     b) 拉员工列表（支持缓存/刷新）  
     c) 生成随机或指定的晨检记录（含体温、手部、健康询问、判定逻辑与三张图片占位文件），按规范字段上报至：  
        - 上游米果（可选：若仅联调我方平台，可跳过）  
        - 我方学校端 `/api/integrations/morning-checks/mego`  
        - 我方监管端 `/api/regulator/morning-checks/push`  
   - 图片：使用占位 JPG（项目内置 `/fixtures/*.jpg`）。  
2. **判定逻辑**  
   - `normalTemperatureRange` 默认 `35.9-37.3`；`abnormalTemp = 1` 当 `foreheadTemp > 37.3 or < 35.9`；  
   - `health = 0`（合格）当：体温正常 且 手部检测为空 且 健康询问为空；否则 `health = 1`。  
3. **联调脚本**  
   - 提供 `npm run demo:online`：心跳 → 员工拉取 → 10 条晨检上报 → 查看学校端/监管端入库  
   - 提供 `postman`/`apifox` 集合（含环境变量：`BASE_URL`,`SCHOOL_API`,`REG_API`,`EQUIPMENT_CODE`）

------------------------------------------------------------
# 技术栈与工程要求
- 语言：TypeScript；  
- 服务：NestJS（或 Express + Zod 验证），Multer 处理 multipart；  
- 存储：SQLite（演示）或任意 ORM（Prisma）；  
- 任务与重试：BullMQ（或 node-cron + 重试机制）；  
- 代码结构：`apps/school-api`、`apps/regulator-api`、`apps/device-mock`（monorepo）；  
- 配置：`.env`（支持多环境），所有 URL 与 `equipmentCode` 可配置；  
- 健壮性：  
  - 兼容 `equipmentCode/machineCode`；  
  - 兼容 `text/html` 返回 JSON 的容错解析；  
  - 幂等去重；  
  - 超时与重试（指数退避），失败落库到 DeadLetter；  
  - 全量字段日志脱敏（不记录人脸图片二进制）；  
- 安全：提供占位的 MD5 签名中间件（默认关闭），便于后续一键开启；  
- 文档：OpenAPI 3.1（/docs），并导出 Postman/Apifox 集合；  
- 测试：Jest 单测（映射/判定/幂等），Supertest 集成测试（上报与入库）。

------------------------------------------------------------
# 可交付清单
1) 学校端：设备管理页面（自动搜索/自动勾选）、设备详情、员工缓存刷新、晨检记录列表与告警联动；  
2) 监管端：晨检数据接收 API 与列表页；  
3) 设备端 Mock 服务：心跳/员工拉取/晨检上报（含 CLI 与 HTTP 控制台）；  
4) OpenAPI 3.1、Postman/Apifox 集合、`.env.example`、README（一步跑通）；  
5) E2E 演示脚本：一键启动三服务并完成 10 条晨检数据的端到端链路。

------------------------------------------------------------
# 验收场景（请编写 e2e 脚本确保通过）
- 场景1：管理员在学校端添加设备，点击“自动搜索”，系统调用心跳 API 返回200，自动判定“米果智能晨检仪（已兼容）”，并自动勾选。  
- 场景2：设备端 Mock 周期心跳，学校端设备状态实时更新为“在线”。  
- 场景3：设备端 Mock 拉取员工列表成功并缓存（包含健康证起止日期），UI 可查看。  
- 场景4：设备端 Mock 生成 1 条体温正常、手部/询问均健康的数据，上报学校端与监管端；两端均可检索到该记录，且判定 `health=0`。  
- 场景5：设备端 Mock 生成 1 条体温异常或手部/询问异常的数据，上报后两端产生告警记录，移动端可见。  
- 场景6：同一 `equipmentCode+userId+checkTime(+uuid)` 重复上报只入库一次（幂等）。  
- 场景7：将上游返回 `text/html` 包裹 JSON 的响应输入到解析器，解析不报错。  
- 场景8：切换 `equipmentCode` → `machineCode` 字段命名，系统仍能识别并入库。

------------------------------------------------------------
# 参考示例（伪代码/接口）
- 学校端回调（供设备端/Mock 调用）：
  - `POST /api/integrations/morning-checks/mego`（multipart/form-data；字段同上游“提交晨检数据”）
- 监管端回调（由学校端内部推送或 Mock 直推）：
  - `POST /api/regulator/morning-checks/push`
- 心跳探测（自动搜索）：
  - 调用 `${BASE_URL}/device/morningChecker/heartBeatInfo`，入参 `equipmentCode` 或 `machineCode`，返回 200 视为可达。

请按上述要求输出：
- 完整可运行代码（monorepo 结构）；  
- README、OpenAPI 文件、Postman/Apifox 集合；  
- Demo 脚本（含假图像文件）；  
- 单元/集成测试；  
- 关键业务逻辑注释（中文）。

若文档存在字段或类型不一致（如 `equipmentCode/machineCode`），以“兼容优先 + 容错解析 + 日志提示”的策略实现。