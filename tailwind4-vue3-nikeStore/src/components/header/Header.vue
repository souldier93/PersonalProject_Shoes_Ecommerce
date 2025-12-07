<script setup>
import './Header.css'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const bagCount = ref(0)
const showMiniCart = ref(false)
const lastAddedItem = ref(null)
const showProfileMenu = ref(false)
const profileRef = ref(null)

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('user')
})

// Get current user info
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
})

const goToLogin = () => {
  router.push('/login')
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleLogout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  showProfileMenu.value = false
  router.push('/')
  // Reload trang để cập nhật UI
  window.location.reload()
}

// Tính tổng số sản phẩm trong bag
const updateBagCount = () => {
  const saved = localStorage.getItem('shoppingBag')
  const bag = saved ? JSON.parse(saved) : []
  bagCount.value = bag.reduce((sum, item) => sum + item.quantity, 0)
}

// Hiển thị mini cart khi có sản phẩm mới
const handleBagAdded = (event) => {
  updateBagCount()
  
  // Lấy thông tin sản phẩm vừa thêm
  const saved = localStorage.getItem('shoppingBag')
  const bag = saved ? JSON.parse(saved) : []
  lastAddedItem.value = bag[bag.length - 1]
  
  showMiniCart.value = true
  
  // Tự động đóng sau 5 giây
  setTimeout(() => {
    showMiniCart.value = false
  }, 5000)
}

const closeMiniCart = () => {
  showMiniCart.value = false
}

const goToBag = () => {
  showMiniCart.value = false
  router.push('/bag')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price).replace('₫', 'đ')
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    showProfileMenu.value = false
  }
}

// Cập nhật khi component mount
onMounted(() => {
  updateBagCount()
  
  // Lắng nghe sự kiện storage để cập nhật real-time
  window.addEventListener('storage', updateBagCount)
  window.addEventListener('bagUpdated', handleBagAdded)
  document.addEventListener('click', handleClickOutside)
})

// Cleanup khi component bị destroy
onBeforeUnmount(() => {
  window.removeEventListener('storage', updateBagCount)
  window.removeEventListener('bagUpdated', handleBagAdded)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav class="flex items-center justify-between px-10 py-4 bg-white shadow-sm fixed top-0 left-0 w-full z-50">
    <div class="flex items-center space-x-4">
      <router-link to="/">
        <img src="/public/assets/img/Logo_NIKE.svg.png" alt="Nike"
          class="w-10 cursor-pointer hover:opacity-80 transition" />
      </router-link>
      <ul class="hidden md:flex space-x-8 font-semibold text-gray-900">
        <li><a href="#" class="hover:text-gray-600">New & Featured</a></li>
        <li><a href="#" class="hover:text-gray-600">Men</a></li>
        <li><a href="#" class="hover:text-gray-600">Women</a></li>
        <li><a href="#" class="hover:text-gray-600">Kids</a></li>
        <li><a href="#" class="hover:text-gray-600">Sale</a></li>
      </ul>
    </div>

    <div class="flex items-center space-x-6">
      <div class="flex items-center bg-gray-100 rounded-full px-4 py-1.5 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
        </svg>
        <span class="ml-2 text-sm font-medium text-gray-600">Search</span>
      </div>

      <!-- Heart -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-6 h-6 hover:scale-110 transition cursor-pointer">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>

      <!-- Bag with Badge -->
      <div class="relative">
        <router-link to="/bag" class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6 hover:scale-110 transition">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          
          <!-- Badge số lượng -->
          <span v-if="bagCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {{ bagCount }}
          </span>
        </router-link>

        <!-- Mini Cart Dropdown -->
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div v-if="showMiniCart && lastAddedItem" 
               class="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <h3 class="font-semibold text-lg">Added to Bag</h3>
              </div>
              <button @click="closeMiniCart" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Product Info -->
            <div class="flex gap-4 mb-4">
              <img :src="lastAddedItem.thumbnail || lastAddedItem.image" 
                   :alt="lastAddedItem.name"
                   class="w-24 h-24 object-cover rounded-md" />
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ lastAddedItem.name }}</h4>
                <p class="text-sm text-gray-600 mb-1">{{ lastAddedItem.colorName }}</p>
                <p class="text-sm text-gray-600 mb-2">Size {{ lastAddedItem.size }}</p>
                <p class="font-semibold">{{ formatPrice(lastAddedItem.price) }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="space-y-2">
              <button @click="goToBag"
                      class="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition">
                View Bag ({{ bagCount }})
              </button>
              <button @click="closeMiniCart"
                      class="w-full border border-gray-300 py-3 rounded-full font-medium hover:bg-gray-50 transition">
                Continue Shopping
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- User Profile / Login Button -->
      <div v-if="isLoggedIn" class="relative" ref="profileRef">
        <button @click="toggleProfileMenu" 
                class="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition">
          <span class="text-sm font-medium">{{ currentUser.username || currentUser.email }}</span>
          <svg class="w-4 h-4 transition-transform" :class="showProfileMenu ? 'rotate-180' : ''" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div v-if="showProfileMenu" 
               class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">{{ currentUser.username }}</p>
              <p class="text-xs text-gray-500">{{ currentUser.email }}</p>
            </div>

            <div class="py-2">
              <button class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </button>

              <button class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Orders</span>
              </button>

              <button class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </div>

            <div class="border-t border-gray-100 py-2">
              <button @click="handleLogout" 
                      class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Nút Login (chỉ hiện khi chưa đăng nhập) -->
      <button v-else @click="goToLogin" 
              class="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition">
        Login
      </button>
    </div>
  </nav>

  <div class="text-center py-3 bg-gray-100 text-sm mt-[64px]">
    Free Standard Delivery & 30-Day Free Returns ·
    <a href="#" class="underline">Join Now</a>
  </div>
</template>