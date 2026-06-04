<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  minHeight: {
    type: String,
    default: '320px',
  },
  rootMargin: {
    type: String,
    default: '320px 0px',
  },
  eager: {
    type: Boolean,
    default: false,
  },
})

const containerRef = ref(null)
const shouldRender = ref(props.eager)
let observer = null

const placeholderStyle = computed(() => ({
  minHeight: shouldRender.value ? undefined : props.minHeight,
}))

onMounted(() => {
  if (props.eager) {
    shouldRender.value = true
    return
  }

  if (!('IntersectionObserver' in window)) {
    shouldRender.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      shouldRender.value = true
      observer.disconnect()
    },
    { rootMargin: props.rootMargin },
  )

  observer.observe(containerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

watch(
  () => props.eager,
  (eager) => {
    if (!eager) return
    shouldRender.value = true
    observer?.disconnect()
    observer = null
  },
)
</script>

<template>
  <div ref="containerRef" :style="placeholderStyle">
    <slot v-if="shouldRender" />
  </div>
</template>
