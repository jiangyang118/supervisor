生成组件 src/components/FeedbackCard.vue，显示人员反馈卡片。

props:
- name:string; phone:string; tag:string; avatar?:string; qrcode?:string

UI：
- 左侧头像（若无则使用内置占位 SVG）
- 中间：姓名（加粗）+ 电话
- 右侧：tag 胶囊按钮（如“食堂负责人”、“用餐反馈人”）
- 可在 footer 区显示“微信扫一扫” + qrcode 图片

验收：渲染两个卡片：张三(165****2222, 食堂负责人)、李四(187****6666, 用餐反馈人)
