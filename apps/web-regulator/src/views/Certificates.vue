<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>资质证件监管</span>
        <div>
          <el-select
            v-model="schoolId"
            clearable
            filterable
            placeholder="全部学校"
            style="min-width: 220px; margin-right: 8px"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button @click="exportAll">导出全部</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="tab">
      <el-tab-pane label="食堂信息" name="canteens">
        <el-table :data="canteens" size="small" border>
          <el-table-column prop="schoolId" label="学校ID" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="address" label="地址" />
          <el-table-column prop="licenseExpireAt" label="许可证到期" width="160" />
        </el-table>
        <div style="margin-top: 8px; text-align: right">
          <el-button @click="exportCsv('canteens')">导出 CSV</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="工勤人员" name="workers">
        <el-table :data="workers" size="small" border>
          <el-table-column prop="schoolId" label="学校ID" width="120" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="role" label="岗位" width="140" />
          <el-table-column prop="healthCertExpireAt" label="健康证到期" width="160" />
        </el-table>
        <div style="margin-top: 8px; text-align: right">
          <el-button @click="exportCsv('workers')">导出 CSV</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="供应商" name="suppliers">
        <el-table :data="suppliers" size="small" border>
          <el-table-column prop="schoolId" label="学校ID" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="phone" label="电话" width="160" />
          <el-table-column prop="licenseExpireAt" label="营业执照到期" width="160" />
        </el-table>
        <div style="margin-top: 8px; text-align: right">
          <el-button @click="exportCsv('suppliers')">导出 CSV</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="异常台账" name="exceptions">
        <div style="margin-bottom: 8px">
          <el-select v-model="type" placeholder="全部类型" clearable style="min-width: 160px">
            <el-option label="全部" value="" />
            <el-option label="食堂" value="canteen" />
            <el-option label="人员" value="worker" />
            <el-option label="供应商" value="supplier" />
          </el-select>
          <el-button style="margin-left: 8px" @click="load">查询</el-button>
        </div>
        <el-table :data="exceptions" size="small" border>
          <el-table-column prop="schoolId" label="学校ID" width="120" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="entityName" label="主体" />
          <el-table-column prop="certificateType" label="证件" width="140" />
          <el-table-column prop="expireAt" label="到期" width="160" />
          <el-table-column label="处理措施">
            <template #default="{ row }">
              <el-input
                v-model="row.measure"
                placeholder="处理措施"
                style="width: 220px; margin-right: 8px"
              />
              <el-button size="small" @click="setMeasure(row)">保存</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="记录时间" width="180" />
        </el-table>
        <div style="margin-top: 8px; text-align: right">
          <el-button @click="exportCsv('exceptions')">导出 CSV</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { api } from '../services/api';

const schools = ref<Array<{ id: string; name: string }>>([]);
const schoolId = ref<string | undefined>(undefined);
const tab = ref('canteens');
const type = ref<'' | 'canteen' | 'worker' | 'supplier'>('');
const canteens = ref<any[]>([]);
const workers = ref<any[]>([]);
const suppliers = ref<any[]>([]);
const exceptions = ref<any[]>([]);

async function load() {
  if (tab.value === 'canteens') canteens.value = await api.credCanteens(schoolId.value);
  else if (tab.value === 'workers') workers.value = await api.credWorkers(schoolId.value);
  else if (tab.value === 'suppliers') suppliers.value = await api.credSuppliers(schoolId.value);
  else
    exceptions.value = await api.credExceptions({
      type: type.value || undefined,
      schoolId: schoolId.value,
    });
}
async function setMeasure(row: any) {
  await api.credSetMeasure(row.id, row.measure || '');
}
async function exportCsv(target: 'canteens' | 'workers' | 'suppliers' | 'exceptions') {
  const csv = await api.credExportCsv({
    target,
    type: type.value || undefined,
    schoolId: schoolId.value,
  });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${target}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
async function exportAll() {
  await exportCsv(tab.value as any);
}

onMounted(async () => {
  schools.value = await api.schools();
  await load();
});
watch([schoolId, tab, type], () => load());
</script>
