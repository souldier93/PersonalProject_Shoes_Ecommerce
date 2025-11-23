<!-- MediaGridItem.vue -->
<template>
  <div
    @click="$emit('toggle')"
    :class="[
      'relative cursor-pointer rounded border-2 overflow-hidden transition-all',
      isSelected ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300 hover:border-blue-400'
    ]"
    class="aspect-square">
    
    <!-- ✅ Video Thumbnail -->
    <video v-if="isVideo" 
           :src="mediaUrl" 
           class="w-full h-full object-cover"
           muted
           @mouseenter="e => e.target.play()"
           @mouseleave="e => { e.target.pause(); e.target.currentTime = 0 }">
    </video>
    
    <!-- Image Thumbnail -->
    <img v-else 
         :src="mediaUrl" 
         loading="lazy"
         class="w-full h-full object-cover" />

    <!-- Selected Overlay -->
    <div v-if="isSelected"
         class="absolute inset-0 bg-blue-600 bg-opacity-30 flex items-center justify-center">
      <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    </div>

    <!-- Video Badge -->
    <div v-if="isVideo" 
         class="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
      ▶️ VIDEO
    </div>
  </div>
</template>

<script setup>
defineProps({
  mediaUrl: String,
  isVideo: Boolean,
  isSelected: Boolean
})

defineEmits(['toggle'])
</script>
