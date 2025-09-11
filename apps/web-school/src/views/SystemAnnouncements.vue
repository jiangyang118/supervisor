<template>
  <el-card>
    <template #header>公告公文管理</template>
    <el-form :model="form" label-width="96px" style="max-width: 720px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" /></el-form-item>
      <el-form-item label="附件名"
        ><el-input v-model="attName" placeholder="例如：通知.docx"
      /></el-form-item>
      <el-form-item label="附件URL"
        ><el-input v-model="attUrl" placeholder="http(s)://..."
      /></el-form-item>
      <el-form-item
        ><el-button :disabled="!attName || !attUrl" @click="addAtt"
          >添加附件</el-button
        ></el-form-item
      >
      <el-form-item><el-button type="primary" @click="save">发布</el-button></el-form-item>
    </el-form>
    <el-divider />
    <el-table :data="rows"  border>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="at" label="时间" width="180" />
      <el-table-column label="附件" width="260"
        ><template #default="{ row }">
          <span v-if="!(row.attachments || []).length">-</span>
          <span v-else>
            <a
              v-for="a in row.attachments"
              :key="a.id"
              :href="a.url"
              target="_blank"
              style="margin-right: 8px"
              >{{ a.name }}</a
            >
          </span>
        </template></el-table-column
      >
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { api } from '../services/api';
const form = reactive({ title: '', content: '' });
const rows = ref<any[]>([]);
const attName = ref('');
const attUrl = ref('');
const lastId = ref<string | undefined>(undefined);
async function load() {
  const res = await api.sysAnnouncements();
  rows.value = res.items;
}
async function addAtt() {
  if (!lastId.value) {
    alert('请先发布公告，再添加附件');
    return;
  }
  await api.sysAnnouncementAttach(lastId.value, { name: attName.value, url: attUrl.value });
  attName.value = '';
  attUrl.value = '';
  await load();
}
async function save() {
  if (!form.title) return;
  const a = await api.sysAnnouncementCreate(form as any);
  lastId.value = a.id;
  form.title = '';
  form.content = '';
  await load();
}
load();
</script>
