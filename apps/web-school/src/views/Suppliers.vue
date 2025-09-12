<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>供应商资质</span>
        <div style="display:flex;gap:8px;align-items:center">
         
          <el-select
            v-model="filters.enabled"
            placeholder="全部"
            style="width: 120px"
            clearable
          >
            <el-option value="true" label="启用" />
            <el-option value="false"    label="禁用" />
          </el-select>
         
          <el-date-picker
            v-model="filters.expireRange"
            type="datetimerange"
            start-placeholder="到期开始"
            end-placeholder="到期结束"
            format="YYYY-MM-DD"
          />
          <el-button @click="load">查询</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
          <el-button @click="openImport">导入 CSV</el-button>
          <el-button type="primary" @click="goCreate">新增供应商</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" border stripe  class="qual-table" @selection-change="onSelChange" :row-class-name="rowClassName">
      <el-table-column type="selection" width="46" />
      <el-table-column prop="name" label="供应商名称" />
      <el-table-column prop="license" label="营业执照编号" />
      <el-table-column prop="foodLicense" label="食品生产/经营许可证编号" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch :model-value="!!row.enabled" @change="(v:boolean)=>toggleEnable(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="有效期至" width="140">
        <template #default="{ row }">{{ dateOnly(row.nextExpireAt) || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.statusTag==='过期' ? 'danger' : (row.statusTag==='临期' ? 'warning' : 'success')" effect="light" round size="small">{{ row.statusTag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <ActionCell :actions="[
            { label: '查看', onClick: () => view(row), type: 'info' },
            { label: '编辑', onClick: () => openEdit(row), type: 'primary' },
            { label: '删除', onClick: () => del(row), danger: true, confirm: '确认删除该供应商？' },
          ]" :inline="2" />
        </template>
      </el-table-column>
    </el-table>
    <div
      style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center"
    >
      <div>
        <el-button   :disabled="selected.length === 0" @click="batchEnable(true)"
          >批量启用</el-button
        >
        <el-button   :disabled="selected.length === 0" @click="batchEnable(false)"
          >批量禁用</el-button
        >
      </div>
      <el-pagination
        background
        layout="prev, pager, next, ->, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="
          (p: number) => {
            page = p;
            load();
          }
        "
      />
    </div>
  </el-card>

  <el-dialog v-model="createVisible" :title="editId ? '编辑供应商' : '新增供应商'" width="720px">
    <el-form :model="form" label-width="120px">
      <el-divider content-position="left">基本信息</el-divider>
      <el-form-item label="供应商名称" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.address" />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.contact" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.phone" placeholder="如：13800000000" />
      </el-form-item>

      <el-divider content-position="left">证件信息</el-divider>
      <el-form-item label="类型" required>
        <el-select v-model="form.certType" placeholder="请选择" style="width: 260px">
          <el-option label="营业执照" value="营业执照" />
          <el-option label="食品生产许可证" value="食品生产许可证" />
          <el-option label="食品经营许可证" value="食品经营许可证" />
          <el-option label="质检报告" value="质检报告" />
          <el-option label="动物检疫合格证" value="动物检疫合格证" />
        </el-select>
      </el-form-item>
      <el-form-item label="证件编号">
        <el-input v-model="form.certNumber" />
      </el-form-item>
      <el-form-item label="发证机关">
        <el-input v-model="form.certAuthority" />
      </el-form-item>
      <el-form-item label="有效期">
        <el-date-picker v-model="form.certExpireAt" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="证件上传">
        <div style="display:flex;gap:12px;align-items:center">
          <el-upload :show-file-list="false" :http-request="onUploadCert">
            <el-button>上传</el-button>
          </el-upload>
          <el-input v-model="form.certImageUrl" placeholder="或粘贴图片URL" style="width: 320px" />
          <el-image v-if="form.certImageUrl" :src="form.certImageUrl" style="width:120px;height:80px" fit="contain" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="importVisible" title="导入供应商CSV" width="560px">
    <p>
      请粘贴CSV文本，首行包含列名：id,name,phone,license,address,contact,email,enabled,rating,categories,licenseExpireAt,licenseImageUrl
    </p>
    <el-input v-model="importText" type="textarea" :rows="8" />
    <template #footer>
      <el-button @click="importVisible = false">取消</el-button>
      <el-button type="primary" @click="doImport">导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentSchoolId } from '../utils/school';
import { dateOnly } from '../utils/datetime';
import ActionCell from '../components/ActionCell.vue';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const filters = reactive<{ q: string; enabled: '' | 'true' | 'false'; expired: boolean; expireRange: [Date, Date] | null }>({ q: '', enabled: '', expired: false, expireRange: null });
const selected = ref<any[]>([]);
const onSelChange = (arr: any[]) => (selected.value = arr);

function rowClassName({ row }: { row: any }) {
  return row?.statusTag === '过期' ? 'row-expired' : '';
}

