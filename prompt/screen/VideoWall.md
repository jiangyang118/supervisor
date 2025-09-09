生成组件 src/components/VideoWall.vue，展示 2×2 监控视频墙。

要求：
- props: items: Array<{ title:string; src?:string; poster?:string }>
- 每格显示标题覆盖层；若无 src，用 poster 占位；结构预留 <slot name="toolbar"> 放控制按钮
- 网格=2列×2行，间距 12px；格子圆角 var(--r-md)，内阴影 subtle

验收：传入4个 item（蒸饭区/洗消间/后厨/备菜区）均能显示；无 src 使用占位图。
