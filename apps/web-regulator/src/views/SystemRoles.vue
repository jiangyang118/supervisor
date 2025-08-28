<template>
  <el-card class="roles-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>角色权限</span>
      </div></template
    >
    <el-row :gutter="12">
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
        <el-card class="box"
          ><template #header>权限</template>
          <div v-if="current">
            <el-tree
              ref="treeRef"
              :data="perms"
              node-key="key"
              show-checkbox
              default-expand-all
              :props="{ children: 'children', label: 'label' }"
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const roles = ref<any[]>([]);
const perms = ref<any[]>([]);
const current = ref<any | null>(null);
const treeRef = ref<any>(null);
async function load() {
  roles.value = await api.sysRoles();
  perms.value = await api.sysPermissions();
  current.value = null;
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
onMounted(load);
</script>

<style>
.roles-card {
  min-height: 420px;
}
.box {
  height: 320px;
  display: flex;
  flex-direction: column;
}
.box .el-card__body {
  overflow: auto;
  flex: 1 1 auto;
}
</style>
