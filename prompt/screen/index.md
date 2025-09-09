请用 Vue3 + TypeScript + Vite + Pinia + Element Plus 初始化一个项目，并创建统一主题与工具。

要求：
1) 新建 src/styles/tokens.css：定义深色赛博主题变量
   :root{
     --bg-0:#061423; --bg-1:#0A1E33; --line:#0F2A46;
     --primary:#11C5FF; --accent:#7C5CFF; --success:#19D27C; --warn:#FFB020; --error:#FF4D4F;
     --text-1:#E8F1FF; --text-2:#A8C3E6; --text-3:#6C87A6;
     --r-sm:8px; --r-md:12px; --r-lg:14px; --sp-1:8px; --sp-2:12px; --sp-3:16px; --sp-4:24px;
     --glow:0 0 16px rgba(17,197,255,.35), inset 0 0 12px rgba(17,197,255,.08);
     --shadow:0 6px 24px rgba(0,0,0,.25);
   }
2) 新建 src/utils/scale.ts：基于 1920×1080 的 transform 缩放（S=min(w/1920,h/1080)），在 App.vue 根容器应用。
3) 引入 ECharts（按需）与 Element Plus（暗色风）。
4) 建立 src/store/dashboard.ts：放置 mock（KPI/传感器/表格/饼图/反馈）。
5) 配置路径别名 @ → src，ESLint/Prettier 基础。
输出：完整项目，含以上文件与 README（启动/构建方式）。
