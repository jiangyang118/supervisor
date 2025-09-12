<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>晨检详情</span>
        <div class="actions">
          <el-button @click="$router.back()">返回</el-button>
          
          <el-button type="primary" @click="openManual">手动登记</el-button>
          <el-button @click="onExportCsv">导出台账</el-button>
        </div>
      </div>
      <div class="sub" v-if="infoStr">{{ infoStr }}</div>
    </template>

    <el-table :data="tableRows"  border>
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column label="检测时间" width="180">
        <template #default="{ row }">{{ row.at ? formatTime(row.at) : '-' }}</template>
      </el-table-column>
      <el-table-column prop="temp" label="体温(℃)" width="120">
        <template #default="{ row }">{{ row.temp ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="工装" width="100">
        <template #default="{ row }">
          <span v-if="row.status==='未检测'">-</span>
          <el-tag v-else :type="row.attire==='正常' ? 'success' : 'danger'" effect="plain">{{ row.attire }}</el-tag>
        </template>
      </el-table-column>
      <!-- <el-table-column label="来源" width="100"><template #default="{ row }">{{ row.source || '-' }}</template></el-table-column> -->
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status==='未检测'" type="info" effect="plain">未检测</el-tag>
          <el-tag v-else :type="row.result==='正常' ? 'success' : 'warning'" effect="plain">{{ row.result }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="处理状态" width="140">
        <template #default="{ row }">
          <span v-if="row.result!=='异常'">-</span>
          <span v-else-if="row.handle">{{ row.handle.decision==='allow' ? '允许上岗' : '暂停上岗' }}（已处理）</span>
          <span v-else>未处理</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200">
        <template #default="{ row }">
          <el-button text type="danger" v-if="row.result==='异常' && !row.handle"  @click="openHandle(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 手动登记 -->
  <el-dialog v-model="manualVisible" title="手动登记" width="560px">
    <el-form :model="manualForm" label-width="108px">
      <el-form-item label="选择人员" required>
        <el-select v-model="manualForm.userId" filterable placeholder="请选择未检测人员" style="width: 320px">
          <el-option v-for="p in untested" :key="p.userId" :label="p.name" :value="p.userId" />
        </el-select>
      </el-form-item>
      <el-form-item label="体温(℃)" required>
        <el-input-number v-model="manualForm.temp" :precision="1" :step="0.1" :min="34" :max="42" />
      </el-form-item>
      <el-form-item label="工装情况" required>
        <el-radio-group v-model="manualForm.attire">
          <el-radio label="正常" />
          <el-radio label="异常" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="卫生情况" required>
        <el-radio-group v-model="manualForm.hygiene">
          <el-radio label="正常" />
          <el-radio label="异常" />
        </el-radio-group>
        <span class="form-hint">（指甲/戒指/胡须）</span>
      </el-form-item>
      <el-form-item label="现场照片">
        <el-upload class="uploader" :show-file-list="false" :http-request="onUpload" :before-upload="beforeUpload" accept="image/*">
          <el-button>选择图片</el-button>
        </el-upload>
        <el-image v-if="manualForm.photoUrl" :src="manualForm.photoUrl" class="photo-preview" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="manualVisible=false">取消</el-button>
      <el-button type="primary" @click="saveManual">提交</el-button>
    </template>
  </el-dialog>

  <!-- 异常处理 -->
  <el-dialog v-model="handleVisible" title="异常处理" width="520px">
    <el-form :model="handleForm" label-width="108px">
      <el-form-item label="处理方式" required>
        <el-radio-group v-model="handleForm.decision">
          <el-radio label="allow">允许上岗</el-radio>
          <el-radio label="suspend">暂停上岗</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="处理说明" required>
        <el-input type="textarea" :rows="3" v-model="handleForm.note" placeholder="请输入处理说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleVisible=false">取消</el-button>
      <el-button type="primary" @click="confirmHandle">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import { getCurrentSchoolIdNum } from '../utils/school';
import { getCurrentSchoolId } from '../utils/school';

type Employee = { userId: string; name: string };
type RecordItem = { userId: string; name: string; at: string; temp: number; attire: '正常'|'异常'; hygiene?: '正常'|'异常'; source: 'device'|'manual'; result: '正常'|'异常'; photoUrl?: string; handle?: { decision: 'allow'|'suspend'; note: string } };

const route = useRoute();
const infoStr = computed(() => {
  const d = (route.query.date as string) || '';
  const c = (route.query.canteen as string) || '';
  return d || c ? `日期：${d || '-'} ｜ 食堂：${c || '-'}` : '';
});

const employees = ref<Employee[]>([]);
const allStaff = ref<Array<{ id: number|string; name: string }>>([]);
const records = ref<RecordItem[]>([]);

const tableRows = computed(() => {
  // Merge expected employees with records; show 未检测 if missing
  const map = new Map(records.value.map(r => [r.userId, r] as const));
  return employees.value.map(e => {
    const r = map.get(e.userId);
    if (!r) return { userId: e.userId, name: e.name, status: '未检测' } as any;
    return { ...r, status: r.result } as any;
  });
});

const untested = computed(() => employees.value.filter(e => !records.value.find(r => r.userId === e.userId)));

function formatTime(iso: string) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }

