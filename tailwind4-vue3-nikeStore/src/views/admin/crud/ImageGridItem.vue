<template>
  <div
    @click="$emit('toggle')"
    :class="isSelected ? 'ring-2 ring-blue-600' : ''"
    class="cursor-pointer hover:opacity-90 transition-opacity">
    <img :src="imageUrl" loading="lazy" class="w-full h-20 object-cover rounded border" :alt="imageUrl" />
  </div>
</template>

<script setup>
defineProps({
  imageUrl: String,
  isSelected: Boolean
})

defineEmits(['toggle'])
</script>
