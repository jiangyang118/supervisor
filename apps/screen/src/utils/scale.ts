export function useBaseScale(baseWidth = 1920, baseHeight = 1080) {
  function apply() {
    const el = document.documentElement
    const scaleX = window.innerWidth / baseWidth
    const scaleY = window.innerHeight / baseHeight
    const scale = Math.min(scaleX, scaleY)
    el.style.setProperty('--scale', String(scale))
  }
  apply()
  window.addEventListener('resize', apply)
  return () => window.removeEventListener('resize', apply)
}
