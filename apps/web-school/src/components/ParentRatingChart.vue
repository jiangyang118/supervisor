<template>
  <v-chart :option="option" autoresize style="height: 240px; width: 100%" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([BarChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const props = defineProps<{ dist: Record<number, number> }>();
const option = computed(() => {
  const labels = ['5星', '4星', '3星', '2星', '1星'];
  const data = [5, 4, 3, 2, 1].map((k) => props.dist[k] || 0);
  return {
    grid: { left: 40, right: 20, top: 10, bottom: 20 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: labels },
    series: [{ type: 'bar', data, itemStyle: { color: '#67C23A' }, barWidth: 16 }],
  };
});

const vChart = VChart;
</script>
