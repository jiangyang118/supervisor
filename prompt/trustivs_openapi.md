你是资深企业级后端工程师与代码生成器。请在我现有的 NestJS 项目中，基于我提供的prompt/bright/trustivs_openapi_3_1.json，一次性在【src/modules/trustivs/】目录下（不建子目录）生成**全部接口代码**（环境监控、监管单位、设备/通道/摄像头、AI 抓拍、回放/直播等），技术栈 NestJS + TypeScript + TypeORM + MySQL 8，并实现“本地持久化缓存（MySQL L1）+ Redis 二级缓存（L2，可选）”的 **SWR** 策略；所有缓存、限流、熔断、日志、调度参数须按**开发(dev)/生产(prod)/压测(stress)** 三套环境配置自动切换。

【输出目录（全部放在同一层级 src/modules/trustivs/，建子目录）】
- trustivs.module.ts
- std-response.ts / transform-response.interceptor.ts / all-exceptions.filter.ts
- api-key.guard.ts / header-validation.interceptor.ts
- enums.ts / error-codes.ts / pagination.ts
- cache.config.ts                  # 读取环境变量，生成按 env 的策略对象
- cache.service.ts                 # L1 MySQL + 可选 L2 Redis；SWR、并发去重、熔断、回源逻辑
- scheduler.service.ts             # @nestjs/schedule 定时预热、提前刷新
- redis.provider.ts                # 可选；从 .env 控制启用
- 各资源实体/DTO/Repository/Service/Controller（根据controller层，service层，dao层分别创建目录）
  - company.* / camera.* / channel.* / device.* / ai-record.* / facelib.* / faceinfo.* / facerecord.* /
    autolib.* / autoinfo.* / autorecord.* / environment-record.* / regulator.* /
    playback-url-cache.* / stream-url-cache.* / snapshot-cache.*（可选）
- migration.trustivs.sql(or .ts)   # TypeORM 迁移样例（表+索引+唯一约束）

【OpenAPI 契约】
1) 严格映射全部 paths/HTTP 方法；header: token/time/uuid 强校验；Query/Param/Body DTO 按 components.schemas 生成。
2) 统一返回：StdResponse<T> = { code: "1"|"0"; message: string; data?: T }；全局响应拦截/异常过滤落地。
3) 分页统一：{ pageNum, pageSize, total, pages, list }；DTO 兼容 page/pageNum 差异。

【缓存与数据一致性（SWR：stale-while-revalidate）】
- L1：MySQL 持久化缓存表（playback_url_cache、stream_url_cache、snapshot_cache 可选、device、channel、camera 等业务主表）。
- L2（可选）：Redis；作为热点 Key 的短 TTL 二级缓存（开关由 .env 控制：USE_REDIS_CACHE=true/false）。
- 读流程：先查 L2→若 miss 查 L1→命中且未过期直接返回；若过期返回陈旧数据并后台回源刷新；若未命中则回源→写 L1(+L2)→返回。
- 回源并发去重：同 key 同时只允许一个回源 Promise，其他请求等待或返回陈旧数据。
- 心跳/通道上报触发失效：/openApi/sendHeartInfo、/openApi/sendChannel 到来后，软失效关联的 stream/snapshot/device/channel 缓存。

【环境分级策略（dev / prod / stress）——请在 cache.config.ts 内以配置对象形式实现，并从环境变量或 NODE_ENV 选择】
1) TTL 与 maxStale（单位：秒；提前刷新 leadTime 为 TTL 的一部分）  
   - 设备列表 / 通道列表 / 摄像头列表：
     - dev:    TTL=600,  maxStale=1800, leadTime=60
     - prod:   TTL=900,  maxStale=1800, leadTime=90
     - stress: TTL=300,  maxStale=600,  leadTime=30
   - 直播地址 getStreamURL（短有效）：
     - dev:    TTL=120,  maxStale=300,  leadTime=20
     - prod:   TTL=120,  maxStale=180,  leadTime=20
     - stress: TTL=60,   maxStale=120,  leadTime=15
   - 回放地址 getBackUrl / getDownloadUrl（按 serial+starttime+endtime+code 唯一）：
     - dev:    TTL=1800, maxStale=3600, leadTime=120
     - prod:   TTL=1800, maxStale=3600, leadTime=300
     - stress: TTL=900,  maxStale=1800, leadTime=60
   - 快照 getSnap（如用缓存）：
     - dev:    TTL=60,   maxStale=120,  leadTime=10
     - prod:   TTL=60,   maxStale=90,   leadTime=10
     - stress: TTL=30,   maxStale=60,   leadTime=5

