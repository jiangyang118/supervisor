<template>
  <div class="page-header">
    <div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(c, idx) in crumbs" :key="idx">{{ c }}</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="page-title">{{ title }}</div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px">
      <el-select v-model="schoolId" size="small" style="min-width: 160px" @change="onSchoolChange">
        <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { titleForRoute, crumbsForRoute } from '../utils/titles';
import { getCurrentSchoolId, setCurrentSchoolId, getSchoolOptions } from '../utils/school';
const route = useRoute();
const title = computed(() => titleForRoute(route));
const crumbs = computed(() => crumbsForRoute(route));
const schools = getSchoolOptions();
const schoolId = ref(getCurrentSchoolId());
function onSchoolChange(val: string) {
  setCurrentSchoolId(val);
  window.dispatchEvent(new CustomEvent('school-changed', { detail: val }));
}
</script>
