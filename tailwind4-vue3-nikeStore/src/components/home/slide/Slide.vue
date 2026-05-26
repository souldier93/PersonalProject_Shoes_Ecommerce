<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const slides = [
  { src: '/assets/img/nikeHomeslide2.jpg', alt: 'PTT Style new season collection' },
  { src: '/assets/img/nikeSlide3.jpg', alt: 'PTT Style performance shoes' },
]
const videoSrc = '/assets/video/videoplayback.mp4'

const currentSlide = ref(0)
const showVideo = ref(false)
const isPlaying = ref(false)
const videoRef = ref(null)
let intervalId = null

const stopAutoPlay = () => {
  if (!intervalId) return
  window.clearInterval(intervalId)
  intervalId = null
}

const startAutoPlay = () => {
  stopAutoPlay()
  intervalId = window.setInterval(() => {
    showVideo.value = false
    isPlaying.value = false
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 5000)
}

const nextSlide = () => {
  showVideo.value = false
  isPlaying.value = false
  currentSlide.value = (currentSlide.value + 1) % slides.length
  startAutoPlay()
}

const prevSlide = () => {
  showVideo.value = false
  isPlaying.value = false
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length
  startAutoPlay()
}

const selectSlide = (index) => {
  showVideo.value = false
  isPlaying.value = false
  currentSlide.value = index
  startAutoPlay()
}

const shopFeatured = () => {
  router.push({ path: '/products', query: { sort: 'featured' } })
}

const showVideoSlide = async () => {
  showVideo.value = true
  stopAutoPlay()
  await nextTick()
  try {
    await videoRef.value?.play()
    isPlaying.value = true
  } catch (error) {
    console.error('Video play error:', error)
  }
}

const toggleVideo = async () => {
  const video = videoRef.value
  if (!video) return

  if (isPlaying.value) {
    video.pause()
    isPlaying.value = false
    return
  }

  try {
    await video.play()
    isPlaying.value = true
  } catch (error) {
    console.error('Video play error:', error)
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <section class="relative h-[80vh] min-h-[520px] w-full overflow-hidden bg-black">
    <video
      v-if="showVideo"
      ref="videoRef"
      :src="videoSrc"
      poster="/assets/img/nikeHomeslide2.jpg"
      preload="none"
      autoplay
      muted
      loop
      playsinline
      class="h-full w-full object-cover"
    ></video>

    <img
      v-else-if="currentSlide === 0"
      :src="slides[0].src"
      :alt="slides[0].alt"
      loading="eager"
      fetchpriority="high"
      decoding="async"
      class="h-full w-full object-cover"
    />

    <img
      v-else
      :src="slides[currentSlide].src"
      :alt="slides[currentSlide].alt"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover"
    />

    <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/25 px-5 text-center text-white">
      <h1 class="text-4xl font-extrabold drop-shadow-md sm:text-5xl md:text-6xl">
        GAME-ELEVATING GIFTS
      </h1>
      <p class="mt-3 text-lg drop-shadow-sm md:text-xl">
        Gear for athletes who rise when temps drop.
      </p>
      <div class="mt-6 flex space-x-4">
        <button
          type="button"
          @click="shopFeatured"
          class="rounded-full bg-white px-6 py-2 font-bold text-black transition hover:bg-gray-200"
        >
          Shop
        </button>
        <button
          type="button"
          @click="showVideoSlide"
          class="flex items-center rounded-full bg-white px-6 py-2 font-bold text-black transition hover:bg-gray-200"
        >
          Watch
          <svg class="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="absolute bottom-6 right-5 z-30 flex items-center space-x-3 sm:right-10">
      <button
        v-if="showVideo"
        type="button"
        @click="toggleVideo"
        :aria-label="isPlaying ? 'Pause video' : 'Play video'"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow transition hover:bg-gray-200"
      >
        <svg v-if="isPlaying" class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
        </svg>
        <svg v-else class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <button
        type="button"
        @click="nextSlide"
        aria-label="Next slide"
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow transition hover:bg-gray-200"
      >
        <svg class="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <button
      type="button"
      @click="prevSlide"
      aria-label="Previous slide"
      class="absolute bottom-6 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow transition hover:bg-gray-200 sm:left-10"
    >
      <svg class="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>

    <div class="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 space-x-2">
      <button
        v-for="(_, index) in slides"
        :key="`dot-${index}`"
        type="button"
        @click="selectSlide(index)"
        :aria-label="`Show slide ${index + 1}`"
        class="h-2 rounded-full transition-all"
        :class="index === currentSlide && !showVideo ? 'w-6 bg-white' : 'w-2 bg-white/50'"
      ></button>
    </div>
  </section>
</template>
