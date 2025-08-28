<template>
  <el-card class="news-card">
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>食安资讯</span><el-button type="primary" @click="openCreate">发布资讯</el-button>
      </div>
    </template>
    <el-table :data="rows" size="small" border height="calc(100vh - 260px)">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="enabled" label="启用" width="120"
        ><template #default="{ row }"
          ><el-switch
            :model-value="row.enabled"
            @change="(v: boolean) => toggleEnabled(row, v)" /></template
      ></el-table-column>
      <el-table-column prop="pinned" label="置顶" width="120"
        ><template #default="{ row }"
          ><el-switch
            :model-value="row.pinned"
            @change="(v: boolean) => togglePinned(row, v)" /></template
      ></el-table-column>
      <el-table-column prop="at" label="发布时间" width="200" />
      <el-table-column label="操作" width="220"
        ><template #default="{ row }"
          ><el-button size="small" @click="edit(row)">编辑</el-button
          ><el-button size="small" type="danger" @click="del(row)">删除</el-button></template
        ></el-table-column
      >
    </el-table>
  </el-card>

  <el-dialog v-model="dlg" :title="form.id ? '编辑资讯' : '发布资讯'" width="720px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容"
        ><el-input v-model="form.content" type="textarea" :rows="8"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dlg = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const rows = ref<any[]>([]);
const dlg = ref(false);
const form = ref<any>({ id: '', title: '', content: '' });
async function load() {
  const res = await api.sysNews({ page: 1, pageSize: 100 });
  rows.value = res.items || [];
}
function openCreate() {
  form.value = { id: '', title: '', content: '' };
  dlg.value = true;
}
function edit(row: any) {
  form.value = { id: row.id, title: row.title, content: row.content };
  dlg.value = true;
}
async function save() {
  if (!form.value.title) return;
  if (form.value.id) {
    await api.sysNewsUpdate(form.value.id, {
      title: form.value.title,
      content: form.value.content,
    });
  } else {
    await api.sysNewsCreate({ title: form.value.title, content: form.value.content });
  }
  dlg.value = false;
  await load();
}
async function del(row: any) {
  await api.sysNewsDelete(row.id);
  await load();
}
async function toggleEnabled(row: any, v: boolean) {
  await api.sysNewsSetEnabled(row.id, v);
  await load();
}
async function togglePinned(row: any, v: boolean) {
  await api.sysNewsSetPinned(row.id, v);
  await load();
}
onMounted(load);
</script>

<style>
.news-card {
  min-height: 420px;
}
</style>
