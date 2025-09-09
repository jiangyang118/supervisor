你是资深前端工程师。请为“智慧大屏驾驶舱”实现**多分辨率兼容**的前端骨架，要求在 1366×768、1600×900、1920×1080、2560×1440、4K 等分辨率下，布局与字号/图表/表格自适应，不破版、信息密度合理。技术栈：Vue3 + TypeScript + Vite + Element Plus + ECharts。

# 目标
- 布局自适应（Grid/Flex + 断点），列数可变：≥1920 三列、1600~1919 两列、≤1366 单列。
- 字体/间距/圆角等比缩放（clamp + vw），不因缩放模糊。
- 图表随容器尺寸变化自动 resize（ResizeObserver）。
- 表格/列表高度根据窗口动态计算、内部滚动。
- 极端/小屏兜底：根容器可启用 transform: scale 的整体缩放。

# 目录结构（请生成所有文件）
src/
  styles/tokens.css            # 色板、字号/间距令牌、断点与 clamp
  utils/viewport.ts            # mountScaleVar(baseW=1920) 写入 --scale 兜底
  hooks/useChart.ts            # ECharts + ResizeObserver 自适应
  layout/DashboardLayout.vue   # 三列响应式网格（含断点）
  components/
    PanelCard.vue              # 通用卡片（圆角/描边/发光/内边距用 tokens）
    KpiTile.vue                # 指标卡：label + 数字，字号用 clamp
    VideoWall.vue              # 2x2 视频墙（object-fit:cover）
    SensorCard.vue             # 传感器小卡（warn 态样式）
    DataTable.vue              # 基于 ElTable 的深色表格封装（自适应高度）
    PieChart.vue               # 饼图，暗色主题，随容器自适应
  pages/Dashboard.vue          # 汇总三列内容（用 mock 数据演示）

# 关键样式（请在 tokens.css 实现）
:root{
  /* 基础配色省略，可用深色赛博风 */
  --bg-0:#061423; --bg-1:#0A1E33; --line:#0F2A46;
  --primary:#11C5FF; --accent:#7C5CFF;
  --text-1:#E8F1FF; --text-2:#A8C3E6; --text-3:#6C87A6;

  /* 等比缩放令牌（用 clamp + vw） */
  --fz-title: clamp(18px, 1.2vw, 28px);
  --fz-num:   clamp(32px, 3vw, 56px);
  --sp-1: clamp(6px, 0.5vw, 12px);
  --sp-2: clamp(8px, 0.8vw, 16px);
  --radius:  clamp(8px, 0.6vw, 14px);

  /* 兜底整体缩放（JS 写入） */
  --scale: 1;
}
html,body,#app{height:100%; background:var(--bg-0); color:var(--text-1);}
@media (max-width:1366px){ :root{ --fz-title: clamp(16px, 1.6vw, 22px); } }
@media (min-width:2560px){ :root{ --fz-title: clamp(20px, 1vw, 34px); --fz-num: clamp(40px, 2.2vw, 72px); } }

# 布局（DashboardLayout.vue）
- 使用 CSS Grid：
  - ≥1920: grid-template-columns: 1fr 1.2fr 1fr
  - 1600~1919: 1fr 1fr（两列），右列落到下一行（grid-column: span 2）
  - ≤1366: 单列
- 列内用 repeat(auto-fit, minmax(320px, 1fr)) 让卡片自动换行
- PanelCard 圆角/描边/阴影使用 tokens

# 图表 hook（hooks/useChart.ts）
- 封装 ECharts 初始化，使用 ResizeObserver + requestAnimationFrame 防抖 resize
- 暗色主题、legend 自适应，series 区域不遮挡

# 表格（DataTable.vue）
- 传入 rows/columns，计算高度：窗口高度 - 固定头部/卡片内边距
- 使用内部滚动，不让页面出现双滚动条

# 兜底整体缩放（可选）
- utils/viewport.ts: mountScaleVar(baseW=1920)，将 Math.min(winW/baseW, winH/1080) 写入 --scale
- 在极小分辨率下（≤1280px）对 #stage 应用 transform: scale(var(--scale))；其他分辨率默认不用 scale

# 示例组件（最小可用）
- KpiTile：label 用 --fz-title，数字用 --fz-num；warn/error 态描边/发光色不同
- VideoWall：四宫格，src/海报自适应，object-fit:cover
- SensorCard：左右布局，value 大号，unit 次要；warn 态高亮
- PieChart：radius ['35%','70%']，minAngle=1，legend 右侧
- PanelCard：header 带装饰线；body 使用 var(--sp-2) 内边距

# Dashboard.vue（示意数据）
- 左列：KpiTile 两张；证照公示（两图占位）；违规行为 PieChart；消毒记录 DataTable
- 中列：VideoWall（4 宫）；农残检测 DataTable
- 右列：SensorCard 6 张；菜品留样 DataTable；意见反馈两卡（占位）

# 可运行与脚本
- package.json：dev/build/preview 脚本
- 允许直接 npm create vite → 注入上述文件即可运行

# 验收标准
1) 1366/1600/1920/2560/4K 下：
   - 列数与卡片尺寸合理，排版无重叠/溢出
   - 标题/数字/间距等比缩放自然（clamp + vw 生效）
2) 调整窗口大小，图表随容器自适应，无白屏/遮挡
3) 表格高度自适应，内部滚动，无页面双滚动条
4) 极端小屏（≤1280）启用兜底 transform: scale 后整体仍可见

# 交付
- 完整 src 代码与 README（说明断点、令牌、如何扩展卡片/图表，以及何时启用兜底缩放）
