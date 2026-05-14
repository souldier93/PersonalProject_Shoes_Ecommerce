<script setup>
import './Header.css'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { clearTransientCheckout, getBag } from '../../utils/bagStorage'

const router = useRouter()
const bagCount = ref(0)
const showMiniCart = ref(false)
const lastAddedItem = ref(null)
const showProfileMenu = ref(false)
const showMobileMenu = ref(false)
const profileRef = ref(null)
let miniCartTimeout = null

const navItems = ['New & Featured', 'Men', 'Women', 'Kids', 'Sale']

const isLoggedIn = computed(() => !!localStorage.getItem('user'))

const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const isAdmin = computed(() => currentUser.value?.role === 'admin')

const closeMenus = () => {
  showMobileMenu.value = false
  showProfileMenu.value = false
}

const goToLogin = () => {
  closeMenus()
  router.push('/login')
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const goToMyOrders = () => {
  closeMenus()
  router.push('/my-orders')
}

const goToProfile = () => {
  closeMenus()
  router.push('/profile')
}

const goToAdmin = () => {
  closeMenus()
  router.push('/admin/dashboard')
}

const handleLogout = () => {
  clearTransientCheckout()
  localStorage.removeItem('user')
  localStorage.removeItem('authToken')
  localStorage.removeItem('accessToken')
  closeMenus()
  router.push('/')
  window.location.reload()
}

const updateBagCount = () => {
  const bag = getBag()
  bagCount.value = bag.reduce((sum, item) => sum + item.quantity, 0)
}

const handleBagAdded = () => {
  updateBagCount()
  const bag = getBag()
  lastAddedItem.value = bag[bag.length - 1] || null
  if (!lastAddedItem.value) return

  showMiniCart.value = true
  if (miniCartTimeout) clearTimeout(miniCartTimeout)
  miniCartTimeout = setTimeout(() => {
    showMiniCart.value = false
  }, 5000)
}

const handleBagCountUpdated = () => {
  updateBagCount()
  if (bagCount.value === 0) {
    showMiniCart.value = false
    lastAddedItem.value = null
  }
}

const closeMiniCart = () => {
  showMiniCart.value = false
}

const goToBag = () => {
  showMiniCart.value = false
  showMobileMenu.value = false
  router.push('/bag')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price).replace('₫', 'đ')
}

const handleClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  updateBagCount()
  window.addEventListener('storage', updateBagCount)
  window.addEventListener('bagUpdated', handleBagAdded)
  window.addEventListener('bagCountUpdated', handleBagCountUpdated)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateBagCount)
  window.removeEventListener('bagUpdated', handleBagAdded)
  window.removeEventListener('bagCountUpdated', handleBagCountUpdated)
  document.removeEventListener('click', handleClickOutside)
  if (miniCartTimeout) clearTimeout(miniCartTimeout)
})
</script>

