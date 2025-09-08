在 src/store/dashboard.ts 用 Pinia 提供 mock 数据与获取方法。

内容：
- kpis:[{label:'晨检总人数',value:52},{label:'异常人数',value:8}]
- sensors:[{label:'仓库温度',value:20,unit:'℃'}, ...]
- residues: 农残检测表 rows
- samples: 菜品留样表 rows
- disinfections: 消毒记录表 rows
- violations: 饼图数据
- feedbacks: 人员反馈数组

导出 composable：useDashboardStore()，含 refresh() 方法（模拟定时更新）

验收：Dashboard.vue 能从该 store 读取并渲染。
