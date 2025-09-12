<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>留样管理</span>
        <div class="actions">
          <el-button type="primary" @click="addSmart">同步设备数据</el-button>
          <el-button @click="manualVisible=true">手动记录</el-button>
          <el-button @click="exportAll">导出</el-button>
        </div>
      </div>
    </template>

    <el-table :data="batches"  border>
      <el-table-column prop="date" label="留样日期" width="140" />
      <el-table-column prop="meal" label="餐次" width="100" />
      <el-table-column prop="canteen" label="食堂" width="160" />
      <el-table-column prop="by" label="留样人" width="120" />
      <el-table-column label="留样时间" width="180">
        <template #default="{ row }">{{ row.createdAt || (row.items && row.items[0] ? row.items[0].at : '') }}</template>
      </el-table-column>
      <el-table-column label="出锅时间" width="140">
        <template #default="{ row }">{{ (row.items && row.items[0] && row.items[0].cookTime) ? row.items[0].cookTime : '' }}</template>
      </el-table-column>
      <el-table-column prop="linkedCount" label="关联菜品数" width="120" />
      <el-table-column label="操作" min-width="220">
        <template #default="{ row }">
          <el-button text @click="viewBatch(row)" type="primary">查看</el-button>
          
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 手动登记 -->
  <el-dialog v-model="manualVisible" title="手动登记" width="520px">
    <el-form :model="manualForm" label-width="96px">
      <el-form-item label="样品名称" required>
        <el-input v-model="manualForm.sample" placeholder="可关联菜单，直接填写菜名" />
      </el-form-item>
      <el-form-item label="重量(g)" required>
        <el-input-number v-model="manualForm.weight" :min="1" />
      </el-form-item>
      <el-form-item label="出锅时间">
        <el-time-picker
          v-model="manualForm.cookTime"
          placeholder="选择时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="上传图片" required>
        <el-upload
          class="uploader"
          :show-file-list="false"
          :http-request="onUpload"
          :before-upload="beforeUpload"
          accept="image/*"
        >
          <el-button>选择图片</el-button>
        </el-upload>
        <div v-if="manualForm.imageUrl" class="preview">
          <el-image :src="manualForm.imageUrl" style="width: 120px; height: 90px; object-fit: cover" />
        </div>
      </el-form-item>
      <el-form-item label="留样人" required>
        <el-input v-model="manualForm.by" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="食堂" required>
        <el-select v-model="manualForm.canteenId" placeholder="请选择食堂" style="width: 240px">
          <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="manualVisible=false">取消</el-button>
      <el-button type="primary" @click="saveManual">保存</el-button>
    </template>
  </el-dialog>

  <!-- 详情/清理 -->
  <el-dialog v-model="detailVisible" title="留样详情" width="720px">
    <div v-if="current">
      <div class="kv"><b>留样日期：</b>{{ current.date }}</div>
      <div class="kv"><b>餐次：</b>{{ current.meal }}</div>
      <div class="kv"><b>食堂：</b>{{ current.canteen }}</div>
      <div class="kv"><b>留样人：</b>{{ current.by }}</div>
      <el-divider />
      <div v-if="current.items && current.items.length">
        <el-table :data="current.items"  border>
          <el-table-column prop="sample" label="样品/菜品" />
          <el-table-column prop="weight" label="重量(g)" width="100" />
          <el-table-column label="图片" width="120">
            <template #default="{ row }">
              <el-image v-if="row.imageUrl" :src="row.imageUrl" :preview-src-list="[row.imageUrl]" style="width: 64px; height: 48px; object-fit: cover" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="slot" label="格口" width="80" />
          <el-table-column label="日期" width="140">
            <template #default="{ row }">{{ dateOnly(row.at) }}</template>
          </el-table-column>
          <el-table-column label="出锅时间" width="120">
            <template #default="{ row }">{{ row.cookTime || '-' }}</template>
          </el-table-column>
          <el-table-column v-if="current.type==='cleanup'" prop="photos" label="清理照片" />
        </el-table>
      </div>
      <div v-else class="muted">无明细</div>

      <div v-if="current.type==='cleanup'" class="cleanup-box">
        <el-divider>清理闭环</el-divider>
        <el-form :model="cleanupForm" label-width="96px">
          <el-form-item label="清理人" required>
            <el-input v-model="cleanupForm.by" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="清理照片URL" required>
            <el-input v-model="cleanupForm.photos" placeholder="可多张，以逗号分隔" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="confirmCleanup">确认清理</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <el-button @click="detailVisible=false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { useAuthStore } from '../stores/auth';
import { dateOnly } from '../utils/datetime';
import { api } from '../services/api';
import { getCurrentSchoolIdNum } from '../utils/school';

type Batch = {
  id: string;
  type: 'smart' | 'manual' | 'cleanup';
  date: string; // YYYY-MM-DD
  meal: '早餐' | '午餐' | '晚餐';
  canteen: string;
  by: string;
  createdAt?: string; // 留样时间（创建时间）
  linkedCount: number;
  items: Array<{ sample: string; weight?: number; imageUrl?: string; slot?: string; at?: string; cookTime?: string; photos?: string }>; // photos for cleanup records
};

