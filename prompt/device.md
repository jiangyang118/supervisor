角色

你同时扮演API 规范官 + 后端架构师 + 测试负责人。

输入（依据截图抽取的确定性信息）

通信：HTTP，方法仅 GET/POST；JSON 数据格式；UTF-8 编码；服务端响应 Content-Type 必须为 application/json;charset=UTF-8（截图中示例为 text/html，属不合规，需在“差异澄清”中指出并修正）。

签名：规则存在但暂不启用。启用时：

取所有参与参数，按参数名 ASCII 升序拼接为 URL 键值对串 key1=v1&key2=v2…（区分大小写；空值不参与；sign 不参与）。

在末尾**拼接 key（由米果分配）**得到 stringSignTemp；

对 stringSignTemp 做 MD5，再转小写作为 sign。

BaseURL 占位：${SERVER}/。

主要 API：

员工列表（主流程）

GET ${SERVER}/device/morningChecker/employeeList

Query：equipmentCode : string（设备唯一ID，来自后台设备菜单）

Response：

{
"statusCode": 200, // 200 成功，300 失败
"message": "操作成功",
"data": [
{
"userId": "126", // 字符串，必有
"name": "李食神", // 不能为空
"post": "总厨",
"portraitPhoto": "http://.../face/xxx.jpg?v=1734571595661", // 人脸链接（只允许出现一个人脸）
"healthStartTime": "2024-12-03", // 与 healthEndTime 同时出现或同时为空
"healthEndTime": "2026-11-05",
"healthNumber": "2222",
"healthUrl": "http://.../healthUrl/xxx.jpg",
"updateTime": "2024-12-25 12:00:00"
}
]
}

规则：健康证展示以 healthEndTime 为准；若展示，healthStartTime 与 healthEndTime 必须同时有值。

提交晨检数据（主流程）

POST ${SERVER}/device/morningChecker/checkData

说明：文档标注“formdata”，但主体为结构化字段+图片文件列表；请在规范中同时给出 multipart/form-data 与 application/json 两种候选，并在“待澄清”列出首选。

Fields（正文或表单）：

{
"equipmentCode": "asdsdsdsa2342", // 设备ID
"uuid": "1232312dsdsfdsg", // 唯一标识ID
"userId": "123", // 员工ID（字符串）
"foreheadTemp": 36.6, // 体温(℃)，浮点
"checkTime": "2024-12-20 18:00:00", // 晨检时间(本地或服务器时区，需澄清)
"abnormalTemp": "0", // 温度是否异常：0 正常 / 1 异常（需与阈值规则对齐）
"normalTemperatureRange": "35.9-37.3",// 正常范围（左最小右最大）
"handCheckResult": "创可贴,指甲油", // 手部检查结果（多项，用分隔符，文档示例为中文逗号/顿号，需澄清）
"healthAskResult": "咳嗽,湿疹", // 健康询问结果（多项）
"health": "1", // 晨检总结果：1 合格 / 0 不合格（截图有 data.isAllHealth? 反转的描述，需澄清）
"faceFile": [<File>], // 人脸图片（文件列表，JPG，仅1条）
"palmFile": [<File>], // 手心照片（文件列表）
"backOfHandFile": [<File>] // 手背照片（文件列表）
}

Response：

{ "statusCode": "200", "message": "操作成功" } // 文档处同时出现 int 与 string 两种示例，需统一

设备心跳

POST ${SERVER}/device/morningChecker/heartbeatInfo

Body：

{ "machineCode": "ac00146471d2c711", "equipmentCode": "ac00146471d2c711" }

文档写法为 “equipmentCode/machineCode”，推断两者等价或至少其一必传；需在“待澄清”明确字段优先级/兼容策略。

Response：{ "statusCode":200, "message":"操作成功" }

获取健康咨询列表（可选）

GET ${SERVER}/device/morning/getSymptomList?equipmentCode=...

Response（必须包含“健康”项）：

{
"data":[
{"number":0, "symptomName":"健康"},
{"number":1, "symptomName":"发烧"},
{"number":2, "symptomName":"腹泻"}
],
"success": true,
"resCode": 200,
"message": "操作成功",
"resMsg": "操作成功",
"statusCode": 200
}

上传本地注册人脸（可选）

POST ${SERVER}/device/face/employeeupload

Content-Type：multipart/form-data

Form：deviceId: string、userId: string、multipartFiles: File[]（JPG，仅 1 条）

Response：{ "statusCode":200, "message":"操作成功" }

输出物（按顺序逐项给出）

《差异与待澄清清单》

逐条列出：Content-Type 不一致；statusCode 类型不一致（int vs string）；equipmentCode vs machineCode；checkData 的 媒体类型 与 图片字段承载方式；abnormalTemp 与 normalTemperatureRange 的判定逻辑；health 取值与语义；多值分隔符；checkTime 时区基准与允许偏差。

为每一项给出【默认假设】与验证办法（抓包例、对端确认口径）。

OpenAPI 3.1（YAML）

覆盖 5 个 API 的路径、入参、示例、响应 Schema、错误码（至少 200/300/4xx/5xx），并把签名定义到 components.securitySchemes.mg_md5（开关用 x-feature-flags.signature 声明为默认关闭）。

TypeScript SDK（Axios）

支持 BASE_URL/timeout/retry(trace_id 幂等)；暴露 toggleSignature(on:boolean, key?:string)；

统一错误模型 SdkError{ code, httpStatus, message, requestId }；

给出 employeeList/checkData/heartbeat/getSymptomList/uploadFace 方法与用法示例。

签名中间件（Koa 或 Nest 二选一）

实现 MD5-ASCII 排序规则；sign 排除；空值跳过；末尾拼 key；转小写；

提供开关与灰度（仅对部分路由启用）。

Postman 集合与环境

预置 5 条接口用例（含成功、缺参、非法温度、图片缺失、签名开/关）；Pre-request Script 自动计算 sign。

Apifox 导入文件（与 OpenAPI 对齐）

联调脚本

curl 与 npm run e2e 两套；覆盖：正常流、300 错误、图片上传、签名开关切换；

附 k6 压测样例（QPS、p95）。

验收清单

employeeList 返回数据在 portraitPhoto/health\* 字段齐全时通过校验；

checkData 支持图片，签名开启后能校验通过；

heartbeat ≥ 每 N 秒一次（N 由对端建议，默认 60s）时服务端状态为在线；

所有接口 Content-Type 为 application/json;charset=UTF-8；SDK/Postman/Apifox 三一致。

生成规则

不得编造字段；缺失处以【默认假设】+“待澄清”标注。

所有示例可直接运行；附 README 与一键命令。

输出顺序严格按“输出物 1→8”。
