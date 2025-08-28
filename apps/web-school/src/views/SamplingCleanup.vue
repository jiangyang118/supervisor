<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>样品清理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增清理记录</el-button>
          <el-button @click="onExportCsv">导出清理记录</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="sample" label="样品" />
      <el-table-column prop="weight" label="重量(g)" width="120" />
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
      <el-table-column prop="method" label="处理方式" />
      <el-table-column prop="by" label="处理人" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.at) }}</template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="createVisible" title="新增清理记录" width="520px">
    <el-form :model="form" label-width="96px">
      <el-form-item label="样品" required>
        <el-input v-model="form.sample" />
      </el-form-item>
      <el-form-item label="重量(g)">
        <el-input-number v-model="form.weight" :min="1" />
      </el-form-item>
      <el-form-item label="图片URL">
        <el-input v-model="form.imageUrl" placeholder="http(s)://..." />
      </el-form-item>
      <el-form-item label="处理方式" required>
        <el-select v-model="form.method" placeholder="请选择">
          <el-option label="销毁" value="销毁" />
          <el-option label="回收" value="回收" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理人" required>
        <el-input v-model="form.by" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并上报</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';

const rows = ref<any[]>([]);
const createVisible = ref(false);
const form = reactive({ sample: '', weight: 0, imageUrl: '', method: '销毁', by: '' });

async function load() {
  try {
    const res = await api.samplingCleanupList({ schoolId: getCurrentSchoolId() });
    rows.value = res.items;
  } catch (e) {
    ElMessage.error('加载清理记录失败');
  }
}

function openCreate() {
  form.sample = '';
  form.weight = 0;
  form.imageUrl = '';
  form.method = '销毁';
  form.by = '';
  createVisible.value = true;
}
async function save() {
  if (!form.sample || !form.method || !form.by) {
    ElMessage.warning('请填写样品、处理方式、处理人');
    return;
  }
  try {
    await api.samplingCleanupCreate({ ...form, schoolId: getCurrentSchoolId() } as any);
    ElMessage.success('已上报');
    createVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error('保存失败');
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
  exportCsv('样品清理', rows.value, {
    id: 'ID',
    sample: '样品',
    weight: '重量',
    imageUrl: '图片',
    method: '处理方式',
    by: '处理人',
    at: '时间',
  });
}

let off: any = null;
onMounted(() => {
  load();
  const h = () => load();
  window.addEventListener('school-changed', h as any);
  off = () => window.removeEventListener('school-changed', h as any);
});
</script>
