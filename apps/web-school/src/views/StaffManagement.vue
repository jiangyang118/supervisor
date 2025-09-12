<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>人员资质</span>
        <div style="display:flex;gap:8px;align-items:center">
          <el-input v-model="filters.name" placeholder="人员姓名" style="width:180px" @keyup.enter.native="load" />
          <el-input v-model="filters.phone" placeholder="手机号" style="width:180px" @keyup.enter.native="load" />
          <el-button @click="load">查询</el-button>
          <el-button type="primary" @click="openDialog()">新增人员</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" border stripe class="staff-table">
      <el-table-column prop="name" label="人员姓名" width="140" />
      <el-table-column prop="canteenName" label="所属食堂" min-width="160" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="healthCertNo" label="健康证编号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="healthCertAuthority" label="发证机构" min-width="180" show-overflow-tooltip />
      <el-table-column label="有效期至" width="160">
        <template #default="{ row }">{{ dateOnly(row.healthCertExpireAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status==='过期' ? 'danger' : (row.status==='临期' ? 'warning' : 'success')" effect="light" round size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <ActionCell :actions="[
            { label: '查看', onClick: () => view(row), type: 'info' },
            { label: '编辑', onClick: () => edit(row), type: 'primary' },
            { label: '删除', onClick: () => onDelete(row), danger: true, confirm: '确认删除该人员？' },
          ]" :inline="2" />
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="visible" :title="form.id ? '编辑人员' : '新增人员'" width="720px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-divider content-position="left">基本信息</el-divider>
      <el-form-item label="姓名" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="性别"><el-select v-model="form.gender" placeholder="请选择" style="width:120px"><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-form-item>
      <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="所属食堂" prop="canteenId">
        <el-select v-model="form.canteenId" filterable placeholder="请选择" style="width: 240px">
          <el-option v-for="c in canteens" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="岗位"><el-input v-model="form.jobTitle" /></el-form-item>

      <el-divider content-position="left">健康证信息</el-divider>
      <el-form-item label="健康证编号"><el-input v-model="form.healthCertNo" /></el-form-item>
      <el-form-item label="发证机构"><el-input v-model="form.healthCertAuthority" /></el-form-item>
      <el-form-item label="发证日期"><el-date-picker v-model="form.healthCertIssueAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="有效期至" prop="healthCertExpireAt"><el-date-picker v-model="form.healthCertExpireAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="证件上传" required>
        <div style="display:flex;gap:12px;align-items:center">
          <div>
            <div>正面</div>
            <el-upload :show-file-list="false" :http-request="(req:any)=>onUpload(req,'front')">
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <div>
            <div>反面</div>
            <el-upload :show-file-list="false" :http-request="(req:any)=>onUpload(req,'back')">
              <el-button>上传</el-button>
            </el-upload>
          </div>
          <el-image v-if="form.healthCertFrontUrl" :src="form.healthCertFrontUrl" style="width:120px;height:80px" fit="contain" />
          <el-image v-if="form.healthCertBackUrl" :src="form.healthCertBackUrl" style="width:120px;height:80px" fit="contain" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
  </el-card>

  
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../services/api';
import { useRouter } from 'vue-router';
import { getCurrentSchoolId } from '../utils/school';
import { dateOnly } from '../utils/datetime';
import ActionCell from '../components/ActionCell.vue';

const filters = reactive({ name: '', phone: '' });
const rows = ref<any[]>([]);
const router = useRouter();
const canteens = ref<Array<{ id: number; name: string }>>([]);
const visible = ref(false);
const saving = ref(false);
const formRef = ref();
const form = reactive<any>({ id: 0, name: '', gender: '', phone: '', canteenId: undefined, jobTitle: '', healthCertNo: '', healthCertAuthority: '', healthCertIssueAt: '', healthCertExpireAt: '', healthCertFrontUrl: '', healthCertBackUrl: '' });
const rules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  canteenId: [{ required: true, message: '请选择所属食堂', trigger: 'change' }],
  healthCertExpireAt: [{ required: true, message: '请选择有效期至', trigger: 'change' }],
} as const;

async function load() {
  try {
    const sid = getCurrentSchoolId();
    const res = await api.personnelList({ schoolId: sid, name: filters.name || undefined, phone: filters.phone || undefined, page: 1, pageSize: 200 });
    rows.value = (res as any)?.items || [];
  } catch { ElMessage.error('加载失败'); }
}
async function loadCanteens() {
  try { const sid = getCurrentSchoolId(); canteens.value = await api.canteensList(sid); } catch { canteens.value = []; }
}
function openDialog(row?: any) {
  visible.value = true;
  if (row) Object.assign(form, { ...row }); else Object.assign(form, { id: 0, name: '', gender: '', phone: '', canteenId: undefined, jobTitle: '', healthCertNo: '', healthCertAuthority: '', healthCertIssueAt: '', healthCertExpireAt: '', healthCertFrontUrl: '', healthCertBackUrl: '' });
}
function view(row: any) { router.push({ path: '/hr/staff/view', query: { id: String(row.id) } }); }
function edit(row: any) { openDialog(row); }
async function onUpload(req: any, kind: 'front' | 'back') {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const content = reader.result as string;
      const r = await api.uploadFile(file.name, content);
      const url = r.url;
      if (kind === 'front') form.healthCertFrontUrl = url; else form.healthCertBackUrl = url;
      req.onSuccess && req.onSuccess(r);
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.readAsDataURL(file);
}
async function save() {
  const ok = await (formRef.value?.validate?.().catch(() => false) ?? true);
  if (!ok) { ElMessage.error('请完善必填信息'); return; }
  if (!form.healthCertFrontUrl || !form.healthCertBackUrl) { ElMessage.error('请上传健康证正反面'); return; }
  saving.value = true;
  try {
    const sid = getCurrentSchoolId();
    if (form.id) await api.personnelUpdate(form.id, { ...form });
    else await api.personnelCreate({ ...form, schoolId: sid });
    ElMessage.success('已保存'); visible.value = false; load();
  } catch { ElMessage.error('保存失败'); } finally { saving.value = false; }
}
async function onDelete(row: any) {
  try { await api.personnelDelete(row.id); ElMessage.success('已删除'); load(); } catch { ElMessage.error('删除失败'); }
}

onMounted(() => { loadCanteens(); load(); });
</script>

<style scoped>
.staff-table :deep(.el-table__cell) { padding: 8px 12px; }
</style>
