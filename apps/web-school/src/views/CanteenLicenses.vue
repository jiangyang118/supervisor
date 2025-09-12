<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span >食堂资质</span>
      <div>
        <el-button type="primary" @click="openDialog()">新增食堂</el-button>
      </div>
      </div>
    </template>
    <el-table :data="rows" border stripe  class="qual-table">
      <el-table-column prop="canteenName" label="食堂名称" min-width="160" />
      <el-table-column prop="address" label="地址" min-width="200" />
      <el-table-column prop="manager" label="负责人" width="120" />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column prop="bizLicenseNo" label="营业执照编号" min-width="180" />
      <el-table-column prop="foodPermitNo" label="食品经营许可证编号" min-width="200" />
      <el-table-column label="有效期至" width="140">
        <template #default="{ row }">{{ dateOnly(row.expireAt) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="tagType(row.status)" effect="light" round >{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <ActionCell :actions="[
            { label: '查看', onClick: () => view(row), type: 'info' },
            { label: '编辑', onClick: () => edit(row), type: 'primary' },
            { label: '删除', onClick: () => onDelete(row), danger: true, confirm: '确认删除该食堂资质？' },
          ]" :inline="99" />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="食堂资质" width="720px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="150px">
        <el-divider content-position="left">食堂基本信息</el-divider>
        <el-form-item label="食堂名称" prop="_id">
          <el-select v-model="form._id" filterable placeholder="请选择食堂" style="width: 360px" @change="onCanteenSelect">
            <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.manager" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>

        <el-divider content-position="left">证照信息</el-divider>
        <el-form-item label="营业执照编号" prop="biz.number"><el-input v-model="form.biz.number" /></el-form-item>
        <el-form-item label="发照机关"><el-input v-model="form.biz.authority" /></el-form-item>
        <el-form-item label="有效期至" prop="biz.expireAt">
          <el-date-picker v-model="form.biz.expireAt" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="营业执照上传">
          <el-upload :http-request="(req:any)=>onUpload(req,'biz')" :show-file-list="false">
            <el-button>上传文件</el-button>
          </el-upload>
          <el-image v-if="form.biz.fileUrl" :src="form.biz.fileUrl" :preview-src-list="[form.biz.fileUrl]" fit="contain" style="width: 120px; height: 80px; margin-left:8px"/>
        </el-form-item>

        <el-form-item label="食品经营许可证编号" prop="food.number"><el-input v-model="form.food.number" /></el-form-item>
        <el-form-item label="发证机关"><el-input v-model="form.food.authority" /></el-form-item>
        <el-form-item label="许可项目"><el-input v-model="form.food.items" placeholder="例如：热食类食品制售" /></el-form-item>
        <el-form-item label="有效期至" prop="food.expireAt">
          <el-date-picker v-model="form.food.expireAt" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="许可证上传">
          <el-upload :http-request="(req:any)=>onUpload(req,'food')" :show-file-list="false">
            <el-button>上传文件</el-button>
          </el-upload>
          <el-image v-if="form.food.fileUrl" :src="form.food.fileUrl" :preview-src-list="[form.food.fileUrl]" fit="contain" style="width: 120px; height: 80px; margin-left:8px"/>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { API_BASE } from '../services/api';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import ActionCell from '../components/ActionCell.vue';
import { dateOnly } from '../utils/datetime';

type Row = { canteenId: number | null; canteenName: string; address?: string; manager?: string; phone?: string; bizLicenseNo: string; foodPermitNo: string; expireAt: string; status: '有效' | '临期' | '过期' };
const rows = ref<Row[]>([]);
const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const form = ref<any>({
  _id: undefined as number | undefined,
  canteenName: '', address: '', manager: '', phone: '',
  biz: { number: '', authority: '', expireAt: '', fileUrl: '' },
  food: { number: '', authority: '', items: '', expireAt: '', fileUrl: '' },
});
const formRef = ref();
const rules = {
  _id: [
    { required: true, message: '请选择食堂名称', trigger: 'change' },
  ],
  'biz.number': [
    { required: true, message: '请填写营业执照编号', trigger: 'blur' },
  ],
  'biz.expireAt': [
    { required: true, message: '请选择营业执照有效期', trigger: 'change' },
  ],
  'food.number': [
    { required: true, message: '请填写食品经营许可证编号', trigger: 'blur' },
  ],
  'food.expireAt': [
    { required: true, message: '请选择食品经营许可证有效期', trigger: 'change' },
  ],
} as const;

function tagType(s: string) {
  if (s === '过期') return 'danger';
  if (s === '临期') return 'warning';
  return 'success';
}

