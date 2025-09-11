<template>
  <el-dialog :model-value="visible" title="新增角色" width="520px" @close="$emit('cancel')">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
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
import { ref, nextTick } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps<{ visible: boolean; role?: { id?: number; name: string; remark?: string } }>();
const emit = defineEmits<{
  (e: 'submit', v: { name: string; remark?: string; menuIds: string[] }): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const treeRef = ref<any>();
const form = ref({ name: '', remark: '' });
const rules: FormRules = { name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] };

// Menu structure from prompt/user.md
const menus = [
  { id:'home', label:'首页', },
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
    { id:'store_ticket', label:'索票索证管理' },
    { id:'store_supplier', label:'供应商资质' },
    { id:'store_warehouse', label:'仓库信息管理' },
  ]},
  { id:'hr', label:'资质证件管理', children:[
    { id:'hr_license', label:'人员健康证' },
    { id:'hr_training', label:'培训课程' },
    { id:'hr_exam', label:'考试管理' },
    { id:'hr_staff', label:'人员资质' },
  ]},
  
  { id:'sys', label:'系统配置', children:[
    { id:'sys_canteen', label:'食堂信息维护' },
    { id:'sys_role', label:'用户管理' },
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
    });
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
  },
);

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
