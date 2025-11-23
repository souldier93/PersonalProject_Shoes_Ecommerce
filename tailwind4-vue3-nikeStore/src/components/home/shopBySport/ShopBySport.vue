<template>
  <div class="w-full max-w-7xl mx-auto px-4 py-8 mt-16">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-semibold">Shop by Sport</h2>
      <div class="flex gap-2">
        <button 
          @click="scrollLeft"
          class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button 
          @click="scrollRight"
          class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Sports Carousel -->
    <div class="relative overflow-hidden">
      <div 
        ref="carousel"
        class="flex gap-6 overflow-x-auto scroll-smooth"
      >
        <div 
          v-for="sport in sports" 
          :key="sport.id"
          class="flex-shrink-0 w-96 cursor-pointer group"
        >
          <div class="relative overflow-hidden mb-4 aspect-[4/3]">
            <img 
              :src="sport.image" 
              :alt="sport.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <h3 class="font-semibold text-xl">{{ sport.name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShopBySport',
  data() {
    return {
      sports: [
        {
          id: 1,
          name: 'Basketball',
          image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop'
        },
        {
          id: 2,
          name: 'Football',
          image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop'
        },
        {
          id: 3,
          name: 'Running',
          image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop'
        },
        {
          id: 4,
          name: 'Tennis',
          image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop'
        },
        {
          id: 5,
          name: 'Training',
          image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop'
        },
        {
          id: 6,
          name: 'Yoga',
          image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'
        },
        {
          id: 7,
          name: 'Golf',
          image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop'
        }
      ]
    }
  },
  methods: {
    scrollLeft() {
      this.$refs.carousel.scrollBy({
        left: -420,
        behavior: 'smooth'
      })
    },
    scrollRight() {
      this.$refs.carousel.scrollBy({
        left: 420,
        behavior: 'smooth'
      })
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar styling */
div[ref="carousel"]::-webkit-scrollbar {
  height: 8px;
}

div[ref="carousel"]::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
  margin: 0 20px;
}

div[ref="carousel"]::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

div[ref="carousel"]::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>