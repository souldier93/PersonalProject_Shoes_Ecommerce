<template>
  <div class="max-w-7xl mx-auto p-4 lg:p-6">
    <!-- Free Delivery Banner -->
    <div class="bg-gray-100 text-center py-3 mb-6 text-sm">
      <span class="font-semibold">FREE DELIVERY</span>
      <span class="ml-2">Applies to orders of 5,000,000₫ or more.</span>
    </div>

    <!-- Empty Bag State -->
    <div v-if="bagItems.length === 0" class="text-center py-20">
      <h2 class="text-2xl font-semibold mb-2">Your Bag is Empty</h2>
      <p class="text-gray-600 mb-6">Add some products to get started!</p>
      <router-link to="/" class="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800">
        Continue Shopping
      </router-link>
    </div>

    <!-- Bag Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Bag Items -->
      <div class="lg:col-span-2">
        <h2 class="text-2xl font-semibold mb-6">Bag</h2>
        
        <div v-for="item in bagItems" :key="`${item.productId}-${item.styleCode}-${item.size}`"
          class="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div class="flex gap-4">
            <img :src="item.thumbnail || item.image" :alt="item.name"
              class="w-32 h-32 object-cover rounded-md" />
            
            <div class="flex-1">
              <h3 class="font-semibold text-lg mb-1">{{ item.name }}</h3>
              <p class="text-gray-600 text-sm mb-2">
                {{ item.colorName }}<br>
                Size {{ item.size }}
              </p>
              
              <div class="flex items-center gap-3 mt-4">
                <button @click="decreaseQty(item)" 
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100">-</button>
                <span class="w-8 text-center">{{ item.quantity }}</span>
                <button @click="increaseQty(item)"
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100">+</button>
                <button @click="removeItem(item)" class="ml-4 text-red-600 hover:text-red-800 text-sm">
                  Remove
                </button>
              </div>
            </div>
            
            <div class="font-semibold text-lg">{{ formatPrice(item.price) }}</div>
          </div>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg p-6 shadow-sm sticky top-6">
          <h2 class="text-2xl font-semibold mb-6">Summary</h2>
          
          <div class="space-y-4">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span class="font-medium">{{ formatPrice(subtotal) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span>Delivery</span>
              <span class="font-medium">{{ formatPrice(deliveryFee) }}</span>
            </div>
            
            <div class="flex justify-between pt-4 border-t font-semibold text-lg">
              <span>Total</span>
              <span>{{ formatPrice(total) }}</span>
            </div>
          </div>
          
          <!-- Checkout Buttons - Hiển thị khác nhau theo trạng thái đăng nhập -->
          <div class="mt-6 space-y-3">
            <!-- Nếu đã đăng nhập: Chỉ hiện Member Checkout -->
            <template v-if="isLoggedIn">
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-green-800">Logged in as {{ currentUser.username }}</span>
                </div>
              </div>
              
              <button @click="memberCheckout"
                class="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
                Member Checkout
              </button>
            </template>

            <!-- Nếu chưa đăng nhập: Hiện cả 2 options -->
            <template v-else>
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                <div class="flex items-start gap-3">
                  <svg class="w-6 h-6 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <div>
                    <h4 class="font-semibold text-sm mb-1">Nike Member Benefits</h4>
                    <p class="text-xs text-gray-600">Fast checkout, order tracking, and exclusive access</p>
                  </div>
                </div>
              </div>

              <button @click="memberCheckout"
                class="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
                Member Checkout
              </button>
              
              <button @click="guestCheckout"
                class="w-full border-2 border-black text-black py-4 rounded-full font-medium hover:bg-gray-100 transition-colors">
                Guest Checkout
              </button>

              <p class="text-xs text-center text-gray-500 mt-2">
                Don't have an account? 
                <button @click="goToSignup" class="underline hover:text-black">Sign up now</button>
              </p>
            </template>
          </div>

          <!-- Delivery Info -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex items-start gap-3 text-sm text-gray-600">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="font-medium text-gray-900 mb-1">Delivery Information</p>
                <p>Estimated delivery: 3-8 business days</p>
                <p class="mt-1">Free delivery on orders over 5,000,000₫</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const bagItems = ref([])

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

onMounted(() => {
  loadBag()
})

const loadBag = () => {
  const saved = localStorage.getItem('shoppingBag')
  if (saved) {
    bagItems.value = JSON.parse(saved)
    console.log('📦 Bag items loaded:', bagItems.value)
    
    bagItems.value.forEach(item => {
      if (!item.colorName || !item.size) {
        console.warn('⚠️ Item thiếu thông tin:', item)
      }
    })
  }
}

const saveBag = () => {
  localStorage.setItem('shoppingBag', JSON.stringify(bagItems.value))
  // Dispatch event để header cập nhật
  window.dispatchEvent(new Event('bagUpdated'))
}

const subtotal = computed(() => {
  return bagItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const deliveryFee = computed(() => {
  return subtotal.value >= 5000000 ? 0 : 10000
})

const total = computed(() => {
  return subtotal.value + deliveryFee.value
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const increaseQty = (item) => {
  item.quantity++
  saveBag()
}

const decreaseQty = (item) => {
  if (item.quantity > 1) {
    item.quantity--
    saveBag()
  }
}

const removeItem = (item) => {
  if (confirm('Remove this item from bag?')) {
    const index = bagItems.value.findIndex(
      i => i.productId === item.productId && 
           i.styleCode === item.styleCode && 
           i.size === item.size
    )
    if (index > -1) {
      bagItems.value.splice(index, 1)
      saveBag()
    }
  }
}

const validateBag = () => {
  const invalidItems = bagItems.value.filter(item => !item.colorName || !item.size)
  
  if (invalidItems.length > 0) {
    alert('Một số sản phẩm thiếu thông tin. Vui lòng kiểm tra lại!')
    console.error('❌ Invalid items:', invalidItems)
    return false
  }
  return true
}

// Guest Checkout - Chuyển thẳng đến checkout
const guestCheckout = () => {
  if (!validateBag()) return
  
  // Đánh dấu là guest checkout
  localStorage.setItem('checkoutMode', 'guest')
  router.push('/checkout')
}

// Member Checkout - Kiểm tra login trước
const memberCheckout = () => {
  if (!validateBag()) return
  
  if (isLoggedIn.value) {
    // Đã đăng nhập - Chuyển thẳng đến checkout
    localStorage.setItem('checkoutMode', 'member')
    router.push('/checkout')
  } else {
    // Chưa đăng nhập - Chuyển đến login
    localStorage.setItem('redirectAfterLogin', '/checkout')
    localStorage.setItem('checkoutMode', 'member')
    router.push('/login')
  }
}

// Go to signup page
const goToSignup = () => {
  localStorage.setItem('redirectAfterLogin', '/bag')
  router.push('/register')
}
</script>