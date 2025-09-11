<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>废弃物管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增记录</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="所属食堂">
        <el-select v-model="filters.canteenId" clearable filterable placeholder="全部食堂" style="min-width: 200px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="种类">
        <el-select v-model="filters.category" clearable placeholder="请选择">
          <el-option
            v-for="c in categories"
            :key="c.id || c"
            :label="c.name || c"
            :value="c.name || c"
          />
        </el-select>
        <el-button link type="primary" @click="openCategoryDialog">新增类别</el-button>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels start-placeholder="开始日期" end-placeholder="结束日期" range-separator="-" />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="canteenName" label="所属食堂" min-width="160" />
      <el-table-column prop="category" label="种类" />
      <el-table-column prop="amount" label="数量(kg)" width="140" />
      <el-table-column prop="buyer" label="收购单位" />
      <el-table-column prop="person" label="收运人" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增废弃物记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="所属食堂">
        <el-select v-model="form.canteenId" filterable placeholder="请选择" style="width: 240px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="form.date" type="date" />
      </el-form-item>
      <el-form-item label="种类">
        <el-select v-model="form.category" placeholder="请选择">
          <el-option
            v-for="c in categories"
            :key="c.id || c"
            :label="c.name || c"
            :value="c.name || c"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="数量(kg)">
        <el-input-number v-model="form.amount" :min="0" />
      </el-form-item>
      <el-form-item label="收购单位">
        <el-input v-model="form.buyer" />
      </el-form-item>
      <el-form-item label="收运人">
        <el-input v-model="form.person" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="categoryDialogVisible" title="类别管理" width="520px">
    <div style="margin-bottom: 12px">
      <el-input
        v-model="newCategory"
        placeholder="输入新类别名称后点击添加"
        style="width: 320px; margin-right: 8px"
      />
      <el-button type="primary" @click="addCategory">添加</el-button>
    </div>
    <el-table :data="categories as any" size="small" border>
      <el-table-column label="名称" prop="name" />
      <el-table-column label="启用" width="120">
        <template #default="{ row }">
          <el-switch :model-value="row.enabled" @change="(v: boolean) => setEnabled(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="deleteCategory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="categoryDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentSchoolIdNum } from '../utils/school';
type Category = { id: string; name: string; enabled: boolean } | string;
const categories = ref<Category[]>([]);
type Row = {
  id: number;
  date: string;
  canteenName?: string;
  category: string;
  amount: number;
  buyer: string;
  person: string;
};
const rows = ref<Row[]>([]);
const filters = reactive<{ canteenId?: number | null; category: string | undefined; range: [Date, Date] | null }>({
  canteenId: null,
  category: undefined,
  range: null,
});
const applyFilters = async () => {
  const params: any = { schoolId: getCurrentSchoolIdNum() };
  if (filters.canteenId) params.canteenId = filters.canteenId;
  if (filters.category) params.category = filters.category;
  if (filters.range && filters.range.length === 2) {
    const [s, e] = filters.range;
    if (s) params.start = s.toISOString();
    if (e) params.end = e.toISOString();
  }
  const res = await api.wasteList(params);
  rows.value = res.items.map((r: any) => ({
    id: r.id,
    date: r.date,
    canteenName: r.canteenName || '-',
    category: r.category,
    amount: r.amount,
    buyer: r.buyer,
    person: r.person,
  }));
};
const createVisible = ref(false);
const form = reactive({ canteenId: null as number | null, date: new Date(), category: '', amount: 0, buyer: '', person: '' });
const categoryDialogVisible = ref(false);
const newCategory = ref('');
const openCategoryDialog = () => {
  newCategory.value = '';
  categoryDialogVisible.value = true;
};
const addCategory = async () => {
  const name = newCategory.value.trim();
  if (!name) {
    ElMessage.warning('请输入类别名称');
    return;
  }
  try {
    await api.wasteCategoryCreate(name);
    ElMessage.success('已添加');
    categoryDialogVisible.value = false;
    await loadCategories();
  } catch (e: any) {
    const msg = String(e?.message || '添加失败');
    if (msg.includes('409')) ElMessage.error('类别已存在');
    else ElMessage.error(msg);
  }
};
const loadCategories = async () => {
  const list = await api.wasteCategories();
  categories.value = list;
  const first = (categories.value[0] as any)?.name || categories.value[0];
  if (!filters.category && categories.value.length) filters.category = first;
  if (!form.category && categories.value.length) form.category = first as string;
};

const setEnabled = async (c: any, enabled: boolean) => {
  await api.wasteCategorySetEnabled(c.id, enabled);
  await loadCategories();
};
const deleteCategory = async (c: any) => {
  await ElMessageBox.confirm(`确认删除类别“${c.name}”？`, '提示');
  await api.wasteCategoryDelete(c.id);
  ElMessage.success('已删除');
  await loadCategories();
};
const openCreate = () => {
  createVisible.value = true;
};
const save = async () => {
  await api.wasteCreate({
    canteenId: form.canteenId || undefined,
    date: (form.date as any)?.toISOString?.() ?? undefined,
    category: form.category,
    amount: form.amount,
    buyer: form.buyer,
    person: form.person,
    schoolId: getCurrentSchoolIdNum(),
  });
  createVisible.value = false;
  await applyFilters();
};
const onExportCsv = () =>
  exportCsv('废弃物管理', rows.value, {
    id: 'ID',
    date: '日期',
    canteenName: '所属食堂',
    category: '种类',
    amount: '数量(kg)',
    buyer: '收购单位',
    person: '收运人',
  });

async function deleteRow(row: Row) {
  await ElMessageBox.confirm(`确认删除记录 #${row.id}？`, '提示', { type: 'warning' });
  await api.wasteDelete(row.id);
  ElMessage.success('已删除');
  await applyFilters();
}

let off: any = null;
const canteens = ref<Array<{ id: number; name: string }>>([]);
async function loadCanteens() {
  try { const sid = getCurrentSchoolIdNum(); const list = await api.canteensList(String(sid)); canteens.value = (list || []).map((c:any)=>({ id: Number(c.id), name: c.name })); } catch { canteens.value = []; }
}
onMounted(async () => {
  await loadCanteens();
  await loadCategories();
  await applyFilters();
  const h = async () => {
    await loadCanteens(); await applyFilters();
  };
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  try {
    off?.();
  } catch {}
});
</script>
