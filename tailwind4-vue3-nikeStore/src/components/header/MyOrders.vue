<template>
  <div class="mt-10 min-h-screen bg-gray-50 px-4 py-6 sm:mt-16 sm:py-8">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">My Orders</h1>

      <div v-if="isGuestOrderView" class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">Guest order lookup</h2>
          <p class="mt-1 text-sm text-gray-500">
            For security, guest orders require the checkout email and order code.
          </p>
        </div>

        <form @submit.prevent="submitGuestLookup" class="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <input
            v-model="guestLookup.email"
            type="email"
            autocomplete="email"
            placeholder="Checkout email"
            class="rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <input
            v-model="guestLookup.orderCode"
            type="text"
            inputmode="numeric"
            placeholder="Order code"
            class="rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            type="submit"
            :disabled="guestLookupLoading"
            class="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {{ guestLookupLoading ? 'Checking...' : 'Find order' }}
          </button>
        </form>

        <p v-if="guestLookupError" class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {{ guestLookupError }}
        </p>
        <p v-if="guestLookupSuccess" class="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {{ guestLookupSuccess }}
        </p>
      </div>

      <p v-if="orderActionMessage" class="mb-6 rounded-md bg-green-50 p-3 text-sm text-green-700">
        {{ orderActionMessage }}
      </p>
      <p v-if="orderActionError" class="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
        {{ orderActionError }}
      </p>

      <div v-if="loading" class="flex h-64 items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>

      <div v-else-if="orders.length === 0" class="py-16 text-center">
        <svg class="mx-auto mb-4 h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h2 class="mb-2 text-2xl font-semibold text-gray-600">
          {{ isGuestOrderView ? 'No guest orders found' : 'No Orders Yet' }}
        </h2>
        <p class="mb-6 text-gray-500">
          {{ isGuestOrderView ? 'Enter your checkout email and order code above to view your purchase history.' : 'Start shopping to see your orders here!' }}
        </p>
        <router-link
          v-if="!isGuestOrderView"
          to="/"
          class="inline-block rounded-full bg-black px-6 py-3 text-white transition hover:bg-gray-800"
        >
          Start Shopping
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <div v-for="order in orders" :key="order.orderCode" class="overflow-hidden rounded-lg bg-white shadow-md">
          <div class="flex flex-col gap-3 border-b bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div class="flex flex-wrap items-center gap-3">
              <div>
                <p class="text-sm text-gray-600">Order #{{ order.orderCode }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="paymentBadgeClass(order.status)">
                {{ order.status }}
              </span>
              <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {{ order.fulfillmentStatus || 'AWAITING_PAYMENT' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <button
                v-if="canCancelOrder(order)"
                @click="openCancelModal(order)"
                class="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-600 hover:bg-red-50"
              >
                Cancel & Refund
              </button>
              <button @click="viewOrderDetail(order)" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                View Details
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="space-y-4">
              <div
                v-for="(item, idx) in order.items"
                :key="idx"
                class="flex gap-4 border-b pb-4 last:border-0"
              >
                <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  <img
                    v-if="getItemImage(item)"
                    :src="getItemImage(item)"
                    :alt="item.name"
                    class="h-full w-full object-cover"
                    @error="handleImageError"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                    <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
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

            <div class="mt-4 flex items-center justify-between border-t pt-4">
              <span class="text-gray-600">Total</span>
              <span class="text-2xl font-bold">{{ formatPrice(order.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-50 flex justify-end overflow-hidden bg-white/75 p-0 backdrop-blur-sm sm:p-4"
      @click.self="selectedOrder = null"
    >
      <div class="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-gray-200 sm:h-[calc(100vh-2rem)] sm:rounded-xl">
        <div class="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 class="text-2xl font-bold">Order Details</h2>
            <p class="text-sm text-gray-500">Order #{{ selectedOrder.orderCode }}</p>
          </div>
          <button @click="selectedOrder = null" class="text-gray-400 hover:text-gray-600" aria-label="Close order detail">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto p-6">
          <div class="flex justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <h3 class="mb-1 text-sm text-gray-600">Status</h3>
              <span class="inline-flex rounded-full px-3 py-1 text-sm font-semibold" :class="paymentBadgeClass(selectedOrder.status)">
                {{ selectedOrder.status }}
              </span>
            </div>
            <div class="text-right">
              <h3 class="mb-1 text-sm text-gray-600">Order Date</h3>
              <p class="font-medium">{{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
          </div>

          <div v-if="selectedOrder.status === 'REFUND_PENDING'" class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Refund is pending manual bank transfer processing by the store team.
          </div>

          <div v-else-if="selectedOrder.status === 'REFUNDED'" class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            This order has been cancelled and refunded.
          </div>

          <div v-else-if="canCancelOrder(selectedOrder)" class="rounded-lg border border-red-100 bg-red-50 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="font-semibold text-red-800">Cancel this order</h3>
                <p class="mt-1 text-sm text-red-700">
                  Orders can be cancelled only while they are being prepared.
                </p>
              </div>
              <button
                @click="openCancelModal(selectedOrder)"
                class="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Cancel & Refund
              </button>
            </div>
          </div>

          <div v-else-if="cancelBlockedReason(selectedOrder)" class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            {{ cancelBlockedReason(selectedOrder) }}
          </div>

          <div v-if="selectedOrder.customerInfo">
            <h3 class="mb-3 flex items-center gap-2 font-semibold">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Information
            </h3>
            <div class="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <p>
                <span class="text-gray-600">Name:</span>
                <span class="font-medium">{{ selectedOrder.customerInfo.firstName }} {{ selectedOrder.customerInfo.lastName }}</span>
              </p>
              <p>
                <span class="text-gray-600">Phone:</span>
                <span class="font-medium">{{ selectedOrder.customerInfo.phone }}</span>
              </p>
              <p>
                <span class="text-gray-600">Address:</span>
                <span class="font-medium">{{ selectedOrder.customerInfo.address }}</span>
              </p>
              <p v-if="selectedOrder.customerInfo.city">
                <span class="text-gray-600">City:</span>
                <span class="font-medium">{{ selectedOrder.customerInfo.city }} {{ selectedOrder.customerInfo.postalCode }}</span>
              </p>
            </div>
          </div>

          <div>
            <h3 class="mb-3 font-semibold">Items ({{ selectedOrder.items.length }})</h3>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in selectedOrder.items"
                :key="idx"
                class="flex gap-4 rounded-lg bg-gray-50 p-3"
              >
                <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  <img
                    v-if="getItemImage(item)"
                    :src="getItemImage(item)"
                    :alt="item.name"
                    class="h-full w-full object-cover"
                    @error="handleImageError"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                    <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h4 class="font-medium">{{ item.name }}</h4>
                  <p class="text-sm text-gray-600">{{ item.colorName }} | Size {{ item.size }}</p>
                  <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                  <button
                    v-if="selectedOrder.status === 'PAID' && currentUser"
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeReviewModal"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">Write Review</h2>
            <p class="text-sm text-gray-500">{{ reviewModal.item?.name }}</p>
          </div>
          <button @click="closeReviewModal" class="text-gray-400 hover:text-gray-600" aria-label="Close review modal">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="mb-4 flex gap-2">
          <button
            v-for="star in 5"
            :key="star"
            @click="reviewForm.rating = star"
            class="text-3xl"
            :class="star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'"
          >
            *
          </button>
        </div>

        <textarea
          v-model="reviewForm.comment"
          rows="5"
          class="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Share your experience with this shoe..."
        ></textarea>

        <div class="mt-5 flex justify-end gap-3">
          <button @click="closeReviewModal" class="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200">
            Cancel
          </button>
          <button
            @click="submitReview"
            :disabled="reviewSubmitting"
            class="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            {{ reviewSubmitting ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="returnModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeReturnModal"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">Return / Exchange</h2>
            <p class="text-sm text-gray-500">{{ returnModal.item?.name }}</p>
          </div>
          <button @click="closeReturnModal" class="text-gray-400 hover:text-gray-600" aria-label="Close return modal">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <select v-model="returnForm.type" class="w-full rounded-lg border p-3">
            <option value="RETURN">Return</option>
            <option value="EXCHANGE">Exchange</option>
            <option value="REFUND">Refund</option>
          </select>
          <input v-model.number="returnForm.quantity" type="number" min="1" class="w-full rounded-lg border p-3" placeholder="Quantity" />
          <input v-model="returnForm.reason" class="w-full rounded-lg border p-3" placeholder="Reason" />
          <textarea v-model="returnForm.note" rows="4" class="w-full rounded-lg border p-3" placeholder="Add detail for the store team"></textarea>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button @click="closeReturnModal" class="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200">
            Cancel
          </button>
          <button
            @click="submitReturnRequest"
            :disabled="returnSubmitting"
            class="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            {{ returnSubmitting ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="cancelModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeCancelModal"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">Cancel & Refund</h2>
            <p class="text-sm text-gray-500">Order #{{ cancelModal.order?.orderCode }}</p>
          </div>
          <button @click="closeCancelModal" class="text-gray-400 hover:text-gray-600" aria-label="Close cancel modal">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          You can cancel only before the order ships. Stripe card payments are refunded automatically; bank transfer refunds are processed manually by the store team.
        </div>

        <textarea
          v-model="cancelReason"
          rows="4"
          class="mt-4 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Reason for cancellation"
        ></textarea>

        <div class="mt-5 flex justify-end gap-3">
          <button @click="closeCancelModal" class="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200">
            Keep order
          </button>
          <button
            @click="submitCancelRefund"
            :disabled="cancelSubmitting"
            class="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
          >
            {{ cancelSubmitting ? 'Cancelling...' : 'Confirm cancel' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'
import {
  normalizeGuestEmail,
  normalizeGuestOrderCode,
  readGuestOrderAccess,
  saveGuestOrderAccess,
} from '../../utils/guestOrders'

const loading = ref(true)
const orders = ref([])
const selectedOrder = ref(null)
const savedGuestAccess = ref([])
const guestLookup = ref({
  email: '',
  orderCode: '',
})
const guestLookupError = ref('')
const guestLookupSuccess = ref('')
const guestLookupLoading = ref(false)
const orderActionMessage = ref('')
const orderActionError = ref('')
const cancelSubmitting = ref(false)
const cancelReason = ref('')
const cancelModal = ref({
  open: false,
  order: null,
})
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
const productImages = ref({})

const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    localStorage.removeItem('user')
    return null
  }
})

const isGuestOrderView = computed(() => !currentUser.value)

onMounted(async () => {
  if (isGuestOrderView.value) {
    savedGuestAccess.value = readGuestOrderAccess()

    if (savedGuestAccess.value[0]) {
      guestLookup.value = { ...savedGuestAccess.value[0] }
    }

    await fetchSavedGuestOrders()
    return
  }

  await fetchOrders()
})

const getRequestHeaders = () => {
  const token = localStorage.getItem('authToken')
  const headers = {
    'ngrok-skip-browser-warning': 'true',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const fetchOrders = async () => {
  loading.value = true

  try {
    if (!currentUser.value?._id) {
      orders.value = []
      return
    }

    const response = await axios.get(
      `${API_BASE}/payments/user/${currentUser.value._id}/orders`,
      { headers: getRequestHeaders() },
    )

    orders.value = response.data?.orders || []
    await loadProductImages()
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const mergeOrdersByCode = (newOrders) => {
  const byCode = new Map()

  ;[...newOrders, ...orders.value].forEach((order) => {
    if (order?.orderCode) {
      byCode.set(String(order.orderCode), order)
    }
  })

  orders.value = Array.from(byCode.values()).sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
}

const lookupGuestOrder = async (record) => {
  const email = normalizeGuestEmail(record.email)
  const orderCode = normalizeGuestOrderCode(record.orderCode)

  if (!email || !orderCode) return []

  const response = await axios.post(
    `${API_BASE}/payments/guest/orders/lookup`,
    { email, orderCode },
    {
      headers: {
        ...getRequestHeaders(),
        'Content-Type': 'application/json',
      },
    },
  )

  return response.data?.orders || []
}

const fetchSavedGuestOrders = async () => {
  loading.value = true
  guestLookupError.value = ''
  guestLookupSuccess.value = ''

  try {
    if (savedGuestAccess.value.length === 0) {
      orders.value = []
      return
    }

    const foundOrders = []

    for (const record of savedGuestAccess.value) {
      try {
        foundOrders.push(...await lookupGuestOrder(record))
      } catch (error) {
        console.error('Could not load saved guest order:', error)
      }
    }

    mergeOrdersByCode(foundOrders)
    await loadProductImages()
  } finally {
    loading.value = false
  }
}

const submitGuestLookup = async () => {
  const record = {
    email: normalizeGuestEmail(guestLookup.value.email),
    orderCode: normalizeGuestOrderCode(guestLookup.value.orderCode),
  }

  guestLookupError.value = ''
  guestLookupSuccess.value = ''

  if (!record.email || !record.orderCode) {
    guestLookupError.value = 'Enter the checkout email and order code.'
    return
  }

  guestLookupLoading.value = true

  try {
    const foundOrders = await lookupGuestOrder(record)

    if (foundOrders.length === 0) {
      guestLookupError.value = 'No order matches that email and order code.'
      return
    }

    savedGuestAccess.value = saveGuestOrderAccess(record)
    guestLookup.value = record
    mergeOrdersByCode(foundOrders)
    await loadProductImages()
    guestLookupSuccess.value = 'Order loaded.'
  } catch (error) {
    guestLookupError.value = error.response?.data?.message || 'Could not find that guest order.'
  } finally {
    guestLookupLoading.value = false
    loading.value = false
  }
}

const loadProductImages = async () => {
  const uniqueProducts = new Set()

  orders.value.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      if (item.productId) {
        uniqueProducts.add(item.productId)
      }
    })
  })

  for (const productId of uniqueProducts) {
    if (productImages.value[productId]) continue

    try {
      const response = await axios.get(`${API_BASE}/shoes/detail/${productId}`)
      productImages.value[productId] = response.data
    } catch (error) {
      console.error(`Error loading product ${productId}:`, error)
    }
  }
}

const getItemImage = (item) => {
  const productDetail = productImages.value[item.productId]
  if (!productDetail) return null

  const color = productDetail.colors?.find((entry) => entry.colorName === item.colorName)
  if (!color) return null

  return color.thumbnail || color.images?.[0] || null
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const viewOrderDetail = (order) => {
  selectedOrder.value = order
}

const canCancelOrder = (order) => {
  return (
    order?.status === 'PAID' &&
    ['CONFIRMED', 'PACKING'].includes(order.fulfillmentStatus || '')
  )
}

const cancelBlockedReason = (order) => {
  if (!order || canCancelOrder(order)) return ''
  if (['SHIPPING', 'DELIVERED'].includes(order.fulfillmentStatus || '')) {
    return 'This order has already shipped and can no longer be cancelled or refunded.'
  }
  if (['REFUND_PENDING', 'REFUNDED'].includes(order.status || '')) {
    return ''
  }
  if (order.status === 'PAID') {
    return 'This order is not currently in the preparation stage.'
  }
  return ''
}

const openCancelModal = (order) => {
  cancelModal.value = {
    open: true,
    order,
  }
  cancelReason.value = ''
  orderActionError.value = ''
  orderActionMessage.value = ''
}

const closeCancelModal = () => {
  cancelModal.value = {
    open: false,
    order: null,
  }
  cancelReason.value = ''
}

const replaceOrder = (updatedOrder) => {
  const index = orders.value.findIndex(order => order.orderCode === updatedOrder.orderCode)
  if (index !== -1) {
    orders.value[index] = updatedOrder
  }
  if (selectedOrder.value?.orderCode === updatedOrder.orderCode) {
    selectedOrder.value = updatedOrder
  }
}

const submitCancelRefund = async () => {
  const order = cancelModal.value.order
  if (!order) return

  cancelSubmitting.value = true
  orderActionError.value = ''
  orderActionMessage.value = ''

  try {
    const body = {
      reason: cancelReason.value,
    }

    if (currentUser.value?._id) {
      body.userId = currentUser.value._id
    } else {
      body.email = order.customerEmail || guestLookup.value.email
    }

    const response = await axios.post(
      `${API_BASE}/payments/orders/${order.orderCode}/cancel-refund`,
      body,
      {
        headers: {
          ...getRequestHeaders(),
          'Content-Type': 'application/json',
        },
      },
    )

    replaceOrder(response.data.order)
    orderActionMessage.value = response.data.message || 'Order cancelled.'
    closeCancelModal()
  } catch (error) {
    orderActionError.value = error.response?.data?.message || 'Could not cancel this order.'
  } finally {
    cancelSubmitting.value = false
  }
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

const paymentBadgeClass = (status) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'REFUND_PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
