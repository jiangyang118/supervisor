<template>
  <div class="page-header">
    <div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(c, idx) in crumbs" :key="idx">{{ c }}</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="page-title">{{ title }}</div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px">
      <el-select
        v-model="schoolId"
        size="small"
        placeholder="请选择"
        style="min-width: 160px"
        @change="onSchoolChange"
      >
        <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { titleForRoute, crumbsForRoute } from '../utils/titles';
import { getCurrentSchoolId, setCurrentSchoolId } from '../utils/school';
import { api } from '../services/api';
const route = useRoute();
const title = computed(() => titleForRoute(route));
const crumbs = computed(() => crumbsForRoute(route));
const schools = ref<Array<{ id: string; name: string }>>([]);
const schoolId = ref(getCurrentSchoolId());
function onSchoolChange(val: string) {
  setCurrentSchoolId(val);
  window.dispatchEvent(new CustomEvent('school-changed', { detail: val }));
}
onMounted(async () => {
  try {
    const list = await api.regSchools();
    schools.value = Array.isArray(list) && list.length ? list : [];
    // 如果当前选择不在列表中，回退为第一个
    if (!schools.value.find((s) => s.id === schoolId.value) && schools.value.length) {
      schoolId.value = schools.value[0].id;
      onSchoolChange(schoolId.value);
    }
  } catch {
    schools.value = [];
  }
});
</script>
