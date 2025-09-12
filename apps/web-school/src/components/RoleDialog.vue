<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="520px" @close="$emit('cancel')">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" >
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入角色名称" maxlength="32" show-word-limit />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
      <el-form-item label="菜单权限" required>
        <el-tree
          ref="treeRef"
          class="menu-tree"
          :data="menus"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'label', children: 'children' }"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="onOk">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { api } from '../services/api';
import { mapPermsToMenuIds } from '../utils/menuPerms';
import { getCurrentSchoolId } from '../utils/school';

const props = defineProps<{ visible: boolean; role?: { id?: number; name: string; remark?: string } }>();
const emit = defineEmits<{
  (e: 'submit', v: { name: string; remark?: string; menuIds: string[] }): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const treeRef = ref<any>();
const form = ref({ name: '', remark: '' });
async function validateUniqueName(_: any, value: string) {
  const name = (value || '').trim();
  if (!name) return true;
  try {
    const sid = getCurrentSchoolId();
    const schoolId = sid ? Number(sid) : undefined;
    const list = await api.sysRoles({ schoolId, q: name });
    const exists = (list || []).some((r: any) => String(r.name).trim() === name && (!props.role?.id || Number(r.id) !== Number(props.role.id)));
    if (exists) return Promise.reject('角色名称已存在');
  } catch {}
  return true;
}
const rules: FormRules = { name: [
  { required: true, message: '请输入角色名称', trigger: 'blur' },
  { validator: validateUniqueName, trigger: 'blur' },
] };
const dialogTitle = computed(() => (props.role?.id ? '编辑角色' : '新增角色'));

// Menu tree aligned with sidebar
const menus = [
  { id:'home', label:'首页' },
  { id:'home_warning', label:'预警概览' },
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
    { id:'daily_device_safety', label:'设备安全管理' },
  ]},
  { id:'store', label:'出入库管理', children:[
    { id:'store_goods', label:'商品管理' },
    { id:'store_in', label:'入库登记' },
    { id:'store_out', label:'出库登记' },
    { id:'store_stock', label:'库存记录' },
    
  ]},
  { id:'hr', label:'资质证件管理', children:[
    { id:'hr_staff', label:'人员资质' },
    { id:'hr_license', label:'人员健康证' },
    { id:'hr_training', label:'培训课程' },
    { id:'hr_exam', label:'考试管理' },
  ]},
  { id:'sys', label:'系统配置', children:[
    { id:'sys_canteen', label:'食堂信息维护' },
    { id:'sys_users', label:'用户管理' },
    { id:'sys_roles', label:'角色管理' },
    { id:'sys_audit', label:'关联监管端审核' },
    { id:'sys_mobile', label:'移动端扫码' },
    { id:'sys_device', label:'智能终端设备管理' },
  ]},
];

// initialize when role changes
import { watch } from 'vue';
watch(
  () => props.role,
  (r) => {
    form.value.name = r?.name || '';
    form.value.remark = r?.remark || '';
    // Clear menu selections when switching context, especially for create
    nextTick(() => {
      try { treeRef.value?.setCheckedKeys?.([]); } catch {}
      if (r?.name) preloadRoleMenus(r.name);
    });
    // no-op: static menu tree
  },
  { immediate: true },
);
// Also clear when dialog opens in create mode
watch(
  () => props.visible,
  (vis) => {
    if (vis && !props.role) {
      form.value.name = '';
      form.value.remark = '';
      nextTick(() => {
        try { treeRef.value?.setCheckedKeys?.([]); } catch {}
      });
    }
    // no-op
  },
);

async function preloadRoleMenus(roleName: string) {
  try {
    const res = await api.sysRolePermissions(roleName);
    const ids = mapPermsToMenuIds(res?.permissions || []);
    nextTick(() => {
      try { treeRef.value?.setCheckedKeys?.(ids); } catch {}
    });
  } catch { /* ignore */ }
}

async function onOk() {
  const ok = await formRef.value?.validate().catch(() => false);
  if (!ok) return;
  const ids: string[] = treeRef.value?.getCheckedKeys?.() || [];
  emit('submit', { name: form.value.name.trim(), remark: form.value.remark?.trim() || '', menuIds: ids });
}
</script>

<style scoped>
.menu-tree { width: 100%; max-height: 240px; overflow: auto; }
@media (prefers-color-scheme: dark) {
  .menu-tree :deep(.el-tree-node__content):hover { background: rgba(255,255,255,0.06); }
}
</style>
