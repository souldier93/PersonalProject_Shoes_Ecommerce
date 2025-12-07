<template>
  <div class="max-w-7xl mx-auto px-4 py-8 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- LEFT COLUMN - Delivery Form -->
      <div>
        <h1 class="text-3xl font-semibold mb-8">Delivery</h1>

        <!-- ✅ Login Status Banner -->
        <div v-if="isLoggedIn" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-green-800">
                Logged in as <strong>{{ currentUser.email }}</strong>
              </p>
              <p class="text-xs text-green-600 mt-1">
                Your order will be saved to your account
              </p>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- ✅ Email Field - Disabled nếu đã login -->
          <div>
            <input
              v-model="form.email"
              type="email"
              placeholder="Email *"
              required
              :disabled="isLoggedIn"
              :class="[
                'w-full px-4 py-3 border rounded-md transition',
                isLoggedIn 
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-700' 
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
              ]"
            />
            <p v-if="!isLoggedIn" class="text-xs text-gray-600 mt-2">
              Become a Nike Member to get Nike Member Benefits. 
              <router-link to="/login" class="underline hover:text-black">Log in</router-link> or 
              <router-link to="/register" class="underline hover:text-black">Sign up now</router-link>
            </p>
            <p v-else class="text-xs text-gray-500 mt-2">
              Email cannot be changed while logged in
            </p>
          </div>

          <!-- First Name -->
          <div>
            <input
              v-model="form.firstName"
              type="text"
              placeholder="First Name *"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Last Name -->
          <div>
            <input
              v-model="form.lastName"
              type="text"
              placeholder="Last Name *"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Address -->
          <div>
            <div class="relative">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                v-model="form.address"
                type="text"
                placeholder="Start typing a street address or postcode *"
                required
                class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <p class="text-xs text-gray-600 mt-2">
              We do not ship to P.O. boxes
            </p>
            <button 
              type="button" 
              @click="showManualAddress = !showManualAddress" 
              class="text-sm underline mt-2 hover:text-black"
            >
              {{ showManualAddress ? 'Hide manual entry' : 'Enter address manually' }}
            </button>
          </div>

          <!-- Manual Address Fields -->
          <div v-if="showManualAddress" class="space-y-4 pl-4 border-l-2 border-gray-200">
            <input
              v-model="form.addressLine1"
              type="text"
              placeholder="Address Line 1"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              v-model="form.addressLine2"
              type="text"
              placeholder="Address Line 2"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div class="grid grid-cols-2 gap-4">
              <input
                v-model="form.city"
                type="text"
                placeholder="City"
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                v-model="form.postalCode"
                type="text"
                placeholder="Postal Code"
                class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <!-- Phone Number -->
          <div>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="Phone Number *"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p class="text-xs text-gray-600 mt-2">
              A carrier might contact you to confirm delivery.
            </p>
          </div>

          <!-- Billing Matches Shipping -->
          <div class="flex items-start gap-3 pt-2">
            <input
              v-model="form.billingMatchesShipping"
              type="checkbox"
              id="billing-match"
              class="w-5 h-5 mt-0.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
            />
            <label for="billing-match" class="text-sm cursor-pointer select-none">
              Billing matches shipping address
            </label>
          </div>

          <!-- Continue Button -->
          <button
            type="submit"
            :disabled="isCheckingStock || hasStockIssues"
            class="w-full bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ isCheckingStock ? 'Checking stock...' : 'Continue to Payment' }}
          </button>

          <!-- Stock Warning -->
          <div v-if="hasStockIssues" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="flex-1">
                <h4 class="font-semibold text-red-800 mb-2">Stock Issues</h4>
                <ul class="text-sm text-red-700 space-y-1">
                  <li v-for="item in outOfStockItems" :key="`${item.productId}-${item.size}`">
                    {{ item.name }} ({{ item.colorName }}, Size {{ item.size }}): 
                    Only {{ item.availableStock }} available, you requested {{ item.quantity }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- RIGHT COLUMN - Order Summary -->
      <div>
        <h2 class="text-2xl font-semibold mb-6">Order Summary</h2>

        <div class="space-y-4">
          <!-- Subtotal & Delivery -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Estimated Delivery & Handling</span>
              <span>{{ deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee) }}</span>
            </div>
          </div>

          <!-- Total -->
          <div class="flex justify-between text-lg font-semibold pt-4 border-t border-gray-200">
            <span>Total</span>
            <span>{{ formatPrice(total) }}</span>
          </div>

          <!-- Free Shipping Progress -->
          <div v-if="subtotal < freeShippingThreshold" class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-xs text-blue-800 mb-2">
              Add {{ formatPrice(freeShippingThreshold - subtotal) }} more to get FREE shipping!
            </p>
            <div class="w-full bg-blue-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all" 
                :style="{ width: shippingProgress + '%' }"
              ></div>
            </div>
          </div>

          <!-- Product Items -->
          <div class="pt-6 border-t border-gray-200">
            <p class="text-sm font-medium mb-4">
              Arrives {{ deliveryDateRange }}
            </p>

            <div 
              v-for="item in bagItemsWithStock" 
              :key="`${item.productId}-${item.styleCode}-${item.size}`" 
              class="flex gap-4 mb-4 p-3 rounded-lg transition"
              :class="item.stockStatus === 'available' ? 'bg-white' : 'bg-red-50'"
            >
              <img 
                :src="item.thumbnail || item.image" 
                :alt="item.name"
                class="w-24 h-24 object-cover rounded-md"
              />
              <div class="flex-1">
                <h3 class="font-semibold text-sm">{{ item.name }}</h3>
                <p class="text-xs text-gray-600 mt-1">
                  Qty {{ item.quantity }}<br>
                  Size EU {{ item.size }}<br>
                  {{ formatPrice(item.price) }}
                </p>
                
                <!-- Stock Status -->
                <div class="mt-2">
                  <span v-if="item.stockStatus === 'checking'" 
                        class="text-xs text-gray-500">
                    Checking stock...
                  </span>
                  <span v-else-if="item.stockStatus === 'available'" 
                        class="text-xs text-green-600 font-medium">
                    ✓ {{ item.availableStock }} in stock
                  </span>
                  <span v-else-if="item.stockStatus === 'low'" 
                        class="text-xs text-orange-600 font-medium">
                    ⚠ Only {{ item.availableStock }} left
                  </span>
                  <span v-else-if="item.stockStatus === 'insufficient'" 
                        class="text-xs text-red-600 font-medium">
                    ✗ Only {{ item.availableStock }} available (need {{ item.quantity }})
                  </span>
                  <span v-else-if="item.stockStatus === 'out'" 
                        class="text-xs text-red-600 font-medium">
                    ✗ Out of stock
                  </span>
                </div>
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
const API_BASE = 'https://kit-perspectived-palely.ngrok-free.dev'

