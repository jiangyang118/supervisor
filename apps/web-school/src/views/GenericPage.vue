<template>
  <PageStub :title="title" :actions="actions" :main-col="mainCol" />
  
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import PageStub from '../components/PageStub.vue';

const route = useRoute();
const title = (route.meta.title as string) || '页面';
const mainCol = (route.meta.mainCol as string) || '名称';
const actions = (route.meta.actions as string[]) || ['export-csv','export-pdf'];
</script>