const auth = useAuthStore();
const batches = ref<Batch[]>([]);
const detailVisible = ref(false);
const current = ref<Batch | null>(null);
const manualVisible = ref(false);
const manualForm = reactive<{ sample: string; weight: number; imageUrl: string; by: string; canteenId?: number | string; cookTime?: string }>({ sample: '', weight: 100, imageUrl: '', by: '', canteenId: undefined, cookTime: '' });
const canteens = ref<Array<{ id: number|string; name: string }>>([]);
const cleanupForm = reactive({ by: '', photos: '' });

function mealNow(): Batch['meal'] {
  const h = new Date().getHours();
  if (h < 10) return '早餐';
  if (h < 15) return '午餐';
  return '晚餐';
}
function todayStr() { const d=new Date(); const p=(n:number)=> String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function uid() { return Math.random().toString(36).slice(2, 10); }
function canteenName() { return '学校食堂'; }

function persist() { try { localStorage.setItem('sampling_batches', JSON.stringify(batches.value)); } catch {} }
function restore() { try { const s = localStorage.getItem('sampling_batches'); if (s) batches.value = JSON.parse(s); } catch {} }

function addSmart() {
  ElMessage({ message: '暂未连接设备', type: 'info' });
  // const by = auth.user?.name || '操作员';
  // const count = 1 + Math.floor(Math.random() * 3);
  // const items = Array.from({ length: count }).map((_, i) => ({ sample: `菜品${i+1}`, weight: 100 + i * 20, imageUrl: '', slot: String(1 + i), at: new Date().toLocaleString() }));
  // batches.value.unshift({ id: uid(), type: 'smart', date: todayStr(), meal: mealNow(), canteen: canteenName(), by, createdAt: new Date().toLocaleString(), linkedCount: count, items });
  // persist();
}
function saveManual() {
  if (!manualForm.sample || !manualForm.imageUrl || !manualForm.by || !manualForm.weight || !manualForm.canteenId) { return; }
  const canteen = canteens.value.find(c=> String(c.id)===String(manualForm.canteenId))?.name || canteenName();
  const nowIso = new Date().toISOString();
  batches.value.unshift({ id: uid(), type: 'manual', date: todayStr(), meal: mealNow(), canteen, by: manualForm.by, createdAt: nowIso, linkedCount: 1, items: [ { sample: manualForm.sample, weight: manualForm.weight, imageUrl: manualForm.imageUrl, at: nowIso, cookTime: manualForm.cookTime || '' } ] });
  persist();
  manualVisible.value = false;
  manualForm.sample=''; manualForm.imageUrl=''; manualForm.by=''; manualForm.weight=100; manualForm.canteenId = undefined; manualForm.cookTime='';
}

function viewBatch(b: Batch) {
  current.value = JSON.parse(JSON.stringify(b));
  cleanupForm.by = b.by || '';
  cleanupForm.photos = '';
  detailVisible.value = true;
}
function fmtDateTime(v?: string) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function confirmCleanup() {
  if (!current.value) return;
  if (!cleanupForm.by || !cleanupForm.photos) return;
  const photos = cleanupForm.photos;
  current.value.items = [{ sample: '清理记录', photos, at: new Date().toISOString() }];
  current.value.by = cleanupForm.by;
  current.value.linkedCount = 1;
  // write back
  const idx = batches.value.findIndex((x) => x.id === current.value!.id);
  if (idx >= 0) batches.value[idx] = JSON.parse(JSON.stringify(current.value));
  persist();
}

function exportAll() {
  const data = batches.value.map((b) => {
    const first: any = (b.items && b.items[0]) || {};
    return {
      date: b.date,
      meal: b.meal,
      canteen: b.canteen,
      by: b.by,
      createdAt: fmtDateTime(b.createdAt || first.at || ''),
      cookTime: first.cookTime || '',
      linkedCount: b.linkedCount,
    };
  });
  exportCsv('留样记录', data, {
    date: '留样日期',
    meal: '餐次',
    canteen: '食堂',
    by: '留样人',

    cookTime: '出锅时间',
    linkedCount: '关联菜品数',
  });
}

onMounted(async () => {
  restore();
  try {
    const list = await api.canteensList(getCurrentSchoolIdNum());
    canteens.value = Array.isArray(list) ? list : (list?.items || []);
  } catch {}
});

// Upload helpers
function beforeUpload(file: File) {
  const ok = file.type.startsWith('image/');
  if (!ok) alert('请上传图片文件');
  return ok;
}
async function onUpload(opt: any) {
  const file: File = opt.file;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = String(reader.result).split(',')[1] || String(reader.result);
      const { url } = await api.uploadFile(file.name, base64);
      manualForm.imageUrl = url;
      opt.onSuccess?.({}, file);
    } catch (e) {
      opt.onError?.(e);
    }
  };
  reader.onerror = (e) => opt.onError?.(e);
  reader.readAsDataURL(file);
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions > * { margin-left: 8px; }
.kv { margin: 6px 0; }
.muted { color:#999; }
.cleanup-box { margin-top: 12px; }
.uploader { display:inline-block; margin-right: 12px; }
.preview { display:inline-block; vertical-align: middle; margin-left: 8px; }
</style>