// ✅ Auth state
const currentUser = ref(null)
const isLoggedIn = computed(() => !!currentUser.value)

const form = ref({
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  phone: '',
  billingMatchesShipping: true
})

const showManualAddress = ref(false)
const bagItems = ref([])
const stockInfo = ref([])
const isCheckingStock = ref(false)
const freeShippingThreshold = 5000000

// ✅ Load user khi mount - HỖ TRỢ 3 CÁCH
onMounted(async () => {
  console.log('🔍 Checking user authentication...')
  
  // ✅ CÁCH 1: Đọc từ localStorage (nếu đã lưu sau khi login)
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser)
      form.value.email = currentUser.value.email
      console.log('✅ User loaded from localStorage:', currentUser.value.email)
    } catch (error) {
      console.error('❌ Invalid user data in localStorage')
      localStorage.removeItem('user')
    }
  }
  
  // ✅ CÁCH 2: Gọi API /auth/profile (nếu có token)
  const token = localStorage.getItem('authToken')
  if (token && !currentUser.value) {
    try {
      console.log('📡 Fetching user profile from API...')
      
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📊 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 API Response data:', data)
        
        // ✅ Xử lý response structure khác nhau
        // Case 1: { user: {...} }
        // Case 2: { email: '...', _id: '...' }
        currentUser.value = data.user || data
        
        if (currentUser.value.email) {
          form.value.email = currentUser.value.email
          
          // ✅ Lưu vào localStorage để dùng lại
          localStorage.setItem('user', JSON.stringify(currentUser.value))
          
          console.log('✅ Email bound:', form.value.email)
        } else {
          console.warn('⚠️ No email found in user data')
        }
      } else {
        console.warn('⚠️ Token invalid, status:', response.status)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
    }
  }
  
  // ✅ CÁCH 3: Fallback - nếu không có gì thì là guest
  if (!currentUser.value) {
    console.log('👤 Guest checkout mode')
  }
  
  // Load shopping bag
  const saved = localStorage.getItem('shoppingBag')
  if (saved) {
    bagItems.value = JSON.parse(saved)
  }
  
  if (bagItems.value.length === 0) {
    router.push('/bag')
    return
  }
  
  await checkAllStock()
})

