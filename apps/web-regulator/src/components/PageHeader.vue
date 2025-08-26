<template>
  <div class="page-header">
    <div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(c, idx) in crumbs" :key="idx">{{ c }}</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="page-title">{{ title }}</div>
    </div>
    <div><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { titleForRoute, crumbsForRoute } from '../utils/titles';
const route = useRoute();
const title = computed(() => titleForRoute(route));
const crumbs = computed(() => crumbsForRoute(route));
</script>
