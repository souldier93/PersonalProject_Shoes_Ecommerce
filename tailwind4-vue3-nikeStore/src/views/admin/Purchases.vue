<template>
  <div class="mt-16 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Purchases Management</h1>
        <p class="text-sm text-gray-500 mt-1">Manage payment and delivery progress for every order.</p>
      </div>

      <button
        @click="fetchOrders"
        class="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
      >
        Refresh
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <button
        v-for="status in statusFilters"
        :key="status.value"
        @click="activeFilter = status.value"
        class="bg-white border rounded-lg p-4 text-left transition"
        :class="activeFilter === status.value ? 'border-black shadow-sm' : 'border-gray-200 hover:border-gray-400'"
      >
        <p class="text-sm text-gray-500">{{ status.label }}</p>
        <p class="text-2xl font-bold mt-1">{{ countByStatus(status.value) }}</p>
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="py-20 text-center text-gray-500">Loading orders...</div>

      <div v-else-if="filteredOrders.length === 0" class="py-20 text-center text-gray-500">
        No orders found.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-600">
              <th class="px-5 py-3">Order</th>
              <th class="px-5 py-3">Customer</th>
              <th class="px-5 py-3">Items</th>
              <th class="px-5 py-3">Payment</th>
              <th class="px-5 py-3">Fulfillment</th>
              <th class="px-5 py-3">Tracking</th>
              <th class="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.orderCode" class="border-b last:border-0 hover:bg-gray-50">
              <td class="px-5 py-4">
                <p class="font-mono font-semibold text-blue-700">#{{ order.orderCode }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-medium">{{ order.customerEmail }}</p>
                <p class="text-xs text-gray-500">{{ order.customerInfo?.phone || 'No phone' }}</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-medium">{{ order.items?.length || 0 }} items</p>
                <p class="text-xs text-gray-500 truncate max-w-52">{{ order.items?.[0]?.name || 'No items' }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="paymentBadge(order.status)">
                  {{ order.status }}
                </span>
                <p class="font-semibold mt-2">{{ formatPrice(order.amount) }}</p>
              </td>
              <td class="px-5 py-4">
                <select
                  v-model="order.fulfillmentStatus"
                  :disabled="!['PAID', 'REFUND_PENDING', 'REFUNDED'].includes(order.status) && order.fulfillmentStatus !== 'CANCELLED'"
                  class="border rounded-lg px-3 py-2 bg-white disabled:bg-gray-100"
                >
                  <option v-for="status in fulfillmentStatuses" :key="status" :value="status">
                    {{ status }}
                  </option>
                </select>
              </td>
              <td class="px-5 py-4">
                <input
                  v-model="order.carrier"
                  placeholder="Carrier"
                  class="w-32 border rounded-md px-2 py-1 mb-2"
                />
                <input
                  v-model="order.trackingCode"
                  placeholder="Tracking code"
                  class="w-36 border rounded-md px-2 py-1"
                />
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="saveFulfillment(order)"
                  class="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-300"
                  :disabled="savingOrder === order.orderCode"
                >
                  {{ savingOrder === order.orderCode ? 'Saving...' : 'Save' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <section class="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h2 class="text-xl font-bold">Return Requests</h2>
        <span class="text-sm text-gray-500">{{ returnRequests.length }} total</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="px-5 py-3">Order</th>
              <th class="px-5 py-3">Product</th>
              <th class="px-5 py-3">Type</th>
              <th class="px-5 py-3">Reason</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in returnRequests" :key="request._id" class="border-b last:border-0">
              <td class="px-5 py-4 font-mono text-blue-700">#{{ request.orderCode }}</td>
              <td class="px-5 py-4">
                <p class="font-semibold">{{ request.productName }}</p>
                <p class="text-xs text-gray-500">{{ request.colorName }} · Size {{ request.size }} · Qty {{ request.quantity }}</p>
              </td>
              <td class="px-5 py-4">{{ request.type }}</td>
              <td class="px-5 py-4">
                <p>{{ request.reason }}</p>
                <p v-if="request.note" class="text-xs text-gray-500">{{ request.note }}</p>
              </td>
              <td class="px-5 py-4">
                <select v-model="request.status" class="border rounded-lg px-3 py-2">
                  <option v-for="status in returnStatuses" :key="status" :value="status">{{ status }}</option>
                </select>
              </td>
              <td class="px-5 py-4 text-right">
                <button @click="saveReturnStatus(request)" class="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800">
                  Save
                </button>
              </td>
            </tr>
            <tr v-if="returnRequests.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-500">No return requests.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const loading = ref(true)
const orders = ref([])
const activeFilter = ref('ALL')
const savingOrder = ref(null)
const returnRequests = ref([])

const fulfillmentStatuses = [
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PACKING',
  'SHIPPING',
  'DELIVERED',
  'RETURN_REQUESTED',
  'REFUNDED',
  'CANCELLED',
]

const returnStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED']

const statusFilters = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const filteredOrders = computed(() => {
  if (activeFilter.value === 'ALL') return orders.value
  return orders.value.filter(order => order.fulfillmentStatus === activeFilter.value)
})

onMounted(fetchOrders)

async function fetchOrders() {
  loading.value = true
  try {
    const [ordersResponse, returnsResponse] = await Promise.all([
      axios.get(`${API_BASE}/payments/orders`),
      axios.get(`${API_BASE}/returns`),
    ])
    const response = ordersResponse
    orders.value = response.data.orders || []
    returnRequests.value = returnsResponse.data.requests || []
  } catch (error) {
    console.error('Failed to load orders:', error)
    alert('Failed to load orders')
  } finally {
    loading.value = false
  }
}

async function saveReturnStatus(request) {
  try {
    const response = await axios.patch(`${API_BASE}/returns/${request._id}/status`, {
      status: request.status,
      adminNote: 'Updated from purchases page',
    })
    const updated = response.data.request
    const index = returnRequests.value.findIndex(item => item._id === updated._id)
    if (index !== -1) returnRequests.value[index] = updated
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to update return request')
  }
}

async function saveFulfillment(order) {
  savingOrder.value = order.orderCode
  try {
    const response = await axios.patch(`${API_BASE}/payments/orders/${order.orderCode}/fulfillment`, {
      fulfillmentStatus: order.fulfillmentStatus,
      carrier: order.carrier,
      trackingCode: order.trackingCode,
      note: `Updated from admin purchases page`,
    })

    const updated = response.data.order
    const index = orders.value.findIndex(item => item.orderCode === updated.orderCode)
    if (index !== -1) {
      orders.value[index] = updated
    }
  } catch (error) {
    console.error('Failed to update fulfillment:', error)
    alert(error.response?.data?.message || 'Failed to update fulfillment')
  } finally {
    savingOrder.value = null
  }
}

function countByStatus(status) {
  if (status === 'ALL') return orders.value.length
  return orders.value.filter(order => order.fulfillmentStatus === status).length
}

function paymentBadge(status) {
  return {
    'bg-green-100 text-green-700': status === 'PAID',
    'bg-yellow-100 text-yellow-700': status === 'PENDING' || status === 'REFUND_PENDING',
    'bg-red-100 text-red-700': status === 'FAILED',
    'bg-gray-100 text-gray-700': status === 'CANCELLED' || status === 'REFUNDED',
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0).replace('₫', 'đ')
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
