<template>
  <div class="mt-10 min-h-screen bg-gray-50 px-4 py-6 sm:mt-16 sm:py-8">
    <div class="mx-auto max-w-6xl">
      <div class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Saved pieces</p>
          <h1 class="text-2xl font-bold sm:text-3xl">Wishlist</h1>
          <p v-if="!loading" class="mt-1 text-sm text-gray-500">
            {{ normalizedItems.length }} {{ normalizedItems.length === 1 ? 'item' : 'items' }} saved
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            @click="fetchWishlist"
            class="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition hover:border-black"
          >
            Refresh
          </button>
          <router-link to="/products" class="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
            Continue Shopping
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="index in 6" :key="index" class="overflow-hidden rounded-lg bg-white shadow-sm">
          <div class="aspect-square animate-pulse bg-gray-100"></div>
          <div class="space-y-3 p-5">
            <div class="h-5 w-3/4 animate-pulse rounded bg-gray-100"></div>
            <div class="h-4 w-1/2 animate-pulse rounded bg-gray-100"></div>
            <div class="h-10 animate-pulse rounded-full bg-gray-100"></div>
          </div>
        </div>
      </div>

      <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 class="text-lg font-semibold text-red-700">Could not load wishlist</h2>
        <p class="mt-2 text-sm text-red-600">{{ errorMessage }}</p>
        <button
          type="button"
          @click="fetchWishlist"
          class="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>

      <div v-else-if="normalizedItems.length === 0" class="rounded-lg bg-white p-12 text-center shadow-sm">
        <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg class="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-semibold">Your wishlist is empty</h2>
        <p class="mx-auto max-w-md text-gray-500">Save shoes, apparel, and accessories you like, then come back when you are ready to buy.</p>
        <router-link to="/products" class="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
          Explore Products
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="item in normalizedItems" :key="item.id" class="overflow-hidden rounded-lg bg-white shadow-sm">
          <button type="button" @click="goToProduct(item.productId)" class="block aspect-square w-full bg-gray-100">
            <img
              :src="item.thumbnail || fallbackImage"
              :alt="item.name"
              class="h-full w-full object-contain"
              @error="handleImageError"
            />
          </button>

          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="truncate text-lg font-semibold text-gray-900">{{ item.name }}</h3>
                <p class="text-sm text-gray-500">{{ item.category || item.productType || 'Fashion item' }}</p>
              </div>
              <button
                type="button"
                @click="removeItem(item)"
                :disabled="removingIds.has(item.id)"
                class="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove from wishlist"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="mt-4 space-y-1 text-sm text-gray-600">
              <p v-if="item.colorName">Color: <span class="font-medium text-gray-900">{{ item.colorName }}</span></p>
              <p v-if="item.size">Size: <span class="font-medium text-gray-900">{{ item.size }}</span></p>
              <p v-else class="text-gray-500">Choose a size on the product page before moving to bag.</p>
              <p class="pt-1 text-base font-semibold text-gray-900">{{ formatPrice(item.price) }}</p>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="statusClass(item)">
                {{ statusLabel(item) }}
              </span>
              <button
                type="button"
                @click="goToProduct(item.productId)"
                class="text-sm font-medium underline"
              >
                View Details
              </button>
            </div>

            <button
              type="button"
              @click="moveToBag(item)"
              :disabled="!item.canMoveToBag || movingIds.has(item.id)"
              class="mt-4 w-full rounded-full py-3 text-sm font-semibold transition"
              :class="item.canMoveToBag ? 'bg-black text-white hover:bg-gray-800' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
            >
              {{ moveButtonLabel(item) }}
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="feedbackMessage"
        class="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg bg-gray-950 px-5 py-4 text-sm font-medium text-white shadow-2xl"
      >
        {{ feedbackMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { addToBag as addToBagHelper } from '../../utils/bagHelper'
import { API_BASE } from '../../utils/apiBase'
import {
  createBagItemFromWishlist,
  emitWishlistUpdated,
  normalizeWishlistItem,
} from '../../utils/wishlist'

const fallbackImage = 'https://placehold.co/500x500/f3f4f6/9ca3af?text=PTT+Style'

const router = useRouter()
const loading = ref(true)
const items = ref([])
const errorMessage = ref('')
const feedbackMessage = ref('')
const removingIds = ref(new Set())
const movingIds = ref(new Set())
let feedbackTimer = null

const normalizedItems = computed(() => items.value.map(normalizeWishlistItem))

onMounted(async () => {
  const user = getCurrentUser()
  if (!user?._id) {
    localStorage.setItem('redirectAfterLogin', '/wishlist')
    router.push('/login')
    return
  }

  await fetchWishlist()
})

async function fetchWishlist() {
  loading.value = true
  errorMessage.value = ''
  try {
    const user = getCurrentUser()
    if (!user?._id) {
      router.push('/login')
      return
    }

    const response = await axios.get(`${API_BASE}/wishlist/user/${user._id}`, {
      headers: getAuthHeaders(),
    })
    items.value = response.data.items || []
  } catch (error) {
    console.error('Failed to load wishlist:', error)
    errorMessage.value = error.response?.data?.message || 'Please refresh the page or sign in again.'
  } finally {
    loading.value = false
  }
}

async function removeItem(item) {
  if (!item.id || removingIds.value.has(item.id)) return

  removingIds.value = new Set([...removingIds.value, item.id])
  try {
    await axios.delete(`${API_BASE}/wishlist/${item.id}`, {
      headers: getAuthHeaders(),
    })
    items.value = items.value.filter(current => normalizeWishlistItem(current).id !== item.id)
    emitWishlistUpdated()
    showFeedback('Removed from wishlist')
  } catch (error) {
    console.error('Failed to remove wishlist item:', error)
    showFeedback(error.response?.data?.message || 'Could not remove item. Please try again.')
  } finally {
    const next = new Set(removingIds.value)
    next.delete(item.id)
    removingIds.value = next
  }
}

async function moveToBag(item) {
  if (movingIds.value.has(item.id)) return

  const bagItem = createBagItemFromWishlist(item)
  if (!bagItem) {
    goToProduct(item.productId)
    return
  }

  movingIds.value = new Set([...movingIds.value, item.id])
  try {
    addToBagHelper(bagItem)
    await removeItem(item)
    showFeedback('Moved to bag')
  } finally {
    const next = new Set(movingIds.value)
    next.delete(item.id)
    movingIds.value = next
  }
}

function goToProduct(productId) {
  router.push(`/shoes/${productId}`)
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleImageError(event) {
  event.target.src = fallbackImage
}

function statusLabel(item) {
  if (item.canMoveToBag) return 'Ready to move'
  if (item.size && !item.isAvailable) return 'Restock alert'
  return 'Saved'
}

function statusClass(item) {
  if (item.canMoveToBag) return 'bg-green-100 text-green-700'
  if (item.size && !item.isAvailable) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-700'
}

function moveButtonLabel(item) {
  if (movingIds.value.has(item.id)) return 'Moving...'
  if (item.canMoveToBag) return 'Move to Bag'
  if (!item.size) return 'Choose Size'
  return 'Out of Stock'
}

function showFeedback(message) {
  feedbackMessage.value = message
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackMessage.value = ''
  }, 2800)
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0).replace('₫', 'đ')
}
</script>
