<template>
  <div class="w-full max-w-7xl mx-auto px-4 py-8 mt-16">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-semibold">Colour of the Season: Burgundy Brown</h2>
      <div class="flex items-center gap-4">
        <button class="text-sm font-medium hover:underline">Shop</button>
        <div class="flex gap-2">
          <button 
            @click="scrollLeft"
            class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            @click="scrollRight"
            class="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
          >
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Products Carousel -->
    <div class="relative overflow-hidden">
      <div 
        ref="carousel"
        class="flex gap-6 overflow-x-auto scroll-smooth"
      >
        <div 
          v-for="product in products" 
          :key="product.id"
          class="flex-shrink-0 w-80"
        >
          <div class="bg-gray-100 rounded-2x mb-4 aspect-square flex items-center justify-center">
            <img 
              :src="product.image" 
              :alt="product.name"
              class="w-full h-full object-contain"
            >
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-lg">{{ product.name }}</h3>
            <p class="text-gray-600">{{ product.category }}</p>
            <p class="font-semibold">{{ formatPrice(product.price) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorOfSeason',
  data() {
    return {
      products: [
        {
          id: 1,
          name: 'Jordan NOLA',
          category: "Women's Slide",
          price: 1329000,
          image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop'
        },
        {
          id: 2,
          name: 'Nike Dunk Low',
          category: "Women's Shoes",
          price: 3829000,
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'
        },
        {
          id: 3,
          name: 'Nike ReactX Rejuven8',
          category: "Men's Shoes",
          price: 2069000,
          image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop'
        },
        {
          id: 4,
          name: 'Nike Air Max',
          category: "Women's Shoes",
          price: 3599000,
          image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop'
        },
        {
          id: 5,
          name: 'Nike Air Force 1',
          category: "Men's Shoes",
          price: 2899000,
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'
        },
        {
          id: 6,
          name: 'Nike Blazer Mid',
          category: "Women's Shoes",
          price: 3199000,
          image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop'
        },
        {
          id: 7,
          name: 'Nike Cortez',
          category: "Unisex Shoes",
          price: 2599000,
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop'
        },
        {
          id: 8,
          name: 'Air Jordan 1 Low',
          category: "Men's Shoes",
          price: 3499000,
          image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'
        },
        {
          id: 9,
          name: 'Nike Pegasus',
          category: "Running Shoes",
          price: 3699000,
          image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop'
        },
        {
          id: 10,
          name: 'Nike Vaporfly',
          category: "Running Shoes",
          price: 7299000,
          image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=400&fit=crop'
        }
      ]
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price).replace('₫', 'đ')
    },
    scrollLeft() {
      this.$refs.carousel.scrollBy({
        left: -350,
        behavior: 'smooth'
      })
    },
    scrollRight() {
      this.$refs.carousel.scrollBy({
        left: 350,
        behavior: 'smooth'
      })
    }
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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