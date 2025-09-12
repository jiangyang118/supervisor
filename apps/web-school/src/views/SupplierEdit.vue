<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>{{ isEdit ? '编辑供应商' : '新增供应商' }}</span>
        <div>
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </div>
    </template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="140px" style="max-width:900px">
      <el-divider content-position="left">供应商基本信息</el-divider>
      <el-form-item label="公司名称" prop="name" required><el-input v-model="form.name" maxlength="64" show-word-limit /></el-form-item>
      <el-form-item label="地址" prop="address" required><el-input v-model="form.address" /></el-form-item>
      <el-form-item label="联系人" prop="contact" required><el-input v-model="form.contact" /></el-form-item>
      <el-form-item label="联系电话" prop="phone" required><el-input v-model="form.phone" placeholder="例：13800000000 或 +86-13800000000" /></el-form-item>

      <el-divider content-position="left">营业执照</el-divider>
      <el-form-item label="编号" required><el-input v-model="biz.number" /></el-form-item>
      <el-form-item label="发照机关" required><el-input v-model="biz.authority" /></el-form-item>
      <el-form-item label="有效期" required><el-date-picker v-model="biz.expireAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="证件上传" required>
        <div style="display:flex;gap:12px;align-items:center">
          <el-upload :show-file-list="false" :http-request="(r:any)=>onUpload(r,'biz')"><el-button>上传</el-button></el-upload>
          <el-input v-model="biz.imageUrl" placeholder="或粘贴URL" style="width:360px" />
          <el-image v-if="biz.imageUrl" :src="biz.imageUrl" style="width:120px;height:80px" fit="contain" />
        </div>
      </el-form-item>
      <el-divider content-position="left">质检报告（可选）</el-divider>
      <el-form-item label="编号"><el-input v-model="qc.number" /></el-form-item>
      <el-form-item label="发证机关"><el-input v-model="qc.authority" /></el-form-item>
      <el-form-item label="有效期"><el-date-picker v-model="qc.expireAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="附件上传">
        <div style="display:flex;gap:12px;align-items:center">
          <el-upload :show-file-list="false" :http-request="(r:any)=>onUpload(r,'qc')"><el-button>上传</el-button></el-upload>
          <el-input v-model="qc.imageUrl" placeholder="或粘贴URL" style="width:360px" />
          <el-image v-if="qc.imageUrl" :src="qc.imageUrl" style="width:120px;height:80px" fit="contain" />
        </div>
      </el-form-item>

      <el-divider content-position="left">动物检疫合格证（可选）</el-divider>
      <el-form-item label="编号"><el-input v-model="animal.number" /></el-form-item>
      <el-form-item label="发证机关"><el-input v-model="animal.authority" /></el-form-item>
      <el-form-item label="有效期"><el-date-picker v-model="animal.expireAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      <el-form-item label="附件上传">
        <div style="display:flex;gap:12px;align-items:center">
          <el-upload :show-file-list="false" :http-request="(r:any)=>onUpload(r,'animal')"><el-button>上传</el-button></el-upload>
          <el-input v-model="animal.imageUrl" placeholder="或粘贴URL" style="width:360px" />
          <el-image v-if="animal.imageUrl" :src="animal.imageUrl" style="width:120px;height:80px" fit="contain" />
        </div>
      </el-form-item>
    </el-form>

    <div v-if="isEdit" style="margin-top:16px">
      <el-divider content-position="left">关联信息</el-divider>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>供应商品</template>
            <el-table :data="summary.products"  border>
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="unit" label="单位" width="120" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>历史入库记录（最近200条）</template>
            <el-table :data="summary.inbound"  border>
              <el-table-column prop="productId" label="商品ID" width="120" />
              <el-table-column prop="qty" label="数量" width="120" />
              <el-table-column label="日期">
                <template #default="{ row }">{{ dateOnly(row.at) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
import { dateOnly } from '../utils/datetime';

const route = useRoute();
const router = useRouter();
const id = computed(() => (route.query.id ? String(route.query.id) : ''));
const isEdit = computed(() => !!id.value);
const saving = ref(false);
const formRef = ref();
const form = reactive<{ name: string; address?: string; contact?: string; phone?: string }>({ name: '' });
const rules = {
  name: [{ required: true, message: '请填写公司名称', trigger: 'blur' }],
  address: [{ required: true, message: '请填写地址', trigger: 'blur' }],
  contact: [{ required: true, message: '请填写联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请填写联系电话', trigger: 'blur' }, { validator: (_: any, val: any, cb: any) => {
    const v = String(val ?? '').trim();
    if (!v) return cb(new Error('请填写联系电话'));
    const ok = /^[+]?[\d\s\-()]{6,25}$/.test(v);
    return ok ? cb() : cb(new Error('联系电话格式不正确'));
  }, trigger: 'blur' }],
} as const;
const biz = reactive<any>({ number: '', authority: '', expireAt: '', imageUrl: '' });
const food = reactive<any>({ type: '食品经营许可证', number: '', authority: '', expireAt: '', imageUrl: '' });
const qc = reactive<any>({ number: '', authority: '', expireAt: '', imageUrl: '' });
const animal = reactive<any>({ number: '', authority: '', expireAt: '', imageUrl: '' });
const summary = reactive<{ products: any[]; inbound: any[] }>({ products: [], inbound: [] });

