<template>
  <div class="w-full max-w-7xl mx-auto px-4 py-8 mt-16">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-semibold">All shoes</h2>
      <div class="flex items-center gap-4">
        <button class="text-sm font-medium hover:underline">Shop</button>
        <div class="flex gap-2">
          <button @click="scrollLeft"
            class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button @click="scrollRight"
            class="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center hover:bg-blue-50 transition">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Products Carousel -->
    <div class="relative overflow-hidden">
      <div ref="carousel" class="flex gap-6 overflow-x-auto scroll-smooth">
        <div v-for="product in products" :key="product.id" @click="goToDetail(product)"
          class="cursor-pointer flex-shrink-0 w-80">

          <div class="bg-gray-100 rounded-2x mb-4 aspect-square flex items-center justify-center">
            <img :src="product.image" :alt="product.name" class="w-full h-full object-contain">
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
import axios from "axios";

export default {
  name: 'ColorOfSeason',
  data() {
    return {
      products: []   // <-- Không fix cứng nữa
    }
  },

  async mounted() {
    try {
      const res = await axios.get("http://localhost:3000/shoes");

// ✅ ĐÚNG - chỉ dùng thumbnail
this.products = res.data.map(item => ({
  id: item.productId,
  name: item.name,
  category: item.category,
  price: item.price,
  image: item.thumbnail || "https://via.placeholder.com/400"
}));

    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    }
  }
  ,

  methods: {
     goToDetail(product) {
    this.$router.push(`/shoes/${product.id}`);
  },
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