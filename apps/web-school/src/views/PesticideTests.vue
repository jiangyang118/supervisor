<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>农残快检管理</span>
        <div>
          <el-button @click="onDeviceConnect">设备接入</el-button>
          <el-button type="primary" @click="openCreate">手动录入</el-button>
          <el-button @click="showExceptions">异常处置</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" style="margin-bottom: 8px">
      <el-form-item label="关键词">
        <el-input v-model="filters.q" placeholder="样品/检测仪" clearable />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="filters.result" placeholder="全部" clearable style="width:120px">
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="filters.range" type="daterange" unlink-panels  start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="-" />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" border>
      <el-table-column label="检测日期" width="140"><template #default="{ row }">{{ String(row.at||'').slice(0,10) }}</template></el-table-column>
      <el-table-column label="食堂" min-width="160"><template #default="{ row }">{{ canteenName(row.canteenId) }}</template></el-table-column>
      <el-table-column prop="sample" label="检测样本" min-width="160" />
      <el-table-column label="检测结果" width="120">
        <template #default="{ row }"><el-tag :type="row.result==='合格'?'success':'danger'" effect="plain">{{ row.result }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="tester" label="检测员" width="140" />
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button  @click="viewDetail(row)">查看详情</el-button>
          <el-button @click="onExportOne(row)">导出</el-button>
          <el-button v-if="row.result==='不合格'" type="warning" @click="openMeasure(row)">异常处置</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新建农残检测记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="食堂">
        <el-select v-model="form.canteenId" placeholder="请选择" style="width: 260px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="Number(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="样品" required>
        <el-select v-model="form.sample" filterable allow-create default-first-option placeholder="选择或输入样品" style="width: 260px" data-testid="dlg-sample">
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="检测仪" required>
        <el-input v-model="form.device" data-testid="dlg-device" />
      </el-form-item>
      <el-form-item label="检测值" required>
        <el-input-number v-model="form.value" :min="0" :precision="3" controls-position="right" placeholder="请输入数值" />
      </el-form-item>
      <el-form-item label="检测员"><el-input v-model="form.tester" placeholder="可选" /></el-form-item>
      <el-form-item label="结果" required>
        <el-select
          v-model="form.result"
          data-testid="dlg-result"
          :teleported="false"
          placeholder="请选择"
        >
          <el-option label="合格" value="合格" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>
      <el-form-item label="检测图片">
        <div style="display: flex; align-items: center; gap: 8px">
          <el-upload :show-file-list="false" :auto-upload="true" :http-request="onUpload" accept="image/*">
            <el-button>选择图片</el-button>
          </el-upload>
          <el-image
            v-if="form.imageUrl"
            :src="form.imageUrl"
            fit="cover"
            style="width: 80px; height: 48px"
          />
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并上报</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="measureVisible" title="处理措施" width="520px">
    <el-input v-model="measureText" type="textarea" :rows="4" placeholder="请输入处理措施" />
    <template #footer>
      <el-button @click="measureVisible = false">取消</el-button>
      <el-button type="primary" @click="saveMeasure">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { exportCsv } from '../utils/export';
import { api, API_BASE } from '../services/api';
import { getCurrentSchoolIdNum } from '../utils/school';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const products = ref<any[]>([]);
const canteens = ref<any[]>([]);
const sseConnected = ref(false);
let es: EventSource | null = null;

const filters = reactive<{
  q: string;
  result: '' | '合格' | '不合格' | null;
  range: [Date, Date] | null;
}>({ q: '', result: '' as any, range: null });

async function load() {
  const params: any = { schoolId: getCurrentSchoolIdNum() };
  if (filters.q) params.q = filters.q;
  if (filters.result) params.result = filters.result;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.pesticideList(params);
    rows.value = res.items;
  } catch {
    ElMessage.error('加载失败');
  }
}
function applyFilters() {
  load();
}