function goBack() { router.back(); }

async function onUpload(req: any, which: 'biz'|'food'|'qc'|'animal') {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const { url } = await api.uploadFile(file.name, reader.result as string);
      (which === 'biz' ? biz : which === 'food' ? food : which === 'qc' ? qc : animal).imageUrl = url;
      req.onSuccess && req.onSuccess({ url });
    } catch (e) { req.onError && req.onError(e); }
  };
  reader.readAsDataURL(file);
}

async function loadDetail() {
  if (!isEdit.value) return;
  try {
    const row = await api.invSupplierDetail(id.value);
    if (row) {
      Object.assign(form, { name: row.name, address: row.address, contact: row.contact, phone: row.phone });
      if (row.businessLicense) Object.assign(biz, {
        number: row.businessLicense.number || '',
        authority: row.businessLicense.authority || '',
        expireAt: (row.businessLicense.expireAt || '').slice(0,10),
        imageUrl: row.businessLicense.imageUrl || ''
      });
      if (row.qcReport) Object.assign(qc, {
        number: row.qcReport.number || '',
        authority: row.qcReport.authority || '',
        expireAt: (row.qcReport.expireAt || '').slice(0,10),
        imageUrl: row.qcReport.imageUrl || ''
      });
      if (row.animalCert) Object.assign(animal, {
        number: row.animalCert.number || '',
        authority: row.animalCert.authority || '',
        expireAt: (row.animalCert.expireAt || '').slice(0,10),
        imageUrl: row.animalCert.imageUrl || ''
      });
    }
  } catch {}
  try { const res = await api.invSupplierSummary(id.value); Object.assign(summary, res); } catch {}
}

async function save() {
  const ok = await (formRef.value?.validate?.().catch(() => false) ?? true);
  if (!ok) { ElMessage.error('请完善必填信息'); return; }
  // 前端重名校验（同校唯一）
  const schoolId = getCurrentSchoolId();
  try {
    const res = await api.invSuppliers({ q: form.name, page: 1, pageSize: 100, schoolId });
    const dup = (res.items || []).some((it: any) => String(it.name).trim() === String(form.name).trim() && (!isEdit.value || String(it.id) !== String(id.value)));
    if (dup) { ElMessage.error('供应商名称已存在，请更换'); return; }
  } catch {}
  // 营业执照（全部必填）
  if (!biz.number) return ElMessage.warning('请填写营业执照编号');
  if (!/^[A-Za-z0-9\-_/]{3,64}$/.test(biz.number)) return ElMessage.warning('营业执照编号格式不正确');
  if (!biz.authority) return ElMessage.warning('请填写营业执照发照机关');
  if (!biz.expireAt) return ElMessage.warning('请选择营业执照有效期');
  if (!biz.imageUrl) return ElMessage.warning('请上传或粘贴营业执照图片URL');
  saving.value = true;
  try {
    let supId: string;
    if (isEdit.value) {
      await api.invSupplierUpdate(id.value, { name: form.name, address: form.address, contact: form.contact, phone: form.phone });
      supId = id.value;
    } else {
      // create supplier first
      const r = await api.invSupplierCreate({ name: form.name, address: form.address, contact: form.contact, phone: form.phone, schoolId: getCurrentSchoolId() });
      supId = String(r.id);
    }
    // add certificates if present
    if (biz.number || biz.authority || biz.expireAt || biz.imageUrl) await api.invSupplierAddCert(supId, { type: '营业执照', number: biz.number, authority: biz.authority, expireAt: biz.expireAt, imageUrl: biz.imageUrl });
    if (food.type && (food.number || food.authority || food.expireAt || food.imageUrl)) await api.invSupplierAddCert(supId, { type: food.type, number: food.number, authority: food.authority, expireAt: food.expireAt, imageUrl: food.imageUrl });
    if (qc.number || qc.authority || qc.expireAt || qc.imageUrl) await api.invSupplierAddCert(supId, { type: '质检报告', number: qc.number, authority: qc.authority, expireAt: qc.expireAt, imageUrl: qc.imageUrl });
    if (animal.number || animal.authority || animal.expireAt || animal.imageUrl) await api.invSupplierAddCert(supId, { type: '动物检疫合格证', number: animal.number, authority: animal.authority, expireAt: animal.expireAt, imageUrl: animal.imageUrl });
    ElMessage.success('已保存');
    router.replace('/suppliers');
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('409')) ElMessage.error('供应商名称已存在，请更换');
    else ElMessage.error('保存失败');
  } finally { saving.value = false; }
}

onMounted(() => { loadDetail(); });
</script>

<style scoped>
</style>
