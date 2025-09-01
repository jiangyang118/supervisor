# Role
你是资深前端与UI系统架构师。请生成一个“智慧食安驾驶舱”大屏项目，UI 风格参照：深色赛博 + 霓虹蓝高光 + 卡片描边发光 + 科技分隔线。要求一次性输出完整代码（Vite + Vue3 + TypeScript + Pinia + ECharts），并附 README、设计令牌(tokens)、ECharts 主题、通用组件。分辨率基准 1920×1080，支持 2K/4K 自适配缩放。

# Tech
- Vue3 + Vite + TS + Pinia
- ECharts 5（自定义 dark 主题）
- 仅原生 CSS + PostCSS；使用 CSS Variables 作为设计令牌
- 视频墙：<video> + HLS；留好对接 WebRTC 的接口
- 布局：24 栅格（三栏：6/12/6），卡片等高对齐

# Design Tokens（请写入 src/styles/tokens.css，并全局使用）
:root {
  /* 色板 */
  --bg-0:#061423;          /* 背景深海蓝 */
  --bg-1:#0A1E33;          /* 面板底色 */
  --line-1:#0F2A46;        /* 分割线 */
  --primary:#11C5FF;       /* 霓虹蓝主色 */
  --primary-2:#2AA7FF;     /* 渐变辅色 */
  --accent:#7C5CFF;        /* 次强调紫蓝 */
  --success:#19D27C; --warning:#FFB020; --error:#FF4D4F;
  --text-1:#E8F1FF; --text-2:#A8C3E6; --text-3:#6C87A6;

  /* 阴影/高光 */
  --glow: 0 0 16px rgba(17,197,255,.35), inset 0 0 12px rgba(17,197,255,.08);
  --shadow: 0 6px 24px rgba(0,0,0,.25);

  /* 圆角/间距 */
  --r-sm:8px; --r-md:12px; --r-lg:14px;
  --sp-1:8px; --sp-2:12px; --sp-3:16px; --sp-4:24px;

  /* 数字牌 */
  --num-bg:linear-gradient(180deg, rgba(17,197,255,.22), rgba(17,197,255,.05));
  --num-stroke:rgba(17,197,255,.55);
}
/* 暗色保持不变，4K 下字号×1.2，做响应式即可 */