async function load() {
  loading.value = true;
  try {
    const sid = getCurrentSchoolId();
    const list = await api.canteensSummary(sid);
    rows.value = (list || []).map((it: any) => ({
      canteenId: it.canteenId ?? null,
      canteenName: it.canteenName || it.name || '-',
      address: it.address || '',
      manager: it.manager || '',
      phone: it.phone || '',
      bizLicenseNo: it.bizLicenseNo || '',
      foodPermitNo: it.foodPermitNo || '',
      expireAt: it.expireAt || '',
      status: (it.status as any) || '有效',
    })) as Row[];
  } finally {
    loading.value = false;
  }
}
// load canteens for selection (仅启用)
const canteens = ref<Array<{ id: number; name: string; address?: string; manager?: string; phone?: string }>>([]);
async function loadCanteens() {
  try { canteens.value = await api.canteensList(getCurrentSchoolId() as any); } catch { canteens.value = []; }
}
const router = useRouter();
function view(row: Row) {
  if (row.canteenId) router.push({ path: '/hr/canteen-licenses/view', query: { id: String(row.canteenId) } });
  else ElMessage.warning('暂无可查看的食堂详情');

}
async function openDialog(init?: Partial<Row>) {
  visible.value = true;
  await loadCanteens();
  if (init?.canteenId) {
    const sid = getCurrentSchoolId();
    const d = await api.canteenDetail(Number(init.canteenId), sid);
    form.value = {
      _id: Number(init.canteenId),
      _originalName: d?.canteen?.name || init.canteenName || '',
      canteenName: d?.canteen?.name || init.canteenName || '',
      address: d?.canteen?.address || init.address || '',
      manager: d?.canteen?.manager || init.manager || '',
      phone: d?.canteen?.phone || init.phone || '',
      biz: {
        id: d?.licenses?.biz?.id,
        number: d?.licenses?.biz?.number || '',
        authority: d?.licenses?.biz?.authority || '',
        expireAt: (d?.licenses?.biz?.expireAt || '').slice(0,10),
        fileUrl: d?.licenses?.biz?.imageUrl || '',
      },
      food: {
        id: d?.licenses?.food?.id,
        number: d?.licenses?.food?.number || '',
        authority: d?.licenses?.food?.authority || '',
        items: d?.licenses?.food?.permitItems || '',
        expireAt: (d?.licenses?.food?.expireAt || '').slice(0,10),
        fileUrl: d?.licenses?.food?.imageUrl || '',
      },
    } as any;
  } else {
    form.value = { _id: undefined, canteenName: '', address: '', manager: '', phone: '', biz: { number: '', authority: '', expireAt: '', fileUrl: '' }, food: { number: '', authority: '', items: '', expireAt: '', fileUrl: '' } };
  }
}
function edit(row: Row) { openDialog(row); }

async function onUpload(req: any, kind: 'biz' | 'food') {
  const file = req.file as File;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const content = (reader.result as string) || '';
      const r = await api.uploadFile(file.name, content);
      // api.uploadFile 已返回带 BASE 的可访问 URL，直接使用
      form.value[kind].fileUrl = r.url;
      req.onSuccess && req.onSuccess(r);
    } catch (e) {
      req.onError && req.onError(e);
    }
  };
  reader.readAsDataURL(file);
}

async function save() {
  // validate required
  const ok = await (formRef.value?.validate?.().catch(() => false) ?? true);
  if (!ok) { ElMessage.error('请完善必填信息'); return; }
  saving.value = true;
  try {
    const sid = getCurrentSchoolId();
    const canteenId = Number((form.value as any)._id || 0);
    if (!Number.isFinite(canteenId) || canteenId <= 0) { ElMessage.error('请选择食堂'); return; }
    await api.canteenDetailUpdate({
      canteenId,
      name: form.value.canteenName,
      address: form.value.address,
      manager: form.value.manager,
      phone: form.value.phone,
      biz: form.value.biz?.number && form.value.biz?.expireAt ? { id: form.value.biz.id, number: form.value.biz.number, authority: form.value.biz.authority, expireAt: form.value.biz.expireAt, imageUrl: form.value.biz.fileUrl } : undefined,
      food: form.value.food?.number && form.value.food?.expireAt ? { id: form.value.food.id, number: form.value.food.number, authority: form.value.food.authority, permitItems: form.value.food.items, expireAt: form.value.food.expireAt, imageUrl: form.value.food.fileUrl } : undefined,
    });
    await load();
    visible.value = false;
  } finally { saving.value = false; }
}
async function onDelete(row: Row) {
  if (row.canteenId) await api.canteenDetailDelete(Number(row.canteenId));
  await load();
}
  onMounted(load);

function onCanteenSelect(id: number) {
  const c = (canteens.value || []).find((x) => Number(x.id) === Number(id));
  if (!c) return;
  // Always sync canteen basic info upon selection switch
  form.value.canteenName = c.name || '';
  form.value.address = c.address || '';
  form.value.manager = c.manager || '';
  form.value.phone = c.phone || '';
}
</script>

<style scoped>
.qual-table :deep(.el-table__cell) { padding: 8px 12px; }
</style>
