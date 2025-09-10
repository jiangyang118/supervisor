<template>
  <el-card>
    
    <FilterBar />
    <WarningTable />
  </el-card>
</template>

<script setup lang="ts">
import FilterBar from '../components/alerts/FilterBar.vue';
import WarningTable from '../components/alerts/WarningTable.vue';
import { onMounted } from 'vue';
import { useWarningStore } from '../stores/warning';

const store = useWarningStore();
onMounted(() => { store.fetchList(); });
</script>

