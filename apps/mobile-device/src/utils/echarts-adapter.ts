import * as echarts from 'echarts'

export function mountEChart(el: HTMLElement, option: echarts.EChartsCoreOption) {
  const chart = echarts.init(el)
  chart.setOption(option)
  const onResize = () => chart.resize()
  window.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
    chart.dispose()
  }
}

export type { EChartsCoreOption } from 'echarts'