function openManual() { manualVisible.value = true; manualForm.userId = undefined as any; manualForm.temp = 36.5; manualForm.attire = '正常'; manualForm.hygiene = '正常'; manualForm.photoUrl = ''; }
const manualVisible = ref(false);
const manualForm = reactive<{ userId?: string; temp: number; attire: '正常'|'异常'; hygiene: '正常'|'异常'; photoUrl?: string }>({ temp: 36.5, attire: '正常', hygiene: '正常', photoUrl: '' });

function beforeUpload(file: File) { const ok = file.type.startsWith('image/'); if (!ok) alert('请上传图片文件'); return ok; }
async function onUpload(opt: any) {
  const file: File = opt.file;
  const reader = new FileReader();
  reader.onload = async () => {
    try { const base64 = String(reader.result).split(',')[1] || String(reader.result); const { url } = await api.uploadFile(file.name, base64); manualForm.photoUrl = url; opt.onSuccess?.({}, file); } catch (e) { opt.onError?.(e); }
  };
  reader.onerror = (e) => opt.onError?.(e); reader.readAsDataURL(file);
}

async function saveManual() {
  if (!manualForm.userId || !manualForm.temp || !manualForm.attire || !manualForm.hygiene) { ElMessage.warning('请完整填写手动登记信息'); return; }
  const emp = employees.value.find(e => e.userId === manualForm.userId);
  if (!emp) return;
  try {
    // Persist to backend
    await api.morningCreate({ staff: emp.userId, temp: Number(manualForm.temp), schoolId: getCurrentSchoolIdNum() });
    ElMessage.success('已保存到数据库');
  } catch (e) {
    // Keep UI responsive even if backend unavailable
    ElMessage.warning('后端保存失败，已在本地记录');
  }
  // Update local table data for immediate feedback
  records.value.push({ userId: emp.userId, name: emp.name, at: new Date().toISOString(), temp: manualForm.temp, attire: manualForm.attire, hygiene: manualForm.hygiene, source: 'manual', result: (manualForm.temp >= 37.3 || manualForm.attire==='异常' || manualForm.hygiene==='异常') ? '异常' : '正常', photoUrl: manualForm.photoUrl });
  manualVisible.value = false;
  manualForm.userId = undefined as any; manualForm.photoUrl='';
  updateParentTaskCounts();
}

// 异常处理
const handleVisible = ref(false);
const handleTarget = ref<RecordItem | null>(null);
const handleForm = reactive<{ decision: 'allow'|'suspend'; note: string }>({ decision: 'allow', note: '' });
function openHandle(row: any) { handleTarget.value = records.value.find(r => r.userId === row.userId) || null; handleForm.decision = 'allow'; handleForm.note=''; handleVisible.value = true; }
function confirmHandle() { if (!handleTarget.value) return; if (!handleForm.note) { ElMessage.warning('请填写处理说明'); return; } handleTarget.value.handle = { decision: handleForm.decision, note: handleForm.note }; handleVisible.value = false; updateParentTaskCounts(); }

