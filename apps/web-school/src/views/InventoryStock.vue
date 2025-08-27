<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>库存与盘点</span>
        <div>
          <el-button type="primary" @click="doCheck">库存盘点</el-button>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-table :data="rows" size="small" border>
      <el-table-column prop="item" label="商品" />
      <el-table-column prop="qty" label="库存" width="120" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { exportCsv } from '../utils/export';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const products = ref<any[]>([]);
function productName(id: string){ return products.value.find((p:any)=>p.id===id)?.name || id; }
async function load(){ rows.value = await api.invStock(); products.value = await api.invProducts(); }
async function doCheck(){ if (rows.value.length>0) await api.invStocktake({ productId: rows.value[0].productId, qty: rows.value[0].qty }); await load(); }
const onExportCsv = () => exportCsv('库存盘点', rows.value, { productId: '商品ID', qty: '库存', updatedAt: '更新时间' });
onMounted(()=>load());
</script>
