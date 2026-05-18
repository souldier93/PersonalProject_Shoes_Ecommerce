<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="rounded-lg bg-white p-5 shadow-lg sm:p-8">
      <h1 class="mb-6 text-center text-3xl font-bold">Payment</h1>

      <div v-if="loading" class="py-20 text-center">
        <div class="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p class="mt-4">Loading payment...</p>
      </div>

      <div v-else-if="paymentOrder" class="space-y-6">
        <div class="rounded-lg bg-gray-50 p-5">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p class="text-sm text-gray-600">Order Code</p>
              <p class="font-semibold">{{ paymentOrder.orderCode }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Amount</p>
              <p class="text-2xl font-bold text-green-600">
                {{ formatPrice(paymentOrder.amount) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Status</p>
              <span class="rounded-full px-3 py-1 text-sm font-medium" :class="statusClass">
                {{ paymentOrder.status }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="isStripePayment" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-5">
            <div v-if="paymentOrder.status === 'PAID'" class="py-8 text-center">
              <svg class="mx-auto mb-4 h-24 w-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h2 class="mb-2 text-2xl font-bold text-green-600">Payment successful!</h2>
              <p class="mb-1 text-gray-600">Your order has been confirmed.</p>
              <p class="mb-6 text-sm text-gray-500">Order code: {{ paymentOrder.orderCode }}</p>

              <button
                @click="continueShopping"
                class="rounded-full bg-black px-6 py-3 text-white hover:bg-gray-800"
              >
                Continue shopping
              </button>
            </div>

            <div v-else-if="!stripePublishableKey" class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Missing Stripe publishable key. Add VITE_STRIPE_PUBLISHABLE_KEY to frontend environment.
            </div>

            <div v-else class="space-y-4">
              <div
                ref="expressCheckoutRef"
                class="rounded-md border border-gray-200 p-3"
                :class="expressCheckoutVisible ? 'block' : 'hidden'"
              ></div>

              <div v-if="expressCheckoutVisible" class="flex items-center gap-3 text-xs uppercase text-gray-400">
                <span class="h-px flex-1 bg-gray-200"></span>
                <span>or pay by card</span>
                <span class="h-px flex-1 bg-gray-200"></span>
              </div>

              <div ref="paymentElementRef" class="rounded-md border border-gray-200 p-4"></div>

              <p v-if="stripeMessage" class="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {{ stripeMessage }}
              </p>

              <button
                type="button"
                @click="submitStripePayment"
                :disabled="!stripeReady || confirmingStripe || paymentOrder.status === 'PAID'"
                class="w-full rounded-full bg-black py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {{ confirmingStripe ? 'Processing...' : paymentOrder.status === 'PAID' ? 'Paid' : 'Pay with card' }}
              </button>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-4">
            <h3 class="mb-4 font-semibold">Order items</h3>
            <div
              v-for="item in orderItems"
              :key="`${item.productId}-${item.styleCode}-${item.size}`"
              class="mb-3 flex gap-3 border-b pb-3 last:mb-0 last:border-0 last:pb-0"
            >
              <img
                :src="item.thumbnail || item.image"
                :alt="item.name"
                class="h-16 w-16 rounded object-cover"
              />
              <div class="flex-1">
                <h4 class="text-sm font-medium">{{ item.name }}</h4>
                <p class="mt-1 text-xs text-gray-600">
                  Size {{ item.size }} - Qty {{ item.quantity }}
                </p>
                <p class="mt-1 text-sm font-semibold">
                  {{ formatPrice(item.price * item.quantity) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div v-if="paymentOrder.status === 'PENDING'" class="text-center">
            <h2 class="mb-4 text-xl font-semibold">Scan QR Code to Pay</h2>

            <div class="inline-block rounded-lg border-2 border-gray-200 bg-white p-6">
              <qrcode-vue
                :value="paymentOrder.qrCode"
                :size="300"
                level="H"
                class="mx-auto"
              />
            </div>

            <div class="mt-4 space-y-2">
              <p class="text-gray-600">Open your banking app and scan the QR code.</p>
              <p class="text-sm text-gray-500">Payment will be confirmed automatically.</p>
            </div>

            <div class="mt-6">
              <div class="mb-2 text-gray-600">
                Time left:
                <span class="font-mono text-xl font-bold text-red-600">
                  {{ formatTime(countdown) }}
                </span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-200">
                <div
                  class="h-2 rounded-full bg-blue-600 transition-all"
                  :style="{ width: (countdown / 600) * 100 + '%' }"
                ></div>
              </div>
            </div>

            <button
              @click="manualCheckStatus"
              :disabled="checking"
              class="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ checking ? 'Checking...' : 'Check payment' }}
            </button>
          </div>

          <div v-else-if="paymentOrder.status === 'PAID'" class="py-8 text-center">
            <svg class="mx-auto mb-4 h-24 w-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 class="mb-2 text-2xl font-bold text-green-600">Payment successful!</h2>
            <p class="mb-6 text-gray-600">Your order has been confirmed.</p>

            <button
              @click="continueShopping"
              class="rounded-full bg-black px-6 py-3 text-white hover:bg-gray-800"
            >
              Continue shopping
            </button>
          </div>

          <div class="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div class="mb-3">
              <h3 class="font-semibold">Secure bank transfer details</h3>
              <p class="mt-1 text-xs text-blue-900/70">
                Use the exact transfer content below. Do not add your name, phone number, or email.
              </p>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-gray-600">Bank:</span>
                <span class="font-medium">{{ getBankName(paymentOrder.bin) }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-600">Account number:</span>
                <span class="font-medium">{{ paymentOrder.accountNumber }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-600">Account name:</span>
                <span class="font-medium">{{ paymentOrder.accountName }}</span>
              </div>
              <div class="rounded-md bg-white/80 p-3">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <span class="text-gray-600">Transfer content:</span>
                  <button
                    type="button"
                    @click="copyTransferContent"
                    class="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-black"
                  >
                    Copy
                  </button>
                </div>
                <div class="break-all font-mono text-base font-bold text-red-600">
                  {{ paymentOrder.description }}
                </div>
                <p v-if="copyMessage" class="mt-2 text-xs font-medium text-green-700">
                  {{ copyMessage }}
                </p>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-600">Amount:</span>
                <span class="font-bold text-green-600">{{ formatPrice(paymentOrder.amount) }}</span>
              </div>
            </div>
          </div>

          <div class="border-t pt-6">
            <h3 class="mb-4 font-semibold">Order details:</h3>
            <div
              v-for="item in orderItems"
              :key="`${item.productId}-${item.styleCode}-${item.size}`"
              class="mb-3 flex gap-4 border-b pb-3 last:border-0"
            >
              <img
                :src="item.thumbnail || item.image"
                :alt="item.name"
                class="h-16 w-16 rounded object-cover"
              />
              <div class="flex-1">
                <h4 class="text-sm font-medium">{{ item.name }}</h4>
                <p class="text-xs text-gray-600">
                  Size {{ item.size }} - Qty {{ item.quantity }}
                </p>
                <p class="mt-1 text-sm font-semibold">
                  {{ formatPrice(item.price * item.quantity) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadStripe } from '@stripe/stripe-js'
import { getBag, saveBag } from '../../../utils/bagStorage'
import QrcodeVue from 'qrcode.vue'
import { API_BASE } from '../../../utils/apiBase'
import { saveGuestOrderAccessFromOrder } from '../../../utils/guestOrders'

const router = useRouter()

const loading = ref(true)
const paymentOrder = ref(null)
const orderItems = ref([])
const customerInfo = ref(null)
const paymentProvider = ref('payos')
const countdown = ref(600)
const checking = ref(false)
const checkInterval = ref(null)
const countdownInterval = ref(null)
const stripeReady = ref(false)
const stripeMessage = ref('')
const copyMessage = ref('')
const confirmingStripe = ref(false)
const expressCheckoutVisible = ref(false)
const expressCheckoutRef = ref(null)
const paymentElementRef = ref(null)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

let stripeInstance = null
let stripeElements = null
let paymentElement = null
let expressCheckoutElement = null

const isStripePayment = computed(() => paymentProvider.value === 'stripe')

onMounted(async () => {
  loadPaymentData()

  if (isStripePayment.value) {
    if (paymentOrder.value?.status === 'PAID') {
      return
    }

    await nextTick()
    await setupStripe()
    await handleStripeReturn()
    return
  }

  startCountdown()
  startAutoCheck()
})

onUnmounted(() => {
  clearIntervals()
  unmountStripeElements()
})

const loadPaymentData = () => {
  const orderDataStr = localStorage.getItem('pendingOrder')
  if (!orderDataStr) {
    alert('Order not found')
    router.push('/checkout')
    return
  }

  const orderData = JSON.parse(orderDataStr)
  saveGuestOrderAccessFromOrder(orderData)
  paymentOrder.value = orderData.paymentData
  paymentProvider.value = orderData.paymentProvider || orderData.paymentData?.provider || 'payos'
  orderItems.value = orderData.items
  customerInfo.value = orderData.customerInfo
  loading.value = false
}

const setupStripe = async () => {
  stripeMessage.value = ''

  if (!stripePublishableKey || !paymentOrder.value?.clientSecret) {
    stripeReady.value = false
    return
  }

  stripeInstance = await loadStripe(stripePublishableKey)
  if (!stripeInstance) {
    stripeMessage.value = 'Stripe could not be loaded. Please try again.'
    return
  }

  stripeElements = stripeInstance.elements({
    clientSecret: paymentOrder.value.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        borderRadius: '6px',
        colorPrimary: '#111111',
      },
    },
  })

  expressCheckoutElement = stripeElements.create('expressCheckout', {
    buttonHeight: 48,
    buttonTheme: {
      applePay: 'black',
    },
  })

  expressCheckoutElement.on('ready', ({ availablePaymentMethods }) => {
    expressCheckoutVisible.value = !!availablePaymentMethods
  })

  expressCheckoutElement.on('confirm', async () => {
    await submitStripePayment()
  })

  expressCheckoutElement.mount(expressCheckoutRef.value)

  paymentElement = stripeElements.create('payment', {
    layout: 'accordion',
  })
  paymentElement.mount(paymentElementRef.value)
  stripeReady.value = true
}

const unmountStripeElements = () => {
  if (paymentElement) {
    paymentElement.unmount()
    paymentElement = null
  }
  if (expressCheckoutElement) {
    expressCheckoutElement.unmount()
    expressCheckoutElement = null
  }
}

const handleStripeReturn = async () => {
  const params = new URLSearchParams(window.location.search)
  const redirectStatus = params.get('redirect_status')
  const paymentIntentId = params.get('payment_intent') || paymentOrder.value?.paymentIntentId

  if (redirectStatus === 'succeeded' && paymentIntentId) {
    await confirmStripeOnServer(paymentIntentId)
    window.history.replaceState({}, document.title, window.location.pathname)
  }
}

const submitStripePayment = async () => {
  if (!stripeInstance || !stripeElements || paymentOrder.value?.status === 'PAID') return

  confirmingStripe.value = true
  stripeMessage.value = ''

  try {
    const { error: submitError } = await stripeElements.submit()
    if (submitError) {
      stripeMessage.value = submitError.message || 'Please check your payment details.'
      return
    }

    const result = await stripeInstance.confirmPayment({
      elements: stripeElements,
      confirmParams: {
        return_url: `${window.location.origin}/payment`,
      },
      redirect: 'if_required',
    })

    if (result.error) {
      stripeMessage.value = result.error.message || 'Payment failed. Please try again.'
      return
    }

    const paymentIntentId = result.paymentIntent?.id || paymentOrder.value?.paymentIntentId
    if (paymentIntentId) {
      await confirmStripeOnServer(paymentIntentId)
    }
  } catch (error) {
    console.error('Stripe payment error:', error)
    stripeMessage.value = 'Payment failed. Please try again.'
  } finally {
    confirmingStripe.value = false
  }
}

const confirmStripeOnServer = async (paymentIntentId) => {
  const response = await fetch(`${API_BASE}/payments/stripe/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ paymentIntentId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success || data.status !== 'PAID') {
    stripeMessage.value = data.message || 'Payment is not complete yet.'
    return
  }

  markPaymentPaid(data.order)
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

const syncPendingOrderStatus = (status, order = null) => {
  const orderDataStr = localStorage.getItem('pendingOrder')
  if (!orderDataStr) return

  try {
    const orderData = JSON.parse(orderDataStr)
    orderData.paymentData = {
      ...orderData.paymentData,
      ...(order || {}),
      status,
    }
    localStorage.setItem('pendingOrder', JSON.stringify(orderData))
    saveGuestOrderAccessFromOrder(orderData)
  } catch (error) {
    console.error('Could not update pending order status:', error)
  }
}

const markPaymentPaid = (order = null) => {
  paymentOrder.value = {
    ...paymentOrder.value,
    ...(order || {}),
    status: 'PAID',
  }
  stripeMessage.value = ''
  clearIntervals()
  unmountStripeElements()
  syncPendingOrderStatus('PAID', order)
  const orderDataStr = localStorage.getItem('pendingOrder')
  if (orderDataStr) {
    try {
      saveGuestOrderAccessFromOrder(JSON.parse(orderDataStr))
    } catch (error) {
      console.error('Could not save guest order lookup:', error)
    }
  }
  removePurchasedItemsFromBag({ clearPendingOrder: false })
}

const removePurchasedItemsFromBag = ({ clearPendingOrder = true } = {}) => {
  const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems')) || []
  const shoppingBag = getBag()

  if (checkoutItems.length > 0) {
    const checkoutKeys = checkoutItems.map(item =>
      `${item.productId}-${item.styleCode}-${item.size}`
    )

    const updatedBag = shoppingBag.filter(item => {
      const key = `${item.productId}-${item.styleCode}-${item.size}`
      return !checkoutKeys.includes(key)
    })

    saveBag(updatedBag)
  }

  localStorage.removeItem('checkoutItems')
  localStorage.removeItem('deliveryInfo')
  if (clearPendingOrder) {
    localStorage.removeItem('pendingOrder')
  }

  window.dispatchEvent(new Event('bagCountUpdated'))
  window.dispatchEvent(new Event('bagUpdated'))
}

const checkStatus = async () => {
  if (!paymentOrder.value?.paymentLinkId) return

  try {
    const response = await fetch(
      `${API_BASE}/payments/check/${paymentOrder.value.paymentLinkId}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
      }
    )

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) return

    const data = await response.json()

    if (data.success && data.status === 'PAID') {
      markPaymentPaid(data.order)
    }
  } catch (error) {
    console.error('Error checking status:', error)
  }
}

const manualCheckStatus = async () => {
  checking.value = true
  await checkStatus()
  setTimeout(() => {
    checking.value = false
  }, 1000)
}

const copyTransferContent = async () => {
  if (!paymentOrder.value?.description) return

  try {
    await navigator.clipboard.writeText(paymentOrder.value.description)
    copyMessage.value = 'Transfer content copied.'
  } catch (error) {
    copyMessage.value = 'Copy failed. Please copy it manually.'
  }

  setTimeout(() => {
    copyMessage.value = ''
  }, 2500)
}

const continueShopping = () => {
  removePurchasedItemsFromBag({ clearPendingOrder: true })
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
    case 'CANCELLED':
    case 'FAILED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>
