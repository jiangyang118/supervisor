<template>
  <el-card>
    <template #header>食堂信息维护</template>
    <div style="margin-bottom:8px;display:flex;gap:12px;align-items:center">
      <div>
        <span style="margin-right:6px;color:#666">状态筛选</span>
        <el-select v-model="statusFilter" style="width: 160px">
          <el-option label="全部" value="all" />
          <el-option label="仅启用" value="enabled" />
          <el-option label="仅停用" value="disabled" />
        </el-select>
      </div>
      <el-button type="primary" @click="openCreate">新增食堂</el-button>
    </div>

    <el-table :data="rows"  border>
      <el-table-column prop="name" label="食堂名称" min-width="160" />
      <el-table-column prop="code" label="食堂编号" width="140" />
      <el-table-column prop="manager" label="负责人" width="140" />
      <el-table-column prop="phone" label="联系电话" width="160" />
      <el-table-column label="状态" width="160">
        <template #default="{ row }">
          <el-switch :model-value="!!row.enabled"  @change="(v:boolean)=>toggleEnabled(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }"><el-button  @click="openEdit(row)">编辑</el-button></template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="visible" :title="editing? '编辑食堂':'新增食堂'" width="560px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="食堂名称" required><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="食堂编号"><el-input v-model="form.code" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="负责人"><el-input v-model="form.manager" /></el-form-item>
      <el-form-item label="状态"><el-switch v-model="form.enabled" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';
const rows = ref<any[]>([]);
const statusFilter = ref<'enabled'|'disabled'|'all'>('all');
async function load() {
  const sid = getCurrentSchoolId() as any;
  if (statusFilter.value === 'enabled') rows.value = await api.canteensByStatus(sid, 'true');
  else if (statusFilter.value === 'disabled') rows.value = await api.canteensByStatus(sid, 'false');
  else rows.value = await api.canteensByStatus(sid, 'all');
}
onMounted(load);
watch(statusFilter, load);

const visible = ref(false);
const editing = ref(false);
const form = reactive<any>({ id: undefined as number|undefined, name: '', code: '', address: '', phone: '', manager: '', enabled: true });
function openCreate() {
  editing.value = false;
  Object.assign(form, { id: undefined, name: '', code: '', address: '', phone: '', manager: '', enabled: true });
  visible.value = true;
}
function openEdit(row: any) {
  editing.value = true;
  Object.assign(form, { id: row.id, name: row.name, code: row.code || '', address: row.address || '', phone: row.phone || '', manager: row.manager || '', enabled: !!row.enabled });
  visible.value = true;
}
async function save() {
  if (!form.name) { ElMessage.warning('请填写食堂名称'); return; }
  if (editing.value && form.id) {
    await api.canteenUpdateSimple(Number(form.id), { name: form.name, code: form.code || undefined, address: form.address || undefined, phone: form.phone || undefined, manager: form.manager || undefined, enabled: form.enabled });
  } else {
    await api.canteenCreateSimple({ schoolId: getCurrentSchoolId() as any, name: form.name, code: form.code || undefined, address: form.address || undefined, phone: form.phone || undefined, manager: form.manager || undefined, enabled: form.enabled });
  }
  visible.value = false;
  await load();
}
async function toggleEnabled(row: any, val: boolean) {
  const old = !!row.enabled;
  row.enabled = val ? 1 : 0;
  try {
    await api.canteenUpdateSimple(Number(row.id), { enabled: val });
    ElMessage.success(val ? '已启用' : '已停用');
    if ((statusFilter.value === 'enabled' && !val) || (statusFilter.value === 'disabled' && val)) await load();
  } catch (e) {
    row.enabled = old ? 1 : 0;
    ElMessage.error('更新状态失败');
  }
}
</script>

<style scoped></style>
