创建 src/pages/Dashboard.vue，按三列布局组合全部组件。

布局：
- 左列：PanelCard("人员健康安全"){ 上方两张 <KpiTile>；下方“员工证照提醒”用简表/列表 }
        PanelCard("证照公示"){ 两张证照图片 }
        PanelCard("AI违规行为分析"){ <PieChart> }
        PanelCard("消毒记录"){ <DataTable> }
- 中列：PanelCard("明厨亮灶"){ <VideoWall> }
        PanelCard("农残检测管理"){ <DataTable> }
- 右列：PanelCard("物联监控管理"){ 4个 <SensorCard> + 2个气体值 }
        PanelCard("菜品留样管理"){ <DataTable> }
        PanelCard("意见与反馈公示"){ 两个 <FeedbackCard> + 右侧二维码 }

技术：
- 使用 utils/scale.ts 将整个 dashboard 包裹在缩放容器内
- 所有数据从 store/dashboard.ts 获取（mock）

验收：
- 1920×1080 下满屏显示；缩放容器在 1366×768 也不破版
- 切换 mock 数据能实时刷新
