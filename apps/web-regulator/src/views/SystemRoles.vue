<template>
  <el-card class="roles-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>监管端角色权限</span>
        <div>
          <el-button type="primary" size="small" @click="showAdd=true">新增角色</el-button>
        </div>
      </div></template
    >
    <el-row :gutter="12" class="roles-row">
      <el-col :span="8">
        <el-card class="box"
          ><template #header>角色</template>
          <el-table :data="roles" size="small" border height="260" @row-click="selectRole">
            <el-table-column prop="name" label="角色" />
            <el-table-column label="权限数" width="120"
              ><template #default="{ row }">{{
                (row.permissions || []).length
              }}</template></el-table-column
            >
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="box">
          <template #header>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span>权限</span>
              <el-input v-model="permFilter" placeholder="搜索权限关键字" clearable style="width:220px" @input="filterTree" />
              <el-button size="small" @click="expandAll(true)">展开</el-button>
              <el-button size="small" @click="expandAll(false)">折叠</el-button>
              <el-button size="small" @click="checkAll(true)">全选</el-button>
              <el-button size="small" @click="checkAll(false)">清空</el-button>
              <el-button size="small" @click="exportTpl">导出模板</el-button>
              <el-upload :show-file-list="false" accept="application/json" :before-upload="importTpl">
                <el-button size="small">导入模板</el-button>
              </el-upload>
            </div>
          </template>
          <div v-if="current">
            <el-tree
              ref="treeRef"
              :data="perms"
              node-key="key"
              show-checkbox
              default-expand-all
              :props="{ children: 'children', label: 'label' }"
              :filter-node-method="filterNode"
            />
            <div style="margin-top: 8px">
              <el-button type="primary" @click="save">保存</el-button>
            </div>
          </div>
          <div v-else>请选择左侧角色</div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
  <RoleDialog v-model="showAdd" :menus="permsAsMenus" @submit="onCreateRole" @cancel="() => (showAdd=false)" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api';
import RoleDialog from '../components/RoleDialog.vue';
const roles = ref<any[]>([]);
const perms = ref<any[]>([]);
const current = ref<any | null>(null);
const treeRef = ref<any>(null);
const permFilter = ref('');
const route = useRoute();
const showAdd = ref(false);
async function load() {
  roles.value = await api.sysRoles();
  perms.value = await api.sysPermissions();
  current.value = null;
  // preselect role from query if provided
  const target = String(route.query.role || '').trim();
  if (target) {
    const found = (roles.value || []).find((r: any) => r.name === target);
    if (found) setTimeout(() => selectRole(found), 0);
  }
}
function collectChecked() {
  const tree = treeRef.value as any;
  if (!tree) return [] as string[];
  const getKeys = (nodes: any[]): string[] =>
    nodes.flatMap((n: any) =>
      n.children && n.children.length ? getKeys(n.children) : n.key ? [n.key] : [],
    );
  const checked = tree.getCheckedNodes(true) as any[];
  const half = tree.getHalfCheckedNodes() as any[];
  const leafChecked = getKeys(checked);
  const leafHalf = getKeys(half);
  return Array.from(new Set([...leafChecked, ...leafHalf]).values());
}
function selectRole(row: any) {
  current.value = row; // set checked based on role permissions
  const keys = new Set((row.permissions || []) as string[]);
  const setChecked = (nodes: any[]) =>
    nodes.forEach((n: any) => {
      if (n.children && n.children.length) {
        setChecked(n.children);
      } else if (n.key) {
        treeRef.value.setChecked(n.key, keys.has(n.key), false);
      }
    });
  setTimeout(() => setChecked(perms.value), 0);
}
async function save() {
  if (!current.value) return;
  const newPerms = collectChecked();
  await api.sysSetRolePerms(current.value.name, newPerms);
  await load();
}
function filterNode(val: string, data: any) {
  if (!val) return true;
  const t = val.toLowerCase();
  const label = String(data.label || '').toLowerCase();
  const key = String(data.key || '').toLowerCase();
  return label.includes(t) || key.includes(t);
}
function filterTree() {
  treeRef.value?.filter(permFilter.value);
}
function expandAll(expand: boolean) {
  const tree = treeRef.value as any;
  if (!tree) return;
  const toggle = (nodes: any[]) => nodes.forEach((n: any) => { tree.store.nodesMap[n.key || n.label] && (tree.store.nodesMap[n.key || n.label].expanded = expand); if (n.children) toggle(n.children); });
  toggle(perms.value);
}
function setAllChecked(nodes: any[], checked: boolean) {
  nodes.forEach((n: any) => {
    if (n.children && n.children.length) setAllChecked(n.children, checked);
    else if (n.key) treeRef.value.setChecked(n.key, checked, false);
  });
}
function checkAll(checked: boolean) {
  setAllChecked(perms.value, checked);
}
function exportTpl() {
  if (!current.value) return;
  const keys = collectChecked();
  const blob = new Blob([JSON.stringify({ role: current.value.name, permissions: keys }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `role_${current.value.name}_perms.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
async function importTpl(file: File) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const keys = new Set<string>((json?.permissions || []) as string[]);
    // apply checked
    const apply = (nodes: any[]) => nodes.forEach((n: any) => {
      if (n.children && n.children.length) apply(n.children);
      else if (n.key) treeRef.value.setChecked(n.key, keys.has(n.key), false);
    });
    apply(perms.value);
    return false; // prevent auto upload
  } catch (e) {
    console.error(e);
    return false;
  }
}
onMounted(load);

// Convert backend permission tree to RoleDialog menu shape (id/label/children)
import { computed } from 'vue';
const permsAsMenus = computed<any[]>(() => (perms.value || []).map((p: any) => ({ id: p.label, label: p.label, children: (p.children || []).map((c: any) => ({ id: c.key, label: c.label })) })) );

async function onCreateRole(payload: { name: string; remark?: string; menuIds: string[] }) {
  // 1) create role
  const r = await api.sysRoleCreate({ name: payload.name, remark: payload.remark });
  // 2) set permissions based on selected menu ids (leaf ids mapped to permission keys)
  const keys = (payload.menuIds || []).filter((id) => id.includes(':') || id.includes('.'));
  if (keys.length) await api.sysSetRolePerms(payload.name, keys);
  // 3) reload and select the new role
  await load();
  const found = (roles.value || []).find((x: any) => x.name === payload.name);
  if (found) selectRole(found);
}
</script>

<style>
.roles-card {
  /* Fill viewport height minus header/nav margin */
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
.roles-card > .el-card__body {
  flex: 1 1 auto;
  display: flex;
  padding-bottom: 8px;
}
.roles-row {
  flex: 1 1 auto;
  display: flex;
}
.roles-row > .el-col {
  height: 100%;
}
.box {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.box .el-card__body {
  overflow: auto;
  flex: 1 1 auto;
}
</style>
