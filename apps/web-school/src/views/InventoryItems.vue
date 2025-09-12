<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>商品管理</span>
        <div style="display:flex;gap:8px;align-items:center">
          <el-button type="primary" @click="openDialog()">新增商品</el-button>
          <!-- <el-button @click="importCloud">从云端食材库导入</el-button>
          <el-upload :show-file-list="false" :auto-upload="true" :http-request="onImportTemplate" accept=".csv,text/csv">
            <el-button>Excel模板导入</el-button>
          </el-upload>
          <el-button @click="downloadTemplate">下载模板</el-button> -->
        </div>
      </div>
    </template>
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="商品编号" width="120" />
      <el-table-column prop="name" label="商品名称" min-width="180" />
      <el-table-column prop="category" label="分类" width="140" />
      <el-table-column prop="spec" label="规格" min-width="160" />
      <el-table-column prop="lastPrice" label="最近进价" width="120">
        <template #default="{ row }">{{ row.lastPrice != null ? Number(row.lastPrice).toFixed(2) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button text  @click="edit(row)" type="success">编辑</el-button>
          <el-popconfirm title="确认删除该商品？" @confirm="remove(row)">
            <template #reference>
              <el-button text type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="visible" :title="form.id ? '编辑商品' : '新增商品'" width="560px">
    <el-form :model="form" ref="formRef" label-width="120px">
      <el-form-item label="商品名称" required><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" filterable placeholder="请选择" style="width: 240px">
          <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="规格"><el-input v-model="form.spec" placeholder="例如：25kg/袋 或 500g/包" /></el-form-item>
      <el-form-item label="单位"><el-input v-model="form.unit" placeholder="kg/枚/瓶/包..." /></el-form-item>
      <el-form-item label="最近进价"><el-input v-model.number="form.lastPrice" type="number" placeholder="0.00" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="catVisible" title="设置分类" width="420px">
    <el-form label-width="120px">
      <el-form-item label="分类">
        <el-select v-model="catForm.category" filterable placeholder="请选择" style="width: 240px">
          <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="catVisible=false">取消</el-button>
      <el-button type="primary" @click="saveCategory">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';

const categories = ['主食','肉类','蛋类','鱼虾蟹贝类','奶类及奶制品','豆类及豆制品','蔬菜','油脂','淀粉类','菌藻类','坚果种子类','小吃甜品','速食食品','含酒精饮料','蜜饯类','调味品','饮料'];
const rows = ref<any[]>([]);
const visible = ref(false);
const formRef = ref();
const form = reactive<any>({ id: 0, name: '', unit: '', category: '', spec: '', lastPrice: undefined });
const catVisible = ref(false);
const catForm = reactive<any>({ id: 0, category: '' });

async function load() {
  try { rows.value = await api.invProducts(getCurrentSchoolId()); } catch { rows.value = []; }
}
function openDialog(row?: any) { visible.value = true; Object.assign(form, row ? { ...row } : { id: 0, name: '', unit: '', category: '', spec: '', lastPrice: undefined }); }
function edit(row: any) { openDialog(row); }
function setCategory(row: any) { catVisible.value = true; Object.assign(catForm, { id: row.id, category: row.category || '' }); }

async function save() {
  try {
    if (!form.name || !form.unit) { ElMessage.warning('请填写商品名称与单位'); return; }
    if (form.id) {
      await api.invProductUpdate(form.id, { name: form.name, unit: form.unit, category: form.category || undefined, spec: form.spec || undefined, lastPrice: form.lastPrice != null ? Number(form.lastPrice) : undefined });
    } else {
      await api.invProductCreate({ schoolId: getCurrentSchoolId(), name: form.name, unit: form.unit, category: form.category || undefined, spec: form.spec || undefined, lastPrice: form.lastPrice != null ? Number(form.lastPrice) : undefined });
    }
    ElMessage.success('已保存'); visible.value = false; load();
  } catch { ElMessage.error('保存失败'); }
}
async function saveCategory() {
  try { await api.invProductUpdate(catForm.id, { category: catForm.category || undefined }); ElMessage.success('已保存'); catVisible.value = false; load(); } catch { ElMessage.error('保存失败'); }
}

async function importCloud() {
  try {
    const data = await api.invImportCloud();
    // 简单导入示例数据
    for (const it of (data.items || [])) {
      await api.invProductCreate({ schoolId: getCurrentSchoolId(), name: it.name, unit: it.unit, category: it.category, spec: it.spec });
    }
    ElMessage.success('已从云端食材库导入样例'); load();
  } catch { ElMessage.error('导入失败'); }
}

async function onImportTemplate(opts: any) {
  try {
    const file: File = opts.file; const text = await file.text();
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (!lines.length) return;
    const rawHeader = lines.shift()!.split(',').map(s=>s.trim().replace(/^\ufeff/, ''));
    // Map possible Chinese headers to internal keys
    const keyMap: Record<string, string> = {
      name: 'name', '商品名称': 'name',
      unit: 'unit', '单位': 'unit',
      category: 'category', '分类': 'category',
      spec: 'spec', '规格': 'spec',
      lastPrice: 'lastPrice', '最近进价': 'lastPrice',
    };
    const header = rawHeader.map(h => keyMap[h] || h);
    const items = lines.map(ln=>{
      const cols = ln.split(','); const obj: any = {}; header.forEach((h,i)=>{ if (!h) return; obj[h]= (cols[i]||'').trim(); });
      const lastPrice = obj.lastPrice ? Number(obj.lastPrice) : undefined;
      return { name: obj.name, unit: obj.unit, category: obj.category, spec: obj.spec, lastPrice };
    }).filter(it=>it.name && it.unit);
    await api.invImportTemplate(getCurrentSchoolId(), items);
    ElMessage.success('已导入'); load();
  } catch { ElMessage.error('导入失败'); }
}

function downloadTemplate() {
  // 中文列名模板，兼容 Excel 打开
  const headerZh = ['商品名称','单位','分类','规格','最近进价'];
  const blob = new Blob(['\uFEFF' + headerZh.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '商品导入模板.csv'; a.click(); URL.revokeObjectURL(url);
}

onMounted(load);

async function remove(row: any) {
  try { await api.invProductDelete(row.id); ElMessage.success('已删除'); load(); } catch { ElMessage.error('删除失败'); }
}
</script>

<style scoped>
</style>
