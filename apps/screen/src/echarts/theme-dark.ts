export default {
  darkMode: true,
  color: ['#11C5FF', '#2AA7FF', '#7C5CFF', '#19D27C', '#FFB020', '#FF4D4F'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#A8C3E6'
  },
  title: {
    textStyle: { color: '#E8F1FF' },
    subtextStyle: { color: '#A8C3E6' }
  },
  legend: {
    textStyle: { color: '#A8C3E6' }
  },
  tooltip: {
    backgroundColor: 'rgba(10,30,51,.95)',
    borderColor: '#0F2A46',
    textStyle: { color: '#E8F1FF' }
  },
  grid: {
    left: 24,
    right: 12,
    top: 24,
    bottom: 24
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#0F2A46' } },
    axisLabel: { color: '#A8C3E6' },
    splitLine: { lineStyle: { color: '#0F2A46' } }
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#0F2A46' } },
    axisLabel: { color: '#A8C3E6' },
    splitLine: { show: false }
  }
} as const

