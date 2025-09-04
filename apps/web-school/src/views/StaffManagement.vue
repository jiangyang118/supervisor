<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>人员管理</span>
        <div>
          <el-upload :show-file-list="false" :auto-upload="true" :http-request="onImport" accept=".csv,text/csv">
            <el-button>导入CSV</el-button>
          </el-upload>
          <el-button @click="onExport">导出CSV</el-button>
          <el-button type="primary" @click="openCreate">新增人员</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom:8px">
      <el-form-item label="关键词"><el-input v-model="filters.q" placeholder="姓名/电话/岗位/健康证" @keyup.enter.native="load" /></el-form-item>
      <el-form-item><el-button @click="load">查询</el-button></el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column prop="jobTitle" label="岗位" width="160" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="healthCertNo" label="健康证编号" width="160" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">{{ row.enabled ? '在岗' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="时间" width="180"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" text type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="editVisible" :title="editForm.id ? '编辑人员' : '新增人员'" width="520px">
    <el-form :model="editForm" label-width="96px">
      <el-form-item label="姓名" required><el-input v-model="editForm.name" /></el-form-item>
      <el-form-item label="岗位"><el-input v-model="editForm.jobTitle" /></el-form-item>
      <el-form-item label="电话"><el-input v-model="editForm.phone" /></el-form-item>
      <el-form-item label="健康证编号"><el-input v-model="editForm.healthCertNo" /></el-form-item>
      <el-form-item label="在岗"><el-switch v-model="editForm.enabled" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editVisible=false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolIdNum } from '../utils/school';

const rows = ref<any[]>([]);
const filters = reactive({ q: '' });
const editVisible = ref(false);
const editForm = reactive<any>({ id: 0, name: '', jobTitle: '', phone: '', healthCertNo: '', enabled: true });

async function load() {
  try {
    const res = await api.staffList({ schoolId: getCurrentSchoolIdNum(), q: filters.q, page: 1, pageSize: 200 });
    rows.value = res.items || [];
  } catch { ElMessage.error('加载失败'); }
}
const fmt = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

function openCreate() {
  Object.assign(editForm, { id: 0, name: '', jobTitle: '', phone: '', healthCertNo: '', enabled: true });
  editVisible.value = true;
}
function openEdit(row: any) {
  Object.assign(editForm, row);
  editVisible.value = true;
}
async function save() {
  try {
    if (!editForm.name) { ElMessage.warning('请填写姓名'); return; }
    if (editForm.id) await api.staffUpdate(editForm.id, { name: editForm.name, jobTitle: editForm.jobTitle, phone: editForm.phone, healthCertNo: editForm.healthCertNo, enabled: !!editForm.enabled });
    else await api.staffCreate({ schoolId: getCurrentSchoolIdNum(), name: editForm.name, jobTitle: editForm.jobTitle, phone: editForm.phone, healthCertNo: editForm.healthCertNo, enabled: !!editForm.enabled });
    ElMessage.success('已保存'); editVisible.value = false; load();
  } catch { ElMessage.error('保存失败'); }
}
async function remove(row: any) {
  try { await api.staffDelete(row.id); ElMessage.success('已删除'); load(); } catch { ElMessage.error('删除失败'); }
}
async function onImport(opts: any) {
  try {
    const file: File = opts.file;
    const text = await file.text();
    // Simple CSV parse: header line: name,jobTitle,phone,healthCertNo,enabled
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const header = lines.shift()!.split(',').map((h) => h.trim());
    const items = lines.map((ln) => {
      const cols = ln.split(',');
      const obj: any = {};
      header.forEach((h, i) => (obj[h] = (cols[i] || '').trim()));
      obj.enabled = String(obj.enabled).toLowerCase() !== 'false';
      return { name: obj.name, jobTitle: obj.jobTitle, phone: obj.phone, healthCertNo: obj.healthCertNo, enabled: obj.enabled };
    }).filter((x) => x.name);
    await api.staffImport({ schoolId: getCurrentSchoolIdNum(), items });
    ElMessage.success('导入成功'); load();
  } catch { ElMessage.error('导入失败'); }
}
function onExport() {
  exportCsv('人员清单', rows.value, { id: 'ID', name: '姓名', jobTitle: '岗位', phone: '电话', healthCertNo: '健康证编号', enabled: '在岗', createdAt: '时间' });
}
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  onBeforeUnmount(() => window.removeEventListener('school-changed', h as any));
});
</script>

<style scoped>
</style>
