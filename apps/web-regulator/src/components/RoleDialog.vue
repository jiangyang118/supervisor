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
