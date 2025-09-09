生成组件 src/components/SensorCard.vue，用于显示温度/气体等数值卡。

props：
- label:string; value:number|string; unit?:string; warn?:boolean

样式：
- 横向小卡，背景 var(--bg-1)，描边+发光
- value 大号、unit 次要；warn=true 时描边/文字转 --warn

验收：渲染 4 张卡：仓库温度20℃、后厨20℃、蒸箱间20℃、冷藏库20℃；再渲染气体值0.00mg/m³。
