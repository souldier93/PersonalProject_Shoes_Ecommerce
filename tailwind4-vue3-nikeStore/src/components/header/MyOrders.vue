<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 mt-16">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">My Orders</h1>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="orders.length === 0" class="text-center py-16">
        <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">No Orders Yet</h2>
        <p class="text-gray-500 mb-6">Start shopping to see your orders here!</p>
        <router-link to="/" 
                     class="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">
          Start Shopping
        </router-link>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-6">
        <div v-for="order in orders" :key="order.orderCode" 
             class="bg-white rounded-lg shadow-md overflow-hidden">
          <!-- Order Header -->
          <div class="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div>
                <p class="text-sm text-gray-600">Order #{{ order.orderCode }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
              </div>
              <span 
                class="px-3 py-1 rounded-full text-xs font-semibold"
                :class="{
                  'bg-green-100 text-green-700': order.status === 'PAID',
                  'bg-yellow-100 text-yellow-700': order.status === 'PENDING',
                  'bg-red-100 text-red-700': order.status === 'FAILED'
                }">
                {{ order.status }}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {{ order.fulfillmentStatus || 'AWAITING_PAYMENT' }}
              </span>
            </div>
            <button @click="viewOrderDetail(order)" 
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Details →
            </button>
          </div>

          <!-- Order Items -->
          <div class="p-6">
            <div class="space-y-4">
              <div v-for="(item, idx) in order.items" :key="idx" 
                   class="flex gap-4 pb-4 border-b last:border-0">
                <!-- ✅ Product Image from shoesDetail -->
                <div class="w-20 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <img v-if="getItemImage(item)" 
                       :src="getItemImage(item)" 
                       :alt="item.name"
                       class="w-full h-full object-cover"
                       @error="handleImageError" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-800">{{ item.name }}</h3>
                  <p class="text-sm text-gray-600">{{ item.colorName }}</p>
                  <p class="text-sm text-gray-600">Size: {{ item.size }} | Quantity: {{ item.quantity }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ formatPrice(item.price * item.quantity) }}</p>
                  <p class="text-xs text-gray-500">{{ formatPrice(item.price) }} each</p>
                </div>
              </div>
            </div>

            <!-- Order Total -->
            <div class="mt-4 pt-4 border-t flex justify-between items-center">
              <span class="text-gray-600">Total</span>
              <span class="text-2xl font-bold">{{ formatPrice(order.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ Order Detail Modal -->
    <div v-if="selectedOrder" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         @click.self="selectedOrder = null">
      <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Order Details</h2>
            <p class="text-sm text-gray-500">Order #{{ selectedOrder.orderCode }}</p>
          </div>
          <button @click="selectedOrder = null" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Status & Date -->
          <div class="bg-gray-50 rounded-lg p-4 flex justify-between">
            <div>
              <h3 class="text-sm text-gray-600 mb-1">Status</h3>
              <span 
                class="inline-flex px-3 py-1 rounded-full text-sm font-semibold"
                :class="{
                  'bg-green-100 text-green-700': selectedOrder.status === 'PAID',
                  'bg-yellow-100 text-yellow-700': selectedOrder.status === 'PENDING',
                  'bg-red-100 text-red-700': selectedOrder.status === 'FAILED'
                }">
                {{ selectedOrder.status }}
              </span>
            </div>
            <div class="text-right">
              <h3 class="text-sm text-gray-600 mb-1">Order Date</h3>
              <p class="font-medium">{{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
          </div>

          <!-- Delivery Info -->
          <div v-if="selectedOrder.customerInfo">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Delivery Information
            </h3>
            <div class="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <p><span class="text-gray-600">Name:</span> <span class="font-medium">{{ selectedOrder.customerInfo.firstName }} {{ selectedOrder.customerInfo.lastName }}</span></p>
              <p><span class="text-gray-600">Phone:</span> <span class="font-medium">{{ selectedOrder.customerInfo.phone }}</span></p>
              <p><span class="text-gray-600">Address:</span> <span class="font-medium">{{ selectedOrder.customerInfo.address }}</span></p>
              <p v-if="selectedOrder.customerInfo.city"><span class="text-gray-600">City:</span> <span class="font-medium">{{ selectedOrder.customerInfo.city }} {{ selectedOrder.customerInfo.postalCode }}</span></p>
            </div>
          </div>

          <!-- Order Items in Modal -->
          <div>
            <h3 class="font-semibold mb-3">Items ({{ selectedOrder.items.length }})</h3>
            <div class="space-y-3">
              <div v-for="(item, idx) in selectedOrder.items" :key="idx" 
                   class="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <!-- ✅ Product Image in Modal -->
                <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img v-if="getItemImage(item)" 
                       :src="getItemImage(item)" 
                       :alt="item.name"
                       class="w-full h-full object-cover"
                       @error="handleImageError" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h4 class="font-medium">{{ item.name }}</h4>
                  <p class="text-sm text-gray-600">{{ item.colorName }} | Size {{ item.size }}</p>
                  <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                  <button
                    v-if="selectedOrder.status === 'PAID'"
                    @click="openReviewModal(selectedOrder, item)"
                    class="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Write Review
                  </button>
                  <button
                    v-if="selectedOrder.status === 'PAID'"
                    @click="openReturnModal(selectedOrder, item)"
                    class="ml-4 mt-3 text-sm font-medium text-orange-600 hover:text-orange-800"
                  >
                    Return / Exchange
                  </button>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ formatPrice(item.price * item.quantity) }}</p>
                  <p class="text-xs text-gray-500">{{ formatPrice(item.price) }} each</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="border-t pt-4">
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span class="text-green-600">{{ formatPrice(selectedOrder.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="reviewModal.open"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeReviewModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <div class="flex items-start justify-between mb-5">
          <div>
            <h2 class="text-2xl font-bold">Write Review</h2>
            <p class="text-sm text-gray-500">{{ reviewModal.item?.name }}</p>
          </div>
          <button @click="closeReviewModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex gap-2 mb-4">
          <button
            v-for="star in 5"
            :key="star"
            @click="reviewForm.rating = star"
            class="text-3xl"
            :class="star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'"
          >
            ★
          </button>
        </div>

        <textarea
          v-model="reviewForm.comment"
          rows="5"
          class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Share your experience with this shoe..."
        ></textarea>

        <div class="flex justify-end gap-3 mt-5">
          <button @click="closeReviewModal" class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>
          <button
            @click="submitReview"
            :disabled="reviewSubmitting"
            class="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            {{ reviewSubmitting ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="returnModal.open"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeReturnModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <div class="flex items-start justify-between mb-5">
          <div>
            <h2 class="text-2xl font-bold">Return / Exchange</h2>
            <p class="text-sm text-gray-500">{{ returnModal.item?.name }}</p>
          </div>
          <button @click="closeReturnModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <select v-model="returnForm.type" class="w-full border rounded-lg p-3">
            <option value="RETURN">Return</option>
            <option value="EXCHANGE">Exchange</option>
            <option value="REFUND">Refund</option>
          </select>
          <input v-model.number="returnForm.quantity" type="number" min="1" class="w-full border rounded-lg p-3" placeholder="Quantity" />
          <input v-model="returnForm.reason" class="w-full border rounded-lg p-3" placeholder="Reason" />
          <textarea v-model="returnForm.note" rows="4" class="w-full border rounded-lg p-3" placeholder="Add detail for the store team"></textarea>
        </div>

        <div class="flex justify-end gap-3 mt-5">
          <button @click="closeReturnModal" class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>
          <button
            @click="submitReturnRequest"
            :disabled="returnSubmitting"
            class="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            {{ returnSubmitting ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const router = useRouter()

const loading = ref(true)
const orders = ref([])
const selectedOrder = ref(null)
const reviewSubmitting = ref(false)
const reviewModal = ref({
  open: false,
  order: null,
  item: null,
})
const reviewForm = ref({
  rating: 5,
  comment: '',
})
const returnSubmitting = ref(false)
const returnModal = ref({
  open: false,
  order: null,
  item: null,
})
const returnForm = ref({
  type: 'RETURN',
  quantity: 1,
  reason: '',
  note: '',
})
const productImages = ref({}) // ✅ Cache ảnh sản phẩm

// Get current user
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

onMounted(async () => {
  if (!currentUser.value) {
    router.push('/login')
    return
  }

  await fetchOrders()
})

// ✅ Fetch user's orders
const fetchOrders = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const headers = {
      'ngrok-skip-browser-warning': 'true'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let response

    if (currentUser.value._id) {
      console.log('🔍 Fetching orders for user:', currentUser.value._id)
      response = await axios.get(
        `${API_BASE}/payments/user/${currentUser.value._id}/orders`,
        { headers }
      )
    } 
    else if (currentUser.value.email) {
      console.log('🔍 Fetching orders for guest:', currentUser.value.email)
      response = await axios.get(
        `${API_BASE}/payments/guest/${currentUser.value.email}/orders`,
        { headers }
      )
    }

    if (response && response.data) {
      orders.value = response.data.orders || []
      console.log('✅ Orders loaded:', orders.value.length, 'orders')
      
      // ✅ Load images cho tất cả items
      await loadProductImages()
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error)
    console.error('❌ Error details:', error.response?.data)
    
    if (error.response?.status === 404) {
      console.log('ℹ️ No orders found for this user')
    }
  } finally {
    loading.value = false
  }
}

// ✅ Load ảnh sản phẩm từ shoesDetail
const loadProductImages = async () => {
  const uniqueProducts = new Set()
  
  // Lấy danh sách productId unique
  orders.value.forEach(order => {
    order.items.forEach(item => {
      uniqueProducts.add(item.productId)
    })
  })

  console.log('🖼️ Loading images for products:', [...uniqueProducts])

  // Load chi tiết cho từng sản phẩm
  for (const productId of uniqueProducts) {
    try {
      const response = await axios.get(`${API_BASE}/shoes/detail/${productId}`)
      const productDetail = response.data
      
      // Lưu vào cache
      productImages.value[productId] = productDetail
      console.log(`✅ Loaded images for product ${productId}`)
    } catch (error) {
      console.error(`❌ Error loading product ${productId}:`, error)
    }
  }
}

// ✅ Lấy ảnh cho một item cụ thể
const getItemImage = (item) => {
  // 1. Kiểm tra xem có productDetail không
  const productDetail = productImages.value[item.productId]
  if (!productDetail) {
    console.log(`⚠️ No product detail for ${item.productId}`)
    return null
  }

  // 2. Tìm color matching với colorName
  const color = productDetail.colors?.find(c => c.colorName === item.colorName)
  if (!color) {
    console.log(`⚠️ Color not found: ${item.colorName}`)
    return null
  }

  // 3. Trả về thumbnail hoặc ảnh đầu tiên
  const imageUrl = color.thumbnail || color.images?.[0]
  console.log(`🖼️ Image for ${item.name} (${item.colorName}):`, imageUrl)
  return imageUrl
}

// ✅ Handle lỗi khi load ảnh
const handleImageError = (event) => {
  console.error('❌ Image load failed:', event.target.src)
  event.target.style.display = 'none'
}

const viewOrderDetail = (order) => {
  selectedOrder.value = order
}

const openReviewModal = (order, item) => {
  reviewModal.value = {
    open: true,
    order,
    item,
  }
  reviewForm.value = {
    rating: 5,
    comment: '',
  }
}

const closeReviewModal = () => {
  reviewModal.value = {
    open: false,
    order: null,
    item: null,
  }
}

const submitReview = async () => {
  if (!currentUser.value || !reviewModal.value.order || !reviewModal.value.item) return

  reviewSubmitting.value = true
  try {
    const item = reviewModal.value.item
    const order = reviewModal.value.order
    await axios.post(`${API_BASE}/reviews`, {
      productId: item.productId,
      orderCode: order.orderCode,
      userId: currentUser.value._id,
      username: currentUser.value.username || currentUser.value.email,
      colorName: item.colorName,
      size: item.size,
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment,
    })

    alert('Review submitted successfully!')
    closeReviewModal()
  } catch (error) {
    console.error('Failed to submit review:', error)
    alert(error.response?.data?.message || 'Failed to submit review')
  } finally {
    reviewSubmitting.value = false
  }
}

const openReturnModal = (order, item) => {
  returnModal.value = {
    open: true,
    order,
    item,
  }
  returnForm.value = {
    type: 'RETURN',
    quantity: 1,
    reason: '',
    note: '',
  }
}

const closeReturnModal = () => {
  returnModal.value = {
    open: false,
    order: null,
    item: null,
  }
}

const submitReturnRequest = async () => {
  if (!returnModal.value.order || !returnModal.value.item) return

  returnSubmitting.value = true
  try {
    const item = returnModal.value.item
    const order = returnModal.value.order
    await axios.post(`${API_BASE}/returns`, {
      orderCode: order.orderCode,
      productId: item.productId,
      colorName: item.colorName,
      size: item.size,
      quantity: returnForm.value.quantity,
      type: returnForm.value.type,
      reason: returnForm.value.reason,
      note: returnForm.value.note,
    })

    alert('Return request submitted successfully!')
    closeReturnModal()
  } catch (error) {
    console.error('Failed to submit return request:', error)
    alert(error.response?.data?.message || 'Failed to submit return request')
  } finally {
    returnSubmitting.value = false
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
