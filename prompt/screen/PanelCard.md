生成组件 src/components/PanelCard.vue，作为大屏通用卡片容器。

功能：
- props: title:string, sub?:string
- UI：深色背景 var(--bg-1)，1px 渐变描边 + 外发光 var(--glow)，圆角 var(--r-lg)
- 标题区含左侧科技线条装饰（两段横线+短竖线）
- 默认 slot 放内容，支持 <template #extra> 操作位

验收：
- 卡片阴影/描边一致；标题与内容留白符合 --sp-2/--sp-3；适配暗色。
