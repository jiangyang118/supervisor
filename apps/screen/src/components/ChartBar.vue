<template>
  <div ref="el" style="height: 220px; width: 100%"></div>
  <div class="legend" v-if="legend?.length">
    <span v-for="l in legend" :key="l" class="tag">{{ l }}</span>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import theme from '../echarts/theme-dark'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
echarts.registerTheme('shian-dark', theme as any)

const props = defineProps<{ x: string[]; series: { name: string; data: number[] }[]; legend?: string[] }>()

const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!el.value) return
  chart ??= echarts.init(el.value, 'shian-dark')
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'category', data: props.x },
    yAxis: { type: 'value' },
    series: props.series.map(s => ({
      type: 'bar', name: s.name, data: s.data, barWidth: 12,
      itemStyle: { borderRadius: [4,4,0,0] }
    }))
  })
}

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
  chart?.dispose()
})
watch(() => [props.x, props.series], render, { deep: true })
</script>