async function load() {
  const res = await api.invSuppliers({
    q: filters.q || undefined,
    enabled: filters.enabled || undefined,
    expired: filters.expired ? 'true' : undefined,
    expireStart: filters.expireRange?.[0]?.toISOString(),
    expireEnd: filters.expireRange?.[1]?.toISOString(),
    page: page.value,
    pageSize: pageSize.value,
    schoolId: getCurrentSchoolId(),
  });
  rows.value = res.items.map(item=>{
    const bizExp = item.licenseExpireAt ? new Date(item.licenseExpireAt).getTime() : undefined;
    const foodExp = item.foodLicenseExpireAt ? new Date(item.foodLicenseExpireAt).getTime() : undefined;
    const candidates = [bizExp, foodExp].filter((x)=> typeof x === 'number') as number[];
    const nextExpireAtTs = candidates.length ? Math.min(...candidates) : undefined;
    const daysLeft = typeof nextExpireAtTs === 'number' ? Math.ceil((nextExpireAtTs - Date.now())/86400000) : undefined;
    const statusTag = typeof daysLeft === 'number' ? (daysLeft < 0 ? '过期' : (daysLeft <= 30 ? '临期' : '有效')) : '有效';
    return {
      ...item,
      enabled: !!item.enabled,
      nextExpireAt: nextExpireAtTs ? new Date(nextExpireAtTs).toISOString() : '',
      statusTag,
    };
  });
  total.value = res.total;
}

const createVisible = ref(false);
const editId = ref<string | null>(null);
import { useRouter } from 'vue-router';
const router = useRouter();
const catOpts = ['粮油', '蔬菜', '肉禽', '调味品'];
const form = reactive<any>({
  name: '',
  address: '',
  contact: '',
  phone: '',
  // certificate fields
  certType: '营业执照',
  certNumber: '',
  certAuthority: '',
  certExpireAt: '',
  certImageUrl: '',
  // legacy fallback for edit rows
  license: '',
  licenseExpireAt: '',
});
function goCreate() { router.push('/suppliers/new'); }
function view(row: any) { router.push({ path: '/suppliers/edit', query: { id: String(row.id) } }); }
function openEdit(row: any) { router.push({ path: '/suppliers/edit', query: { id: String(row.id) } }); }
async function save() {
  if (!form.name) return ElMessage.warning('请填写供应商名称');
  try {
    if (editId.value) await api.invSupplierUpdate(editId.value, normalizeForm());
    else await api.invSupplierCreate({ ...normalizeForm(), schoolId: getCurrentSchoolId() });
    ElMessage.success('已保存');
    createVisible.value = false;
    await load();
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('409')) ElMessage.error('供应商名称已存在，请更换');
    else ElMessage.error('保存失败');
  }
}
function normalizeForm() {
  const obj: any = {
    name: form.name,
    address: form.address || undefined,
    contact: form.contact || undefined,
    phone: form.phone || undefined,
    // certificate fields
    certType: form.certType || '营业执照',
    certNumber: form.certNumber || undefined,
    certAuthority: form.certAuthority || undefined,
    certExpireAt: form.certExpireAt || undefined,
    certImageUrl: form.certImageUrl || undefined,
  };
  return obj;
}
async function del(row: any) {
  await ElMessageBox.confirm(`确认删除供应商“${row.name}”？`, '提示');
  await api.invSupplierDelete(row.id);
  ElMessage.success('已删除');
  await load();
}
async function toggleEnable(row: any, enabled: boolean) {
  await api.invSupplierUpdate(row.id, { enabled });
  await load();
}
async function batchEnable(enabled: boolean) {
  const ids = selected.value.map((r) => r.id);
  if (ids.length === 0) return;
  await api.invSuppliersBatchEnable(ids, enabled);
  selected.value = [];
  await load();
}
async function onExportCsv() {
  // 直接前端导出当前页（也可请求服务端csv）
  exportCsv('供应商资质', rows.value, {
    name: '供应商名称',
    license: '营业执照编号',
    foodLicense: '食品生产/经营许可证编号',
    nextExpireAt: '有效期至',
    statusTag: '状态',
  });
}
const importVisible = ref(false);
const importText = ref('');
function openImport() {
  importText.value = '';
  importVisible.value = true;
}
async function doImport() {
  await api.invSuppliersImport(importText.value);
  ElMessage.success('已导入');
  importVisible.value = false;
  await load();
}

async function onUploadCert(req: any) {
  const file: File = req.file;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const content = reader.result as string;
      const { url } = await api.uploadFile(file.name, content);
      form.certImageUrl = url;
      req.onSuccess && req.onSuccess({ url });
    } catch (e) {
      req.onError && req.onError(e);
    }
  };
  reader.readAsDataURL(file);
}

let off: any = null;
onMounted(() => {
  load();
  const h = () => {
    page.value = 1;
    load();
  };
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try {
    off?.();
  } catch {}
});

// 时间格式已统一使用 dateOnly
</script>

<style scoped>
.row-expired td {
  background: #fff6f7;
}
.qual-table :deep(.el-table__cell) { padding: 8px 12px; }
</style>
