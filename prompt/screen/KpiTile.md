生成组件 src/components/KpiTile.vue，用于显示“晨检人数/异常人数”等数字卡。

要求：
- props: label:string; value:number|string; unit?:string; status?:'default'|'warn'|'error'
- 顶部细条：渐变背景；主体：数字使用 DIN/等宽字体，56px；虚线边框+四边中点小圆装饰
- 根据 status 变换描边/发光颜色（warn=--warn, error=--error）

验收：
- 能渲染：{label:'晨检总人数',value:52}、{label:'异常人数',value:8,status:'warn'}
