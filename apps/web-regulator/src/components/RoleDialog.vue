<template>
  <el-dialog v-model="visible" title="新增角色" width="560px" @closed="onClosed">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="88px">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="输入角色名称" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="120" show-word-limit placeholder="可选" />
      </el-form-item>
      <el-form-item label="菜单权限" required>
        <el-tree
          ref="treeRef"
          :data="menusData"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ children: 'children', label: 'label' }"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dlg-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type MenuNode = { id: string; label: string; children?: MenuNode[] };

const defaultMenus: MenuNode[] = [
  { id: 'home', label: '首页', children: [
    { id: 'home_overview', label: '总览' },
    { id: 'home_board', label: '数据看板' },
    { id: 'home_warning', label: '预警概览' },
  ]},
  { id: 'check', label: '智能检查管理', children: [
    { id: 'check_ai', label: 'AI 违规抓拍明细' },
    { id: 'check_stat', label: '行为统计与导出' },
  ]},
  { id: 'video', label: '明厨亮灶管理', children: [
    { id: 'video_live', label: '实时视频' },
    { id: 'video_replay', label: '视频回放' },
    { id: 'video_snapshot', label: '快照留存' },
    { id: 'video_nvr', label: '摄像头/NVR管理' },
  ]},
  { id: 'daily', label: '日常运营管理', children: [
    { id: 'daily_morning', label: '晨检管理' },
    { id: 'daily_sample', label: '留样管理' },
    { id: 'daily_residue', label: '农残快检管理' },
    { id: 'daily_disinfection', label: '消毒管理' },
    { id: 'daily_waste', label: '废弃物管理' },
    { id: 'daily_hygiene', label: '卫生管理' },
  ]},
  { id: 'store', label: '出入库管理', children: [
    { id: 'store_goods', label: '商品管理' },
    { id: 'store_in', label: '入库登记' },
    { id: 'store_out', label: '出库登记' },
    { id: 'store_stock', label: '库存与盘点' },
    { id: 'store_ticket', label: '索票索证管理' },
    { id: 'store_supplier', label: '供应商管理' },
    { id: 'store_warehouse', label: '仓库信息管理' },
  ]},
  { id: 'hr', label: '人事管理', children: [
    { id: 'hr_license', label: '人员健康证' },
    { id: 'hr_training', label: '培训课程' },
    { id: 'hr_exam', label: '考试管理' },
    { id: 'hr_staff', label: '人员管理' },
  ]},
  { id: 'env', label: '环境及设备管理', children: [
    { id: 'env_check', label: '隐患排查管理' },
    { id: 'env_asset', label: '固定资产维护记录' },
    { id: 'env_status', label: '环境状态' },
    { id: 'env_device', label: '智能终端设备管理' },
  ]},
  { id: 'public', label: '公示与反馈', children: [
    { id: 'public_feedback', label: '公众反馈处理' },
    { id: 'public_config', label: '公示内容配置' },
    { id: 'public_info', label: '食安资讯发布' },
    { id: 'public_notice', label: '公告公文管理' },
    { id: 'public_waste', label: '食品浪费分析' },
  ]},
  { id: 'sys', label: '系统配置', children: [
    { id: 'sys_canteen', label: '食堂信息维护+食堂资质' },
    { id: 'sys_role', label: '用户管理' },
    { id: 'sys_audit', label: '关联监管端审核' },
    { id: 'sys_mobile', label: '移动端扫码' },
  ]},
];

const props = defineProps<{
  modelValue: boolean;
  menus?: MenuNode[];
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'submit', v: { name: string; remark?: string; menuIds: string[] }): void;
  (e: 'cancel'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});
const menusData = computed<MenuNode[]>(() => props.menus && props.menus.length ? props.menus : defaultMenus);

const formRef = ref();
const treeRef = ref<any>();
const form = ref<{ name: string; remark?: string }>({ name: '', remark: '' });
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
  ],
} as const;

function collectCheckedIds(): string[] {
  const tree = treeRef.value as any;
  if (!tree) return [];
  const checked: string[] = tree.getCheckedKeys(true) || [];
  const half: string[] = tree.getHalfCheckedKeys ? (tree.getHalfCheckedKeys() || []) : [];
  return Array.from(new Set([...(checked as string[]), ...(half as string[])]));
}

function cancel() {
  emit('cancel');
  visible.value = false;
}

function submit() {
  (formRef.value as any)?.validate((ok: boolean) => {
    if (!ok) return;
    const menuIds = collectCheckedIds();
    emit('submit', { name: form.value.name.trim(), remark: form.value.remark?.trim(), menuIds });
    visible.value = false;
  });
}

function onClosed() {
  // reset simple state when dialog fully closed
  (formRef.value as any)?.clearValidate?.();
  form.value = { name: '', remark: '' };
  try { treeRef.value?.setCheckedKeys?.([]); } catch {}
}

watch(() => props.modelValue, (v) => {
  if (v) {
    // ensure tree expanded on open
    // default-expand-all handles this, nothing else required
  }
});
</script>

<style scoped>
.dlg-footer { display: inline-flex; gap: 8px; }

/* dark mode friendly tweaks */
:deep(.el-dialog__body) {
  background-color: var(--el-bg-color);
}
:deep(.el-tree) {
  max-height: 260px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}
</style>

