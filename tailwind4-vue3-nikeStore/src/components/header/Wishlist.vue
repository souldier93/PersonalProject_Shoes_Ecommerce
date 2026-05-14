<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 mt-16">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">Wishlist</h1>
        <router-link to="/" class="text-sm font-medium underline">Continue Shopping</router-link>
      </div>

      <div v-if="loading" class="py-20 text-center text-gray-500">Loading wishlist...</div>

      <div v-else-if="items.length === 0" class="bg-white rounded-lg p-12 text-center">
        <h2 class="text-xl font-semibold mb-2">Your wishlist is empty</h2>
        <p class="text-gray-500">Save shoes you like and come back when you are ready.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in items" :key="item._id" class="bg-white rounded-lg overflow-hidden shadow-sm">
          <button @click="goToProduct(item.productId)" class="block w-full bg-gray-100 aspect-square">
            <img :src="item.thumbnail || fallbackImage" :alt="item.productName" class="w-full h-full object-contain" />
          </button>

          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="font-semibold text-lg">{{ item.productName }}</h3>
                <p class="text-sm text-gray-500">{{ item.category }}</p>
              </div>
              <button @click="removeItem(item._id)" class="text-gray-400 hover:text-red-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="mt-4 text-sm text-gray-600 space-y-1">
              <p v-if="item.colorName">Color: <span class="font-medium text-gray-900">{{ item.colorName }}</span></p>
              <p v-if="item.size">Size: <span class="font-medium text-gray-900">{{ item.size }}</span></p>
              <p class="font-semibold text-gray-900">{{ formatPrice(item.price) }}</p>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ item.isAvailable ? 'In stock' : 'Notify enabled' }}
              </span>
              <button @click="goToProduct(item.productId)" class="px-4 py-2 bg-black text-white rounded-full text-sm font-medium">
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'
const fallbackImage = 'https://via.placeholder.com/400'

const router = useRouter()
const loading = ref(true)
const items = ref([])

onMounted(async () => {
  const user = getCurrentUser()
  if (!user) {
    router.push('/login')
    return
  }

  await fetchWishlist()
})

async function fetchWishlist() {
  loading.value = true
  try {
    const user = getCurrentUser()
    const response = await axios.get(`${API_BASE}/wishlist/user/${user._id}`)
    items.value = response.data.items || []
  } catch (error) {
    console.error('Failed to load wishlist:', error)
  } finally {
    loading.value = false
  }
}

async function removeItem(id) {
  await axios.delete(`${API_BASE}/wishlist/${id}`)
  items.value = items.value.filter(item => item._id !== id)
}

function goToProduct(productId) {
  router.push(`/shoes/${productId}`)
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0).replace('₫', 'đ')
}
</script>
