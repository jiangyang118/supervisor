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
//数据结构类似于如下展示，并且根据监管端的模块进行生成
const menus = [
  { id:'home', label:'首页', children:[
    { id:'home_overview', label:'总览' },
    { id:'home_board', label:'数据看板' },
    { id:'home_warning', label:'预警概览' },
  ]},
  
];

# 输出要求
- 文件路径：src/components/RoleDialog.vue
- 使用 <el-dialog> 实现弹窗。
- 使用 <el-form> + <el-input> + <el-tree>。
- 提供 emits：['submit','cancel']，点击确定时 emit('submit', formData)。
- 包含基础样式，适配暗色模式。