<template>
  <nav class="fixed left-0 top-0 z-50 w-full bg-white shadow-sm">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
      <div class="flex min-w-0 items-center gap-3">
        <button
          @click="toggleMobileMenu"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation"
        >
          <svg v-if="!showMobileMenu" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <router-link to="/" @click="closeMenus" class="shrink-0">
          <img src="/public/assets/img/Logo_NIKE.svg.png" alt="Nike" class="w-10 cursor-pointer transition hover:opacity-80" />
        </router-link>

        <ul class="hidden items-center space-x-8 font-semibold text-gray-900 md:flex">
          <li v-for="item in navItems" :key="item">
            <a href="#" class="hover:text-gray-600">{{ item }}</a>
          </li>
        </ul>
      </div>

      <div class="flex items-center gap-2 sm:gap-4 lg:gap-6">
        <div class="hidden items-center rounded-full bg-gray-100 px-4 py-1.5 text-gray-500 sm:flex">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
          </svg>
          <span class="ml-2 text-sm font-medium text-gray-600">Search</span>
        </div>

        <router-link to="/wishlist" class="hidden transition hover:scale-110 sm:block" @click="closeMenus">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </router-link>

        <div class="relative">
          <router-link to="/bag" class="relative" @click="showMobileMenu = false">
            <svg class="h-6 w-6 transition hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            <span v-if="bagCount > 0" class="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {{ bagCount }}
            </span>
          </router-link>

          <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <div v-if="showMiniCart && lastAddedItem" class="fixed left-4 right-4 top-20 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 sm:p-6">
              <div class="mb-4 flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 class="text-lg font-semibold">Added to Bag</h3>
                </div>
                <button @click="closeMiniCart" class="text-gray-400 hover:text-gray-600" aria-label="Close mini cart">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="mb-4 flex gap-4">
                <img :src="lastAddedItem.thumbnail || lastAddedItem.image" :alt="lastAddedItem.name" class="h-24 w-24 rounded-md object-cover" />
                <div class="min-w-0 flex-1">
                  <h4 class="mb-1 truncate font-semibold">{{ lastAddedItem.name }}</h4>
                  <p class="mb-1 text-sm text-gray-600">{{ lastAddedItem.colorName }}</p>
                  <p class="mb-2 text-sm text-gray-600">Size {{ lastAddedItem.size }}</p>
                  <p class="font-semibold">{{ formatPrice(lastAddedItem.price) }}</p>
                </div>
              </div>

              <div class="space-y-2">
                <button @click="goToBag" class="w-full rounded-full bg-black py-3 font-medium text-white transition hover:bg-gray-800">
                  View Bag ({{ bagCount }})
                </button>
                <button @click="closeMiniCart" class="w-full rounded-full border border-gray-300 py-3 font-medium transition hover:bg-gray-50">
                  Continue Shopping
                </button>
              </div>
            </div>
          </transition>
        </div>

        <div v-if="isLoggedIn" class="relative" ref="profileRef">
          <button @click="toggleProfileMenu" class="flex max-w-[140px] items-center gap-2 truncate rounded-full px-3 py-2 transition hover:bg-gray-100 sm:max-w-[220px] sm:px-4">
            <span v-if="isAdmin" class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Admin</span>
            <span class="hidden truncate text-sm font-medium sm:inline">{{ currentUser.username || currentUser.email }}</span>
            <svg class="h-4 w-4 transition-transform" :class="showProfileMenu ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <div v-if="showProfileMenu" class="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-2 shadow-xl sm:w-56">
              <div class="border-b border-gray-100 px-4 py-3">
                <p class="truncate text-sm font-medium text-gray-900">{{ currentUser.username }}</p>
                <p class="truncate text-xs text-gray-500">{{ currentUser.email }}</p>
                <p v-if="isAdmin" class="mt-1 text-xs font-semibold text-purple-600">Administrator</p>
              </div>

              <div v-if="isAdmin" class="border-b border-gray-100 py-2">
                <button @click="goToAdmin" class="flex w-full items-center gap-3 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100">
                  <span>Admin Dashboard</span>
                </button>
              </div>

              <div class="py-2">
                <button @click="goToProfile" class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">My Profile</button>
                <button @click="goToMyOrders" class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">My Orders</button>
              </div>

              <div class="border-t border-gray-100 py-2">
                <button @click="handleLogout" class="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50">Logout</button>
              </div>
            </div>
          </transition>
        </div>

        <button v-else @click="goToLogin" class="rounded-full bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800">
          Login
        </button>
      </div>
    </div>
  </nav>

  <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
    <div v-if="showMobileMenu" class="fixed left-0 right-0 top-16 z-40 border-b border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden">
      <div class="flex flex-col gap-1 font-semibold text-gray-900">
        <a v-for="item in navItems" :key="item" href="#" @click="closeMenus" class="rounded-lg px-3 py-3 hover:bg-gray-100">{{ item }}</a>
        <router-link to="/wishlist" @click="closeMenus" class="rounded-lg px-3 py-3 hover:bg-gray-100">Wishlist</router-link>
      </div>
    </div>
  </transition>

  <div class="mt-16 bg-gray-100 px-4 py-3 text-center text-xs sm:text-sm">
    Free Standard Delivery & 30-Day Free Returns ·
    <a href="#" class="underline">Join Now</a>
  </div>
</template>