const createVisible = ref(false);
const form = reactive<any>({ canteenId: undefined as number|undefined, sample: '', device: '', tester: '', result: '合格', imageUrl: '', remark: '' });
function openCreate() {
  form.canteenId = canteens.value[0]?.id ? Number(canteens.value[0].id) : undefined;
  form.sample = '';
  form.device = '';
  form.tester = '';
  form.value = undefined as any;
  form.result = '合格';
  form.imageUrl = '';
  form.remark = '';
  createVisible.value = true;
}
async function save() {
  if (!form.sample || !form.device || !form.result) {
    ElMessage.warning('请完善样品、检测仪与结果');
    return;
  }
  if (form.value === undefined || form.value === null || String(form.value) === '') { ElMessage.warning('请输入检测值'); return; }
  try {
    await api.pesticideCreate({
      schoolId: getCurrentSchoolIdNum(),
      canteenId: form.canteenId,
      sample: form.sample,
      device: form.device,
      tester: form.tester || undefined,
      value: form.value,
      result: form.result as any,
      imageUrl: form.imageUrl || undefined,
      remark: form.remark || undefined,
    });
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  }
}

async function onUpload(opts: any) {
  try {
    const file: File = opts.file;
    const reader = new FileReader();
    const p = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('读取文件失败'));
    });
    reader.readAsDataURL(file);
    const content = await p;
    // 先本地预览，提升体验
    form.imageUrl = content;
    // 上传后替换为服务端可访问 URL
    const { url } = await api.uploadFile(file.name, content);
    form.imageUrl = url;
    ElMessage.success('图片已上传');
  } catch (e) {
    ElMessage.error('上传失败');
  }
}

const measureVisible = ref(false);
const measureText = ref('');
const measureRow = ref<any | null>(null);
function openMeasure(row: any) {
  measureRow.value = row;
  measureText.value = row.measure || '';
  measureVisible.value = true;
}
async function saveMeasure() {
  if (!measureRow.value) return;
  await api.pesticideSetMeasure(measureRow.value.id, measureText.value);
  ElMessage.success('已保存');
  measureVisible.value = false;
  load();
}

function connectSSE() {
  try {
    es = new EventSource(`${API_BASE}/school/pesticide/stream`);
    es.onopen = () => (sseConnected.value = true);
    es.onerror = () => (sseConnected.value = false);
    es.addEventListener('pesticide-created', () => load());
    es.addEventListener('pesticide-updated', () => load());
  } catch {
    sseConnected.value = false;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function onExportCsv() {
  exportCsv('农残快检', rows.value, {
    id: 'ID',
    sample: '样品',
    device: '检测仪',
    imageUrl: '图片',
    result: '结果',
    remark: '备注',
    at: '时间',
    measure: '处理措施',
  });
}
function onExportExceptions() {
  const ex = rows.value.filter((r) => r.result === '不合格');
  exportCsv('农残异常', ex, {
    id: 'ID',
    sample: '样品',
    device: '检测仪',
    imageUrl: '图片',
    result: '结果',
    remark: '备注',
    at: '时间',
    measure: '处理措施',
  });
}

function canteenName(id?: number) {
  return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-';
}
function onExportOne(row: any) {
  exportCsv(`农残-${row.id}`, [row], { at: '检测日期', canteenId: '食堂', sample: '检测样本', result: '检测结果', tester: '检测员' });
}
function viewDetail(row: any) {
  ElMessage.info(`样本: ${row.sample}，结果: ${row.result}`);
}
function onDeviceConnect() {
  connectSSE();
  ElMessage.success('已尝试连接检测仪');
}
function showExceptions() {
  filters.result = '不合格' as any;
  applyFilters();
}

let off: any = null;
onMounted(() => {
  load();
  api.canteensList(getCurrentSchoolIdNum() as any).then((list)=> canteens.value = list || []).catch(()=> (canteens.value=[]));
  api.invProducts(getCurrentSchoolIdNum() as any).then((list)=> products.value = list || []).catch(()=> (products.value=[]));
  connectSSE();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
onBeforeUnmount(() => {
  es?.close();
  try {
    off?.();
  } catch {}
});
</script>