function onExportCsv() {
  const data = tableRows.value.map((r:any) => ({ name: r.name, at: r.at || '', temp: r.temp ?? '', attire: r.attire || '', source: r.source || '', result: r.status, handle: r.handle ? (r.handle.decision==='allow'?'允许上岗':'暂停上岗')+':'+r.handle.note : '' }));
  exportCsv('晨检详情', data, { name:'姓名', at:'检测时间', temp:'体温', attire:'工装', source:'来源', result:'状态', handle:'处理' });
}

// 已移除设备记录同步接口（/api/morning-checks），不再提供该功能

function dayStr(d?: string) { return (d||'').slice(0,10); }
function updateParentTaskCounts() {
  try {
    const d = dayStr(route.query.date as string) || new Date().toISOString().slice(0,10);
    const canteen = (route.query.canteen as string) || '';
    const actual = records.value.length;
    const abnormal = records.value.filter(r => r.result==='异常').length;
    const unhandled = records.value.filter(r => r.result==='异常' && !r.handle).length;
    const raw = localStorage.getItem('morning_tasks');
    if (!raw) return;
    const list = JSON.parse(raw) as any[];
    const idx = list.findIndex(t => t.date===d && String(t.canteen||'')===String(canteen||''));
    if (idx>=0) { list[idx].actual = actual; list[idx].abnormal = abnormal; list[idx].unhandledAbnormal = unhandled; localStorage.setItem('morning_tasks', JSON.stringify(list)); }
  } catch {}
}

onMounted(async () => {
  try {
    // Load personnel from 人员资质作为选择人员来源
    const sid = getCurrentSchoolId();
    const res = await api.personnelList({ schoolId: sid, page: 1, pageSize: 1000 });
    const items = (res as any)?.items || [];
    // If this detail page was opened for a specific canteen (by name), filter accordingly
    const canteenName = String(route.query.canteen || '').trim();
    const filtered = canteenName ? items.filter((it: any) => String(it.canteenName || '').trim() === canteenName) : items;
    allStaff.value = filtered.map((it: any) => ({ id: it.id, name: it.name }));
    employees.value = allStaff.value.map(s => ({ userId: String(s.id), name: s.name }));
  } catch { employees.value = []; allStaff.value = []; }
  // 从后端加载当日已保存的晨检记录（含手动登记）
  try { await loadDbRecords(); } catch {}
  updateParentTaskCounts();
});

async function loadDbRecords() {
  const d = (route.query.date as string) || new Date().toISOString().slice(0,10);
  const start = `${d}T00:00:00`;
  const end = `${d}T23:59:59`;
  const schoolId = getCurrentSchoolIdNum();
  const res = await api.morningList({ schoolId, start, end, page: 1, pageSize: 1000 });
  const db = (res.items || []).map((it: any) => {
    const userId = String(it.staff);
    const name = employees.value.find(e => e.userId === userId)?.name || userId;
    return { userId, name, at: it.at, temp: it.temp, attire: '正常', hygiene: '正常', source: it.source, result: it.result } as any;
  });
  // Merge by userId, DB entries take precedence
  const map = new Map<string, any>();
  for (const r of records.value) map.set(r.userId, r);
  for (const r of db) map.set(r.userId, r);
  records.value = Array.from(map.values());
}
</script>

<style scoped>
.header { display:flex; align-items:center; justify-content:space-between; }
.sub { margin-top:4px; color:#888; }
.actions > * { margin-left:8px; }
.uploader { display:inline-block; }
.form-hint { color:#909399; font-size:12px; margin-left: 8px; }
.photo-preview { width:120px; height:90px; object-fit:cover; margin-left:8px; border: 1px solid var(--el-border-color); border-radius: 4px; }
</style>
