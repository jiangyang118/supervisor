请基于 Vue3 + TypeScript + Element Plus 生成一个“新增角色”弹窗组件，功能如下：

# 功能描述
1. 弹窗标题：新增角色
2. 表单字段：
   - 角色名称（必填，输入框）
   - 备注（可选，textarea）
   - 菜单权限（必选，树形勾选）
3. 菜单权限树：
   - 使用 <el-tree> 渲染，带复选框，支持父子联动勾选。
   - 数据结构：[{ id:string, label:string, children?:[] }]
   - 默认展开全部节点。
   - 支持获取已勾选节点（返回 id 数组）。
4. 底部按钮：取消 / 确定
   - 取消：关闭弹窗
   - 确定：校验角色名称非空，返回 { name, remark, menuIds }

# 菜单结构数据
const menus = [
  { id:'home', label:'首页', children:[
    { id:'home_overview', label:'总览' },
    { id:'home_board', label:'数据看板' },
    { id:'home_warning', label:'预警概览' },
  ]},
  { id:'check', label:'智能检查管理', children:[
    { id:'check_ai', label:'AI 违规抓拍明细' },
    { id:'check_stat', label:'行为统计与导出' },
  ]},
  { id:'video', label:'互联网+明厨亮灶', children:[
    { id:'video_live', label:'实时视频' },
    { id:'video_replay', label:'视频回放' },
    { id:'video_snapshot', label:'快照留存' },
    { id:'video_nvr', label:'摄像头/NVR管理' },
  ]},
  { id:'daily', label:'日常运营管理', children:[
    { id:'daily_morning', label:'晨检管理' },
    { id:'daily_sample', label:'留样管理' },
    { id:'daily_residue', label:'农残快检管理' },
    { id:'daily_disinfection', label:'消毒管理' },
    { id:'daily_waste', label:'废弃物管理' },
    { id:'daily_hygiene', label:'卫生管理' },
  ]},
  { id:'store', label:'出入库管理', children:[
    { id:'store_goods', label:'商品管理' },
    { id:'store_in', label:'入库登记' },
    { id:'store_out', label:'出库登记' },
    { id:'store_stock', label:'库存与盘点' },
    { id:'store_ticket', label:'索票索证管理' },
    { id:'store_supplier', label:'供应商管理' },
    { id:'store_warehouse', label:'仓库信息管理' },
  ]},
  { id:'hr', label:'人事管理', children:[
    { id:'hr_license', label:'人员健康证' },
    { id:'hr_training', label:'培训课程' },
    { id:'hr_exam', label:'考试管理' },
    { id:'hr_staff', label:'人员管理' },
  ]},
  { id:'env', label:'环境及设备管理', children:[
    { id:'env_check', label:'隐患排查管理' },
    { id:'env_asset', label:'固定资产维护记录' },
    { id:'env_status', label:'环境状态' },
    { id:'env_device', label:'智能终端设备管理' },
  ]},
  { id:'public', label:'公示与反馈', children:[
    { id:'public_feedback', label:'公众反馈处理' },
    { id:'public_config', label:'公示内容配置' },
    { id:'public_info', label:'食安资讯发布' },
    { id:'public_notice', label:'公告公文管理' },
    { id:'public_waste', label:'食品浪费分析' },
  ]},
  { id:'sys', label:'系统配置', children:[
    { id:'sys_canteen', label:'食堂信息维护+食堂资质' },
    { id:'sys_role', label:'用户管理' },
    { id:'sys_audit', label:'关联监管端审核' },
    { id:'sys_mobile', label:'移动端扫码' },
  ]},
];

# 输出要求
- 文件路径：src/components/RoleDialog.vue
- 使用 <el-dialog> 实现弹窗。
- 使用 <el-form> + <el-input> + <el-tree>。
- 提供 emits：['submit','cancel']，点击确定时 emit('submit', formData)。
- 包含基础样式，适配暗色模式。

