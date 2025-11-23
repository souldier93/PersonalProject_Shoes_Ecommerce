<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

// ✅ Sử dụng public folder cho video và ảnh
const slides = [
  { type: 'video', src: '/public/assets/video/videoplayback.mp4' },
  { type: 'image', src: '/public/assets/img/nikeHomeslide2.jpg' },
  { type: 'image', src: '/public/assets/img/nikeSlide3.jpg' }
]

// Trạng thái
const currentSlide = ref(0)
const isPlaying = ref(true)
const videoRefs = ref([])
let intervalId = null

// Helper để lấy video hiện tại
const getCurrentVideo = () => {
  if (slides[currentSlide.value].type !== 'video') return null
  return videoRefs.value[currentSlide.value]
}

// Chuyển slide tự động
const nextSlide = async () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
  
  // ✅ Đợi DOM update xong
  await nextTick()
  
  // ✅ Tự động play video khi về slide video
  const video = getCurrentVideo()
  if (video) {
    video.play().catch(err => console.log('Video play error:', err))
    isPlaying.value = true
  }
}

const prevSlide = async () => {
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length
  
  await nextTick()
  
  const video = getCurrentVideo()
  if (video) {
    video.play().catch(err => console.log('Video play error:', err))
    isPlaying.value = true
  }
}

// ✅ Khởi động auto-play
const startAutoPlay = () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(nextSlide, 5000)
}

// ✅ Dừng auto-play
const stopAutoPlay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Tự động đổi slide sau 5 giây
onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})

// Dừng / phát video
const toggleVideo = () => {
  const video = getCurrentVideo()
  if (!video) return

  if (isPlaying.value) {
    video.pause()
    stopAutoPlay()
  } else {
    video.play().catch(err => console.log('Video play error:', err))
    startAutoPlay()
  }
  isPlaying.value = !isPlaying.value
}

// ✅ Watch để handle khi chuyển slide
watch(currentSlide, (newVal) => {
  // Nếu không phải slide video, restart auto-play
  if (slides[newVal].type !== 'video') {
    if (!intervalId) {
      startAutoPlay()
    }
  }
})
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">

    <!-- Slider -->
    <div class="relative w-full h-[80vh] overflow-hidden bg-black">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'"
      >
        <!-- Video -->
        <video
          v-if="slide.type === 'video'"
          :ref="el => { if (el) videoRefs[index] = el }"
          :src="slide.src"
          autoplay
          muted
          loop
          playsinline
          class="w-full h-full object-cover"
          @loadeddata="() => console.log('Video loaded')"
          @error="(e) => console.error('Video error:', e)"
        ></video>

        <!-- Image -->
        <img
          v-else
          :src="slide.src"
          :alt="`Nike Slide ${index + 1}`"
          class="w-full h-full object-cover"
          @error="(e) => console.error('Image error:', e)"
        />
      </div>

      <!-- Overlay nội dung -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/25 z-20"
      >
        <h1 class="text-5xl md:text-6xl font-extrabold drop-shadow-md">
          GAME-ELEVATING GIFTS
        </h1>
        <p class="mt-3 text-lg md:text-xl drop-shadow-sm">
          Gear for athletes who rise when temps drop.
        </p>
        <div class="flex space-x-4 mt-6">
          <button
            class="bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-gray-200 transition"
          >
            Shop
          </button>
          <button
            class="bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-gray-200 transition flex items-center"
          >
            Watch <span class="ml-2">▶</span>
          </button>
        </div>
      </div>

      <!-- Nút điều khiển -->
      <div class="absolute bottom-6 right-10 flex items-center space-x-3 z-30">
        <!-- Nút dừng/phát video (chỉ hiện khi ở slide video) -->
        <button
          v-if="slides[currentSlide].type === 'video'"
          @click="toggleVideo"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-200 transition"
        >
          <span v-if="isPlaying" class="text-lg font-bold text-gray-700">❚❚</span>
          <span v-else class="text-lg font-bold text-gray-700">▶</span>
        </button>

        <!-- Nút next -->
        <button
          @click="nextSlide"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-200 transition"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Nút prev -->
      <div class="absolute bottom-6 left-10 z-30">
        <button
          @click="prevSlide"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-200 transition"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <!-- Indicator dots -->
      <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        <button
          v-for="(slide, index) in slides"
          :key="`dot-${index}`"
          @click="currentSlide = index"
          class="w-2 h-2 rounded-full transition-all"
          :class="index === currentSlide ? 'bg-white w-6' : 'bg-white/50'"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}
</style>