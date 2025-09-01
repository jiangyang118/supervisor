<script setup lang="ts">
defineOptions({ name: 'Card' })

type Props = {
  title?: string
  colors?: string[]
  bg?: string
  titleWidth?: number | string
}
const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#019CFF', '#004A9E'],
  bg: '#001B3D',
  titleWidth: 200,
})
</script>

<template>
  <dv-border-box-11
    class="dv-card"
    :title="props.title || ''"
    :color="props.colors"
    :background-color="props.bg"
    :backgroundColor="props.bg"
    :title-width="props.titleWidth"
    :titleWidth="props.titleWidth"
  >
    <div class="card-inner">
      <slot />
    </div>
  </dv-border-box-11>
  
</template>
<style lang="less" scoped>
.card-inner{
  width: 90%;
  overflow: hidden;
}
</style>
