<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 text-center">Payment</h1>

      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
        <p class="mt-4">Loading payment...</p>
      </div>

      <div v-else-if="paymentOrder" class="space-y-6">
        <div class="bg-gray-50 rounded-lg p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Order Code</p>
              <p class="font-semibold">{{ paymentOrder.orderCode }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Amount</p>
              <p class="font-bold text-2xl text-green-600">
                {{ formatPrice(paymentOrder.amount) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Status</p>
              <span class="px-3 py-1 rounded-full text-sm font-medium" :class="statusClass">
                {{ paymentOrder.status }}
              </span>
            </div>
            <div>
              <p class="text-sm text-gray-600">Payment Link</p>
              <a :href="paymentOrder.checkoutUrl" target="_blank"
                 class="text-blue-600 hover:underline text-sm">
                Open Payment Page
              </a>
            </div>
          </div>
        </div>

        <div v-if="paymentOrder.status === 'PENDING'" class="text-center">
          <h2 class="text-xl font-semibold mb-4">Scan QR Code to Pay</h2>

          <div class="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
            <qrcode-vue
              :value="paymentOrder.qrCode"
              :size="300"
              level="H"
              class="mx-auto"
            />
          </div>

          <div class="mt-4 space-y-2">
            <p class="text-gray-600">Mở ứng dụng Banking và quét mã QR</p>
            <p class="text-sm text-gray-500">Thanh toán sẽ được xác nhận tự động</p>
          </div>

          <div class="mt-6">
            <div class="text-gray-600 mb-2">
              Thời gian còn lại:
              <span class="font-mono text-xl font-bold text-red-600">
                {{ formatTime(countdown) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all"
                   :style="{ width: (countdown / 600) * 100 + '%' }"></div>
            </div>
          </div>

          <button @click="manualCheckStatus" :disabled="checking"
            class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ checking ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán' }}
          </button>
        </div>

        <div v-else-if="paymentOrder.status === 'PAID'" class="text-center py-8">
          <svg class="w-24 h-24 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 class="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h2>
          <p class="text-gray-600 mb-6">Đơn hàng của bạn đã được xác nhận</p>

          <button @click="continueShopping"
            class="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800">
            Tiếp tục mua sắm
          </button>
        </div>

        <div class="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold mb-3">Thông tin chuyển khoản:</h3>
          <div class="text-sm space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Ngân hàng:</span>
              <span class="font-medium">{{ getBankName(paymentOrder.bin) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Số tài khoản:</span>
              <span class="font-medium">{{ paymentOrder.accountNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Chủ tài khoản:</span>
              <span class="font-medium">{{ paymentOrder.accountName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Nội dung:</span>
              <span class="font-medium text-red-600">{{ paymentOrder.description }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Số tiền:</span>
              <span class="font-bold text-green-600">{{ formatPrice(paymentOrder.amount) }}</span>
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="font-semibold mb-4">Chi tiết đơn hàng:</h3>
          <div v-for="item in orderItems" :key="`${item.productId}-${item.styleCode}-${item.size}`"
               class="flex gap-4 mb-3 pb-3 border-b last:border-0">
            <img :src="item.thumbnail || item.image" :alt="item.name"
                 class="w-16 h-16 object-cover rounded" />
            <div class="flex-1">
              <h4 class="font-medium text-sm">{{ item.name }}</h4>
              <p class="text-xs text-gray-600">
                Size {{ item.size }} • Số lượng {{ item.quantity }}
              </p>
              <p class="text-sm font-semibold mt-1">{{ formatPrice(item.price * item.quantity) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBag, saveBag } from '../../../utils/bagStorage'
import QrcodeVue from 'qrcode.vue'
import { API_BASE } from '../../../utils/apiBase'

const router = useRouter()

const loading = ref(true)
const paymentOrder = ref(null)
const orderItems = ref([])
const customerInfo = ref(null)
const countdown = ref(600)
const checking = ref(false)
const checkInterval = ref(null)
const countdownInterval = ref(null)

onMounted(() => {
  loadPaymentData()
  startCountdown()
  startAutoCheck()
})

onUnmounted(() => {
  clearIntervals()
})

const loadPaymentData = () => {
  const orderDataStr = localStorage.getItem('pendingOrder')
  if (!orderDataStr) {
    alert('Không tìm thấy đơn hàng')
    router.push('/checkout')
    return
  }

  const orderData = JSON.parse(orderDataStr)
  paymentOrder.value = orderData.paymentData
  orderItems.value = orderData.items
  customerInfo.value = orderData.customerInfo
  loading.value = false
}

const startCountdown = () => {
  countdownInterval.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      paymentOrder.value.status = 'EXPIRED'
      clearIntervals()
    }
  }, 1000)
}

const startAutoCheck = () => {
  checkInterval.value = setInterval(async () => {
    await checkStatus()
  }, 3000)
}

const clearIntervals = () => {
  if (checkInterval.value) clearInterval(checkInterval.value)
  if (countdownInterval.value) clearInterval(countdownInterval.value)
}

const removePurchasedItemsFromBag = () => {
  const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems')) || []
  const shoppingBag = getBag()

  if (checkoutItems.length === 0) return

  const checkoutKeys = checkoutItems.map(item =>
    `${item.productId}-${item.styleCode}-${item.size}`
  )

  const updatedBag = shoppingBag.filter(item => {
    const key = `${item.productId}-${item.styleCode}-${item.size}`
    return !checkoutKeys.includes(key)
  })

  saveBag(updatedBag)
  localStorage.removeItem('checkoutItems')
  localStorage.removeItem('pendingOrder')
  localStorage.removeItem('deliveryInfo')

  window.dispatchEvent(new Event('bagCountUpdated'))
}

const checkStatus = async () => {
  if (!paymentOrder.value?.paymentLinkId) return

  try {
    const response = await fetch(
      `${API_BASE}/payments/check/${paymentOrder.value.paymentLinkId}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      }
    )

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Response is not JSON, got:', contentType)
      return
    }

    const data = await response.json()

    if (data.success && data.status === 'PAID') {
      paymentOrder.value.status = 'PAID'
      clearIntervals()
      removePurchasedItemsFromBag()
      console.log('✅ Payment confirmed!')
    }
  } catch (error) {
    console.error('❌ Error checking status:', error)
  }
}

const manualCheckStatus = async () => {
  checking.value = true
  await checkStatus()
  setTimeout(() => {
    checking.value = false
  }, 1000)
}

const continueShopping = () => {
  removePurchasedItemsFromBag()
  router.push('/')
}

const getBankName = (bin) => {
  const bankNames = {
    '970422': 'MB Bank',
    '970436': 'Vietcombank',
    '970407': 'Techcombank',
    '970415': 'VietinBank',
    '970418': 'BIDV',
    '970405': 'Agribank',
  }
  return bankNames[bin] || 'Bank'
}

const statusClass = computed(() => {
  switch (paymentOrder.value?.status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'PAID': return 'bg-green-100 text-green-800'
    case 'EXPIRED':
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>
