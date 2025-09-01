<template>
  <div ref="el" style="height: 220px; width: 100%"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import theme from '../echarts/theme-dark'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])
echarts.registerTheme('shian-dark', theme as any)

const props = defineProps<{ data: { name: string; value: number }[] }>()

const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!el.value) return
  chart ??= echarts.init(el.value, 'shian-dark')
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#061423', borderWidth: 2 },
      label: { color: '#E8F1FF' },
      data: props.data
    }]
  })
}

onMounted(() => { render(); window.addEventListener('resize', render) })
onBeforeUnmount(() => { window.removeEventListener('resize', render); chart?.dispose() })
watch(() => props.data, render, { deep: true })
</script>
