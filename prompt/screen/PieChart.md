创建组件 src/components/PieChart.vue，封装 ECharts 饼图（暗色主题）。

props：
- data: Array<{ name:string; value:number }>
- colors 读取 tokens（--primary, --accent, --success, --warn, --error）
- legend 在右侧，label 内显示百分比，最小角度过滤为 1°

验收：渲染数据：
[{name:'未戴口罩',value:50},{name:'未穿工服',value:40.44},{name:'油烟',value:0}]
