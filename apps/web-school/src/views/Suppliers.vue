<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>供应商管理</span>
        <div>
          <el-input
            v-model="filters.q"
            placeholder="名称/电话/执照号"
            style="width: 220px; margin-right: 8px"
          />
          <el-select
            v-model="filters.enabled"
            placeholder="请选择"
            style="width: 120px; margin-right: 8px"
            clearable
          >
            <el-option label="仅启用" value="true" />
            <el-option label="仅禁用" value="false" />
          </el-select>
          <el-checkbox v-model="filters.expired" style="margin-right:8px">仅显示已过期</el-checkbox>
          <el-date-picker
            v-model="filters.expireRange"
            type="datetimerange"
            start-placeholder="到期开始"
            end-placeholder="到期结束"
            style="margin-right:8px"
          />
          <el-button @click="load">查询</el-button>
          <el-divider direction="vertical" />
          <el-button   @click="onExportCsv">导出 CSV</el-button>
          <el-button   @click="openImport">导入 CSV</el-button>
          <el-button type="primary"   @click="openCreate">新增供应商</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows"   border @selection-change="onSelChange" :row-class-name="rowClassName">
      <el-table-column type="selection" width="46" />
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="license" label="营业执照号" />
      <el-table-column label="证照到期" width="180">
        <template #default="{ row }">
          <span :style="{ color: row.expired ? '#f56c6c' : '#67c23a' }">{{
            fmtTime(row.licenseExpireAt) || '-'
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="(v: boolean) => toggleEnable(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button   @click="toggleEnable(row, !(row.enabled ?? true))">
            {{ (row.enabled ?? true) ? '禁用' : '启动' }}
          </el-button>
          <el-button   @click="openEdit(row)">编辑</el-button>
          <el-button   type="danger" @click="del(row)">删除</el-button>
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

  <el-dialog v-model="createVisible" :title="editId ? '编辑供应商' : '新增供应商'" width="560px">
    <el-form :model="form" label-width="108px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="form.phone" placeholder="如：13800000000" />
      </el-form-item>
      <el-form-item label="营业执照号">
        <el-input v-model="form.license" />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.address" />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.contact" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="name@example.com" />
      </el-form-item>
      <el-form-item label="评级">
        <el-input v-model.number="form.rating" type="number" min="1" max="5" />
      </el-form-item>
      <el-form-item label="供货品类">
        <el-select v-model="form.categories" multiple placeholder="请选择">
          <el-option v-for="c in catOpts" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="证照到期">
        <el-date-picker v-model="form.licenseExpireAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
      <el-form-item label="证照图片URL">
        <el-input v-model="form.licenseImageUrl" placeholder="http(s)://..." />
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

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const filters = reactive<{ q: string; enabled: '' | 'true' | 'false'; expired: boolean; expireRange: [Date, Date] | null }>({ q: '', enabled: '', expired: false, expireRange: null });
const selected = ref<any[]>([]);
const onSelChange = (arr: any[]) => (selected.value = arr);

function rowClassName({ row }: { row: any }) {
  return row?.expired ? 'row-expired' : '';
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
  rows.value = res.items.map(item=>({
    ...item,
    enabled:!!item.enabled,
  }));
  total.value = res.total;
}

const createVisible = ref(false);
const editId = ref<string | null>(null);
const catOpts = ['粮油', '蔬菜', '肉禽', '调味品'];
const form = reactive<any>({
  name: '',
  phone: '',
  license: '',
  address: '',
  contact: '',
  email: '',
  rating: undefined,
  categories: [],
  licenseExpireAt: '',
  licenseImageUrl: '',
});
function openCreate() {
  editId.value = null;
  Object.assign(form, {
    name: '',
    phone: '',
    license: '',
    address: '',
    contact: '',
    email: '',
    rating: undefined,
    categories: [],
    licenseExpireAt: '',
    licenseImageUrl: '',
  });
  createVisible.value = true;
}
function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, { ...row });
  createVisible.value = true;
}
async function save() {
  if (!form.name) return ElMessage.warning('请填写名称');
  try {
    if (editId.value) await api.invSupplierUpdate(editId.value, normalizeForm());
    else await api.invSupplierCreate({ ...normalizeForm(), schoolId: getCurrentSchoolId() });
    ElMessage.success('已保存');
    createVisible.value = false;
    await load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  }
}
function normalizeForm() {
  const obj: any = { ...form };
  // 使用 datetime 选择器的字符串值（YYYY-MM-DD HH:mm:ss），后端保存为 DATETIME
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
  exportCsv('供应商', rows.value, {
    id: 'ID',
    name: '名称',
    phone: '电话',
    license: '营业执照号',
    address: '地址',
    contact: '联系人',
    email: '邮箱',
    enabled: '启用',
    rating: '评级',
    categories: '品类',
    licenseExpireAt: '到期',
    licenseImageUrl: '证照图片',
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

function fmtTime(v?: string) {
  if (!v) return '';
  try {
    const d = new Date(v);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getFullYear() +
      '-' + pad(d.getMonth() + 1) +
      '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) +
      ':' + pad(d.getMinutes()) +
      ':' + pad(d.getSeconds())
    );
  } catch {
    return v as string;
  }
}
</script>

<style scoped>
.row-expired td {
  background: #fff6f7;
}
</style>
