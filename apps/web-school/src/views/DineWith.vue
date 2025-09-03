<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>陪餐管理</span>
        <div class="actions">
          <el-tag :type="sseConnected ? 'success' : 'warning'" effect="plain" size="small"
            >摄像头 {{ sseConnected ? '已连接' : '连接中' }}</el-tag
          >
          <el-button @click="generateQr">生成陪餐二维码</el-button>
          <el-button type="primary" @click="openCreate">新增陪餐</el-button>
          <el-button @click="onExportCsv">导出记录</el-button>
          <el-button @click="onExportExceptions">导出异常</el-button>
        </div>
      </div>
    </template>
    <el-form :inline="true" :model="filters" class="filters">
      <el-form-item label="餐次">
        <el-select v-model="filters.meal" clearable placeholder="全部" style="width: 120px">
          <el-option label="全部" :value="0" />
          <el-option v-for="m in meals" :key="m.key" :label="m.label" :value="m.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="异常">
        <el-select v-model="filters.exception" clearable placeholder="全部" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="仅异常" value="true" />
          <el-option label="仅正常" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="filters.range"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="-"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="applyFilters">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="meal" label="餐次" width="120" />
      <el-table-column label="人员">
        <template #default="{ row }">{{ (row.people || []).join(',') }}</template>
      </el-table-column>
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            style="width: 64px; height: 48px; object-fit: cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="comment" label="评价" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.exception ? 'danger' : 'success'" effect="plain">{{
            row.exception ? '异常' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.at) }}</template>
      </el-table-column>
      <el-table-column prop="measure" label="处理措施" min-width="160">
        <template #default="{ row }">
          <span v-if="!row.exception">-</span>
          <span v-else>{{ row.measure || '未处理' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-if="row.exception" size="small" @click="openMeasure(row)"
            >处理措施</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, ->, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>

  <el-dialog v-model="createVisible" title="新增陪餐" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="餐次" required>
        <el-select v-model="form.meal" placeholder="请选择">
          <el-option
            v-for="m in meals"
            :key="m.key"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="人员" required>
        <el-input v-model="form.peopleText" placeholder="多人用逗号分隔" />
      </el-form-item>
      <el-form-item label="图片URL">
        <el-input v-model="form.imageUrl" placeholder="http(s)://..." />
      </el-form-item>
      <el-form-item label="评价">
        <el-input v-model="form.comment" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并上报</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="qrVisible" title="陪餐二维码" width="560px">
    <div>
      <p>
        链接：<code>{{ qr.link }}</code>
      </p>
      <p>提示：将该链接生成二维码给移动端扫码填写；当前环境未集成二维码库，已提供可复制链接。</p>
    </div>
    <template #footer>
      <el-button @click="qrVisible = false">关闭</el-button>
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
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

const handlePageChange = (p: number) => {
  page.value = p;
  load();
};

const rows = ref<any[]>([]);
const meals = ref<Array<{ key: string; value: number; label: string }>>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const sseConnected = ref(false);
let es: EventSource | null = null;

const filters = reactive<{
  meal: 0; // ''=全部，其它见枚举 key
  exception: '' | 'true' | 'false' | null;
  range: [Date, Date] | null;
}>({ meal: 0, exception: 'false', range: null });

async function load() {
  const params: any = {
    page: page.value,
    pageSize: pageSize.value,
    schoolId: getCurrentSchoolId(),
  };
  if (filters.meal) params.meal = filters.meal;
  if (filters.exception) params.exception = filters.exception;
  if (filters.range && filters.range.length === 2) {
    params.start = filters.range[0].toISOString();
    params.end = filters.range[1].toISOString();
  }
  try {
    const res = await api.dineList(params);
    rows.value = res.items;
    total.value = res.total;
  } catch (e) {
    ElMessage.error('加载失败');
  }
}
function applyFilters() {
  page.value = 1;
  load();
}

const createVisible = ref(false);
const form = reactive<{ meal: number; peopleText: string; imageUrl: string; comment: string }>({
  meal: 1,
  peopleText: '',
  imageUrl: '',
  comment: '',
});
function openCreate() {
  form.meal = 1;
  form.peopleText = '';
  form.imageUrl = '';
  form.comment = '';
  createVisible.value = true;
}
async function save() {
  try {
    const people = form.peopleText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!form.meal || people.length === 0) {
      ElMessage.warning('请填写餐次和陪餐人员');
      return;
    }
    if (!form.meal) {
      ElMessage.warning('请选择餐次');
      return;
    }
    await api.dineCreate({
      schoolId: getCurrentSchoolId(),
      meal: form.meal,
      people,
      imageUrl: form.imageUrl || undefined,
      comment: form.comment || undefined,
    });
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  }
}

const qrVisible = ref(false);
const qr = reactive<{ link: string; token?: string }>({ link: '' });
async function generateQr() {
  try {
    const mealKey = filters.meal || 0; // 默认午餐
    const r = await api.dineQrCreate(mealKey, getCurrentSchoolId());
    qr.link = `${API_BASE}${r.link}`;
    qr.token = r.token;
    qrVisible.value = true;
  } catch {
    ElMessage.error('生成二维码失败');
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
  await api.dineSetMeasure(measureRow.value.id, measureText.value);
  ElMessage.success('已保存');
  measureVisible.value = false;
  load();
}

function connectSSE() {
  try {
    es = new EventSource(`${API_BASE}/school/dine/stream`);
    es.onopen = () => (sseConnected.value = true);
    es.onerror = () => (sseConnected.value = false);
    es.addEventListener('dine-created', () => load());
    es.addEventListener('dine-updated', () => load());
  } catch {
    sseConnected.value = false;
  }
}
function onExportCsv() {
  exportCsv('陪餐记录', rows.value, {
    id: 'ID',
    meal: '餐次',
    people: '人员',
    imageUrl: '图片',
    comment: '评价',
    at: '时间',
    exception: '是否异常',
    measure: '处理措施',
  });
}
function onExportExceptions() {
  const ex = rows.value.filter((r) => r.exception);
  exportCsv('陪餐异常', ex, {
    id: 'ID',
    meal: '餐次',
    people: '人员',
    at: '时间',
    exceptionReason: '异常原因',
    measure: '处理措施',
  });
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

let off: any = null;
onMounted(() => {
  load();
  // load meal enums (key/value)
  api.dineMealOptions()
    .then((res) => (meals.value = res.items || []))
    .catch(() => (meals.value = [
      { key: 'BREAKFAST', value: 1, label: '早餐' },
      { key: 'LUNCH', value: 2, label: '午餐' },
      { key: 'DINNER', value: 3, label: '晚餐' },
    ]));
  connectSSE();
  const h = () => {
    page.value = 1;
    load();
  };
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

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions > * {
  margin-left: 8px;
}
.filters {
  margin-bottom: 8px;
}
.pagination {
  margin-top: 12px;
  text-align: right;
}
</style>
