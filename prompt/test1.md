你是资深前端工程师，请用 Vue3 + TypeScript + Vite + ECharts + Element Plus 生成一个“智慧食安驾驶舱”大屏页面，要求如下：

# 整体布局
- 基准分辨率 1920×1080，自适应缩放。
- 三列布局：
  - 左列：人员健康安全（KPI 卡+员工列表）、证照公示、AI 违规行为饼图、消毒记录表格
  - 中列：明厨亮灶视频墙（4 视频位）、农残检测表格
  - 右列：物联监控（温度/气体传感器卡）、菜品留样表格、意见反馈卡片（含二维码）
- 顶部横幅：左侧天气信息，中间系统标题《智慧食安驾驶舱》，右侧日期时间实时刷新。

# 视觉风格
- 深色背景（#061423），蓝色描边发光（#11C5FF），卡片带阴影。
- 数字指标突出，字体 DIN Bold。
- 图表使用 ECharts，配色：蓝、青、紫、黄。
- 所有模块用 PanelCard 容器统一风格。

# 组件设计
1. PanelCard：带标题、边框、发光。
2. KpiTile：显示指标名称+数值+单位。
3. VideoWall：2×2 视频组件，支持 poster 占位图。
4. SensorCard：显示温度/浓度数值，异常高亮。
5. DataTable：深色表格（Element Plus Table 定制主题）。
6. PieChart：违规行为占比饼图。
7. FeedbackCard：头像+姓名+电话+反馈类型+二维码。

# 数据示例（Mock）
- KPI：晨检总人数=52，异常人数=8。
- 证照：营业执照、食品经营许可证（图片地址）。
- 违规行为饼图：未戴口罩50%，未穿工服40%，其余若干0%。
- 消毒记录表：环境消毒/餐具消毒等。
- 农残检测：小羊肉、黄花鱼、小青菜、大米，结果均合格。
- 菜品留样：炒羊肉、清蒸鱼、炒胡萝卜等，状态=已留样/待留样。
- 意见反馈：张三(食堂负责人, 165****2222)、李四(用餐反馈人, 187****6666)，二维码占位。

# 技术要求
- 使用 Vue3 + TS + Vite。
- 状态管理 Pinia。
- 图表用 ECharts。
- 支持组件化复用。
- 顶部时间每秒刷新。
- Mock 数据通过 Pinia store 提供，未来可替换 API。

# 输出
- 完整可运行的 Vue3 项目代码。
- src/ 下目录结构：
  - components/{PanelCard,KpiTile,VideoWall,SensorCard,DataTable,PieChart,FeedbackCard}
  - pages/Dashboard.vue （整合布局）
  - store/dashboard.ts （提供 mock 数据）
  - utils/format.ts （时间格式化）
- 代码中包含示例数据与占位图片。
