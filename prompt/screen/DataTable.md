基于 Element Plus 生成 src/components/DataTable.vue 深色表格封装。

要求：
- props: columns:Array<{prop:string,label:string,width?:number}>, rows:any[], height?:string
- 表头半透明、行 hover 高亮、首列序号胶囊（可选 props showIndex）
- 支持 slots: {cell-<prop>} 自定义单元格
- 提供两个示例：农残检测（物料/日期/结果合格）、消毒记录（内容/时间/责任人）

验收：表格在 PanelCard 内正常展示，宽度自适应。
