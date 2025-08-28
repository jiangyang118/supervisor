<template>
  <el-card class="cfg-card">
    <template #header
      ><div style="display: flex; align-items: center; justify-content: space-between">
        <span>检查配置</span>
      </div></template
    >
    <el-row :gutter="12">
      <el-col :span="8"
        ><el-card class="cfg-box"
          ><template #header>检查内容</template>
          <div class="cfg-list">
            <el-tag
              v-for="it in cfg.items"
              :key="it"
              closable
              style="margin: 4px"
              @close="removeItem(it)"
              >{{ it }}</el-tag
            >
          </div>
          <div style="margin-top: 8px">
            <el-input
              v-model="itemText"
              placeholder="新增项"
              style="width: 200px; margin-right: 8px"
            /><el-button @click="addItem">添加</el-button>
          </div>
        </el-card></el-col
      >
      <el-col :span="8"
        ><el-card class="cfg-box"
          ><template #header>处罚类型</template>
          <div class="cfg-list">
            <el-tag
              v-for="it in cfg.penalties"
              :key="it"
              closable
              style="margin: 4px"
              @close="removePenalty(it)"
              >{{ it }}</el-tag
            >
          </div>
          <div style="margin-top: 8px">
            <el-input
              v-model="penText"
              placeholder="新增类型"
              style="width: 200px; margin-right: 8px"
            /><el-button @click="addPenalty">添加</el-button>
          </div>
        </el-card></el-col
      >
      <el-col :span="8"
        ><el-card class="cfg-box"
          ><template #header>检查公示</template>
          <div class="cfg-list">
            <el-tag
              v-for="it in cfg.publications"
              :key="it"
              closable
              style="margin: 4px"
              @close="removePublication(it)"
              >{{ it }}</el-tag
            >
          </div>
          <div style="margin-top: 8px">
            <el-input
              v-model="pubText"
              placeholder="新增公示"
              style="width: 200px; margin-right: 8px"
            /><el-button @click="addPublication">添加</el-button>
          </div>
        </el-card></el-col
      >
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
const cfg = ref<{ items: string[]; penalties: string[]; publications: string[] }>({
  items: [],
  penalties: [],
  publications: [],
});
const itemText = ref('');
const penText = ref('');
const pubText = ref('');
async function load() {
  cfg.value = await api.inspConfig();
}
async function addItem() {
  const t = itemText.value.trim();
  if (!t) return;
  await api.inspConfigAddItem(t);
  itemText.value = '';
  await load();
}
async function removeItem(t: string) {
  await api.inspConfigRemoveItem(t);
  await load();
}
async function addPenalty() {
  const t = penText.value.trim();
  if (!t) return;
  await api.inspConfigAddPenalty(t);
  penText.value = '';
  await load();
}
async function removePenalty(t: string) {
  await api.inspConfigRemovePenalty(t);
  await load();
}
async function addPublication() {
  const t = pubText.value.trim();
  if (!t) return;
  await api.inspConfigAddPublication(t);
  pubText.value = '';
  await load();
}
async function removePublication(t: string) {
  await api.inspConfigRemovePublication(t);
  await load();
}
onMounted(load);
</script>

<style>
.cfg-card {
  min-height: 420px;
}
.cfg-box {
  height: 320px;
  display: flex;
  flex-direction: column;
}
.cfg-box .el-card__body {
  overflow: auto;
  flex: 1 1 auto;
}
.cfg-list {
  display: flex;
  flex-wrap: wrap;
}
</style>
