<template>
  <div ref="el" class="chart"></div>
</template>
<script setup lang="ts">
import * as echarts from 'echarts/core'
import { PieChart as EPie } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
echarts.use([EPie, TooltipComponent, LegendComponent, CanvasRenderer])
const props = defineProps<{ data: Array<{ name: string; value: number }> }>()
const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption({
    color: ['#11C5FF', '#10D6C6', '#8B5CF6', '#F6BE00'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#cde7ff' } },
    series: [{ type: 'pie', radius: ['35%','65%'], data: props.data }],
  })
}
onMounted(render); onBeforeUnmount(()=>chart?.dispose())
watch(() => props.data, render, { deep: true })
</script>
<style scoped>
.chart { width: 100%; height: 200px; }
</style>
