# 智慧食安驾驶舱（screen）

- 技术栈：Vite + Vue3 + TypeScript + Pinia + ECharts5 + DataV（@kjgl77/datav-vue3）。
- 设计语言：深色赛博 + 霓虹蓝高光 + 发光描边 + 科技分隔线。
- 参考稿：`prompt/ui/screen_shian.png`，分辨率基准 1920×1080，含 2K/4K 自适配（等比缩放）。

## 使用

- 安装依赖：在仓库根目录执行 `pnpm i`。
- 本地开发：`pnpm --filter screen dev`（默认端口 `5208`）。
- 构建：`pnpm --filter screen build`；预览：`pnpm --filter screen preview`。
- 配置接口：复制 `.env.example` 为 `.env.local` 并设置 `VITE_API_BASE` 指向线上网关。
- 配置天气：在 `.env.local` 中设置 `VITE_WEATHER_PROVIDER` 与相应 Key/城市；或保持 `none` 使用静态文案。
- 自动地区：设置 `VITE_REGION_AUTO=true`，可选配置 `VITE_REVERSE_GEOCODE_URL`（配合浏览器定位）或 `VITE_IP_GEO_URL`（IP 定位）。
 - 晨检刷新：`VITE_MORNING_REFRESH_SEC` 控制“人员健康安全”卡片的刷新周期（默认 300 秒）。
- 缓存：天气/地区默认走 localStorage 缓存（可通过 `VITE_WEATHER_CACHE_SEC`、`VITE_REGION_CACHE_SEC` 调整）。

## 结构

- `src/styles/tokens.css`：设计令牌（颜色/间距/阴影/高光）。
- `src/echarts/theme-dark.ts`：ECharts 暗色主题。
- `src/components/*`：通用卡片/数值牌/图表/视频墙（内置 DataV 边框/装饰）。
- `src/utils/scale.ts`：基于 1920×1080 的缩放适配。

## 接口对接

- 视频墙：当前为 `<video>` 占位，后续可接入 HLS/WebRTC；标题来自 `/bright/reg/cameras`。
- 学校与 AI：尝试使用 `/reg/schools`、`/reg/ai/events` 渲染；失败自动降级为空态。
- 图表：ECharts 已就绪，通过传入 `x/series` 数据源渲染。

## 天气接入
- 方案一（QWeather 和风天气）
  - `VITE_WEATHER_PROVIDER=qweather`
  - `VITE_QWEATHER_CITY_ID=城市ID`、`VITE_QWEATHER_KEY=你的Key`
  - 调用：`https://devapi.qweather.com/v7/weather/now`
- 方案二（OpenWeather）
  - `VITE_WEATHER_PROVIDER=openweather`
  - `VITE_OPENWEATHER_CITY=城市名,国家码`、`VITE_OPENWEATHER_KEY=你的Key`
  - 调用：`https://api.openweathermap.org/data/2.5/weather`（单位：摄氏）
- 方案三（自定义接口）
  - `VITE_WEATHER_PROVIDER=custom`、`VITE_WEATHER_URL=<你的JSON接口>`
  - 可用变量：`{city}`、`{key}`；返回需包含 `text` 与 `temp`
- 刷新：`VITE_WEATHER_REFRESH_SEC`（默认 600 秒）
- 缓存：`VITE_WEATHER_CACHE_SEC`（默认 600 秒）

## 地区自动识别
- 开启：`VITE_REGION_AUTO=true`
- 方式一（浏览器定位 + 逆地理）：
  - 设置 `VITE_REVERSE_GEOCODE_URL` 模板（支持 `{lat}`/`{lng}`），如 OpenStreetMap Nominatim：
    - `VITE_REVERSE_GEOCODE_URL=https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}`
- 方式二（IP 定位）：
  - 设置 `VITE_IP_GEO_URL`（默认 `https://ipapi.co/json/`）
  - 如需鉴权头：`VITE_IP_GEO_HEADER_NAME`、`VITE_IP_GEO_HEADER_VALUE`
- 鉴权头（逆地理）：`VITE_REVERSE_GEOCODE_HEADER_NAME`、`VITE_REVERSE_GEOCODE_HEADER_VALUE`
- 缓存：`VITE_REGION_CACHE_SEC`（默认 86400 秒）
- 注意：浏览器直连第三方服务需满足 CORS；若跨域受限，建议通过你们的 API 网关做代理（统一注入鉴权与限频）。
- 识别结果用于 Header 左侧地区显示；天气在 OpenWeather/Custom 提供商下会优先使用识别出的城市名。

## 说明

- 此大屏为演示工程，默认使用静态模拟数据；对接真实接口时可引入 `pinia` 状态及服务层。