2) 限流与熔断  
   - 全局速率限制（@nestjs/throttler）：
     - dev:    limit=100/min per token+IP
     - prod:   limit=300/min per token+IP
     - stress: limit=1000/min per token+IP
   - 上游调用熔断（cache.service.ts 内计数）：
     - dev:    failureThreshold=5,  halfOpenAfter=30s,  openTimeout=60s
     - prod:   failureThreshold=3,  halfOpenAfter=60s,  openTimeout=120s
     - stress: failureThreshold=10, halfOpenAfter=15s,  openTimeout=30s
   - 并发去重窗口（同 key）：
     - dev:    5s
     - prod:   8s
     - stress: 3s

3) 调度（@nestjs/schedule）  
   - 列表预热（设备/通道/摄像头）：
     - dev:    */30 * * * *  （每 30 分钟）
     - prod:   */20 * * * *  （每 20 分钟）
     - stress: */5  * * * *  （每 5 分钟）
   - 提前刷新：当距离 expiresAt ≤ leadTime 时，调度任务优先刷新热点 key。
   - 热点识别：根据最近 10 分钟命中次数排序，刷新 Top-N（dev:10，prod:20，stress:50）。

4) 日志与追踪  
   - 日志级别：
     - dev:    debug
     - prod:   info
     - stress: warn
   - 每次回源打印 traceId、key、耗时、返回大小；慢查询/慢回源阈值（ms）：dev=300, prod=200, stress=150。

5) Header 校验与时间漂移  
   - time/uuid 必填，时间漂移允许：
     - dev:    ±10 分钟
     - prod:   ±5 分钟
     - stress: ±2 分钟
   - 可由 `TIME_SKEW_MINUTES` 覆盖。

6) Redis 二级缓存（可选）
   - 开关：USE_REDIS_CACHE=true/false（默认 prod=true，其它 false）。
   - 连接：REDIS_URL / REDIS_HOST / REDIS_PORT / REDIS_PASSWORD；失败不影响主流程（降级仅用 L1）。

【关键实现】
1) Controller：仅路由与 DTO 校验，统一 `@UseGuards(ApiKeyGuard)`、`@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)`。
2) Service：编排分页、事务与缓存访问；为回放/直播/列表封装 `getOrRefreshXxx(args, policy)`，内部采用 SWR。
3) Repository：TypeORM 访问；列表 `findPaged()`、批量 `upsertMany()`；按 fsocialcreditcode/deviceId/channelId/nvrsn/f(cre)atetime 建索引。
4) 接口覆盖（方法名可自定义，路径/HTTP 方法必须与 OpenAPI 一致）：
   - Auth：POST /gatewayGBS/openApi/token/getOpenApiToken
   - AI/设备/通道/回放直播：/getCompanyList、/getCameraByCompany、/getAIRecordByCompany、
     GET /getBackUrl、GET /getDownloadUrl、POST /getStreamURL、GET /getSnap、
     /getDeviceStatus、/getChannelStatus、/getDeviceStatusByCompany、/getDeviceListByCompany、
     /getChannelByDevice、GET /device/getConfig
   - Face/Vehicle：/v1/facelib/*、/v1/faceinfo/*、/v1/facerecord/get、/v1/autolib/*、/v1/autoinfo/*、/v1/autorecord/get
   - 心跳/环境上报（入库＋失效）：POST /openApi/sendAIRecordByCompany、/openApi/sendHeartInfo、/openApi/sendChannel、/openApi/sendHumRecord
   - 监管/机构：/regulator/saveOrUpdateReagulator、/regulator/updateReagulatorStatus、/regulator/getRegulatorTree、
     /company/saveOrUpdateCompany、/company/changeCompanyStatus、/company/getCompanyBySocialCreditCode

【.env 约定（样例，注释到 README）】
- NODE_ENV=development|production|stress
- DB_xxx（沿用现有项目）
- USE_REDIS_CACHE=true|false（默认：prod=true，其它 false）
- TIME_SKEW_MINUTES=5
- CACHE_PLAYBACK_TTL/CACHE_STREAM_TTL/CACHE_LIST_TTL 等支持覆盖（留默认，不必强填）
- THROTTLE_LIMIT/MINUTE、CIRCUIT_FAILURE_THRESHOLD/OPEN_TIMEOUT 等支持覆盖

【验收标准】
- 仅在 src/modules/trustivs/ 目录生成所有文件（建子目录）；`TrustivsModule` 可被 `AppModule` 引入后直接工作。
- 所有路由与 OpenAPI 一致；header 校验、统一响应生效；分页正确。
- 本地持久化缓存（L1）+ 可选 Redis（L2）生效；TTL/maxStale/leadTime 随 dev/prod/stress 自动切换。
- 心跳/通道上报能更新在线状态并**软失效**对应缓存；调度能按环境预热与提前刷新热点。
- 并发去重、熔断、降级策略可观察（日志有 traceId、key、耗时、状态）。
- 代码可编译通过；提供最小化迁移样例；README 注明接线与环境变量说明。
请直接输出【src/modules/trustivs/】目录下的全部代码文件内容。