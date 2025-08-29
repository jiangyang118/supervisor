# 设备管理移动端（UniApp）— 运行指引

该目录是一个精简版 UniApp 壳工程，建议使用 HBuilderX 打开运行。为保持兼容性，未附带额外的 Vite/CLI 配置。

## 方式 A：HBuilderX（可选）
1) 安装 HBuilderX
   - 官网下载：https://www.dcloud.io/hbuilderx.html
   - 选择带 UniApp 支持的版本（内置运行目标）。
2) 打开项目
   - 菜单：文件 → 打开目录 → 选择 `apps/mobile-device`。
   - 等待 HBuilderX 索引完成。
3) 运行到浏览器（H5）
   - 工具栏：运行 → 运行到浏览器 → 选择 Chrome（或其它浏览器）。
   - HBuilderX 会显示本地访问地址（如 `http://localhost:xxxx`）。
4) 运行到模拟器/真机（可选）
   - Android：安装 Android SDK 或开启手机 USB 调试并连接电脑。
   - iOS（macOS）：使用 iOS 模拟器或连接 iPhone（需要证书/签名配置）。
5) 打包发布（可选）
   - 工具栏：发行 → 选择目标（App/H5/小程序），按向导操作。

## 方式 B：CLI（已内置 Vite 方式，推荐）
1) 安装依赖：
   - `cd apps/mobile-device && npm i`
2) 本地开发（H5）：
   - `npm run dev`
   - 浏览器打开命令行输出的地址（默认 http://localhost:4210）
3) 预览/打包：
   - 预览：`npm run preview`
   - 构建：`npm run build`（产物位于 `dist`）

## 与 MEGO 演示联调（CLI/H5）
- 当前已改为标准 Vue + Vite H5 运行，不依赖 Kafka/MinIO 等基础设施，可独立运行。
- 如需联调学校端集成服务（默认 `:4001`）：
  - 新增 `src/api.ts` 发起请求；在页面中调用。
  - 局域网请使用宿主机 IP（如 `http://192.168.11.133:4001`），不要用 `localhost`（真机无法访问电脑）。

## 常见问题
- 看不到运行目标：确认 HBuilderX 已安装 “uni-app” 插件或使用完整版本。
- 识别不到设备：开启 Android USB 调试或改用模拟器运行。
- 网络请求失败：将接口地址中的 `localhost` 改为电脑的局域网 IP。

## 组件库（Vant）
- 本项目已集成 Vant（Vue 3 移动端组件库），通过 Vite 插件按需自动引入。
- 安装：`cd apps/mobile-device && npm i`
- 使用示例：
  - 视图中直接写 `<van-button type="primary">按钮</van-button>` 即可使用，无需手动 import。
  - 配置位置：`vite.config.ts` 中的 `unplugin-vue-components` + `VantResolver`。
