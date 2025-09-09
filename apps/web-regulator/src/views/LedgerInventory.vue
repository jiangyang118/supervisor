<template>
  <el-card>
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>出入库/索证/添加剂</span>
        <div>
          <el-button @click="onExportCsv">导出 CSV</el-button>
        </div>
      </div>
    </template>
    <el-tabs v-model="tab">
      <el-tab-pane label="入库" name="in">
        <el-table :data="inRows" size="small" border>
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="item" label="商品" />
          <el-table-column prop="quantity" label="数量" width="120" />
          <el-table-column prop="supplier" label="供应商" />
          <el-table-column prop="at" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="出库" name="out">
        <el-table :data="outRows" size="small" border>
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="item" label="商品" />
          <el-table-column prop="quantity" label="数量" width="120" />
          <el-table-column prop="purpose" label="用途" />
          <el-table-column prop="by" label="出库人" />
          <el-table-column prop="at" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="索票索证" name="tickets">
        <el-table :data="tkRows" size="small" border>
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="item" label="商品" />
          <el-table-column prop="type" label="类型" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="at" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="添加剂使用" name="additives">
        <el-table :data="adRows" size="small" border>
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="school" label="学校" />
          <el-table-column prop="name" label="添加剂" />
          <el-table-column prop="amount" label="用量(g)" width="120" />
          <el-table-column prop="dish" label="菜品" />
          <el-table-column prop="at" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportCsv } from '../utils/export';
const tab = ref('in');
type InRow = {
  id: string;
  school: string;
  item: string;
  quantity: number;
  supplier: string;
  at: string;
};
type OutRow = {
  id: string;
  school: string;
  item: string;
  quantity: number;
  purpose: string;
  by: string;
  at: string;
};
type TkRow = { id: string; school: string; item: string; type: string; status: string; at: string };
type AdRow = { id: string; school: string; name: string; amount: number; dish: string; at: string };
const inRows = ref<InRow[]>([]);
const outRows = ref<OutRow[]>([]);
const tkRows = ref<TkRow[]>([]);
const adRows = ref<AdRow[]>([]);
const onExportCsv = () => {
  const all = [
    ...inRows.value.map((r) => ({ ...r, kind: '入库' })),
    ...outRows.value.map((r) => ({ ...r, kind: '出库' })),
    ...tkRows.value.map((r) => ({ ...r, kind: '索证' })),
    ...adRows.value.map((r) => ({ ...r, kind: '添加剂' })),
  ];
  exportCsv('出入库与索证添加剂-监管', all as any, {
    kind: '类型',
    id: 'ID',
    school: '学校',
    item: '商品',
    quantity: '数量',
    supplier: '供应商',
    purpose: '用途',
    by: '出库人',
    name: '添加剂',
    amount: '用量',
    dish: '菜品',
    at: '时间',
  });
};
</script>