// ✅ Check stock
const checkAllStock = async () => {
  isCheckingStock.value = true
  
  try {
    const items = bagItems.value.map(item => ({
      productId: item.productId,
      colorName: item.colorName,
      size: item.size,
      quantity: item.quantity
    }))
    
    const response = await fetch(`${API_BASE}/shoes/check-stock-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(items)
    })
    
    const data = await response.json()
    stockInfo.value = data.items || []
    
    console.log('📦 Stock check:', data)
  } catch (error) {
    console.error('❌ Stock check error:', error)
    alert('Cannot verify stock. Please try again.')
  } finally {
    isCheckingStock.value = false
  }
}

// ✅ Bag items with stock
const bagItemsWithStock = computed(() => {
  return bagItems.value.map(item => {
    const stock = stockInfo.value.find(
      s => s.productId === item.productId && 
           s.colorName === item.colorName && 
           s.size === item.size
    )
    
    if (!stock) {
      return { ...item, stockStatus: 'checking', availableStock: 0 }
    }
    
    const availableStock = stock.availableStock || 0
    let stockStatus = 'available'
    
    if (availableStock === 0) {
      stockStatus = 'out'
    } else if (availableStock < item.quantity) {
      stockStatus = 'insufficient'
    } else if (availableStock <= 5) {
      stockStatus = 'low'
    }
    
    return {
      ...item,
      availableStock,
      stockStatus,
      isAvailable: stock.isAvailable
    }
  })
})

const hasStockIssues = computed(() => {
  return bagItemsWithStock.value.some(item => !item.isAvailable)
})

const outOfStockItems = computed(() => {
  return bagItemsWithStock.value.filter(item => !item.isAvailable)
})

// Computed values
const subtotal = computed(() => {
  return bagItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const deliveryFee = computed(() => {
  return subtotal.value >= freeShippingThreshold ? 0 : 10000
})

const total = computed(() => {
  return subtotal.value + deliveryFee.value
})

const shippingProgress = computed(() => {
  return Math.min((subtotal.value / freeShippingThreshold) * 100, 100)
})

const deliveryDateRange = computed(() => {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + 3)
  
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 8)
  
  const options = { weekday: 'short', month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

// ✅ Submit handler
const handleSubmit = async () => {
  await checkAllStock()
  
  if (hasStockIssues.value) {
    alert('Some items are out of stock. Please update your cart.')
    return
  }
  
  try {
    const items = bagItems.value.map(item => ({
      productId: item.productId,
      name: item.name,
      colorName: item.colorName,
      size: item.size,
      quantity: item.quantity,
      price: item.price
    }))
    
    const orderData = {
      orderId: Date.now().toString(),
      description: `Order ${bagItems.value.length} items`,
      amount: total.value,
      items: items,
      userId: currentUser.value?._id || null,
      customerEmail: form.value.email,
      customerInfo: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        phone: form.value.phone,
        address: form.value.address,
        addressLine1: form.value.addressLine1,
        addressLine2: form.value.addressLine2,
        city: form.value.city,
        postalCode: form.value.postalCode,
      }
    }
    
    console.log('📦 Creating payment:', orderData)
    
    const token = localStorage.getItem('authToken')
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(orderData)
    })
    
    const paymentData = await response.json()
    console.log('✅ Payment created:', paymentData)
    
    if (paymentData.code === '00') {
      const completeOrderData = {
        customerInfo: form.value,
        items: bagItems.value,
        subtotal: subtotal.value,
        deliveryFee: deliveryFee.value,
        total: total.value,
        paymentData: paymentData.data,
        userId: currentUser.value?._id || null,
        isGuest: !currentUser.value
      }
      
      localStorage.setItem('pendingOrder', JSON.stringify(completeOrderData))
      router.push('/payment')
    } else {
      alert('Cannot create payment. Please try again!')
    }
  } catch (error) {
    console.error('❌ Payment error:', error)
    alert('Connection error. Please try again!')
  }
}
</script>
