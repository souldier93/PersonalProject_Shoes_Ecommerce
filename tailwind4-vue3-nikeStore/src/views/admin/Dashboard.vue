<template>
  <div class="p-8 mt-16 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Products -->
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-gray-500 text-sm font-medium">Total Products</h3>
            <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.totalProducts }}</p>
          <p class="text-sm text-gray-500 mt-2">Total items in stock: {{ stats.totalStock }}</p>
        </div>
        
        <!-- Total Orders -->
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-gray-500 text-sm font-medium">Total Orders</h3>
            <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.totalOrders }}</p>
          <p class="text-sm text-green-600 mt-2">{{ stats.paidOrders }} paid orders</p>
        </div>
        
        <!-- Pending Orders -->
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-gray-500 text-sm font-medium">Pending Orders</h3>
            <svg class="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.totalOrders - stats.paidOrders }}</p>
          <p class="text-sm text-yellow-600 mt-2">Awaiting payment</p>
        </div>
        
        <!-- Total Revenue -->
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-gray-500 text-sm font-medium">Revenue</h3>
            <svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ formatPrice(stats.totalRevenue) }}</p>
          <p class="text-sm text-green-600 mt-2">From paid orders</p>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-bold mb-4">Recent Orders</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b">
              <tr class="text-left text-sm text-gray-600">
                <th class="pb-3">Order Code</th>
                <th class="pb-3">Customer</th>
                <th class="pb-3">Products</th>
                <th class="pb-3">Amount</th>
                <th class="pb-3">Status</th>
                <th class="pb-3">Date</th>
                <th class="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr v-for="order in recentOrders" :key="order.orderCode" class="border-b hover:bg-gray-50">
                <td class="py-3 font-mono text-blue-600">#{{ order.orderCode }}</td>
                <td class="py-3">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-800">{{ order.customerEmail }}</span>
                    <span class="text-xs text-gray-500">
                      {{ order.userId ? '👤 User' : '👥 Guest' }}
                    </span>
                  </div>
                </td>
                <td class="py-3">
                  <div class="flex flex-col gap-1">
                    <span class="text-gray-600">{{ order.items?.length || 0 }} items</span>
                    <span v-if="order.items?.[0]" class="text-xs text-gray-400">
                      {{ order.items[0].name }}
                      <span v-if="order.items.length > 1">+{{ order.items.length - 1 }} more</span>
                    </span>
                  </div>
                </td>
                <td class="py-3 font-semibold">{{ formatPrice(order.amount) }}</td>
                <td class="py-3">
                  <span 
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-600': order.status === 'PAID',
                      'bg-yellow-100 text-yellow-600': order.status === 'PENDING',
                      'bg-red-100 text-red-600': order.status === 'FAILED',
                      'bg-gray-100 text-gray-600': order.status === 'CANCELLED'
                    }">
                    {{ order.status }}
                  </span>
                </td>
                <td class="py-3 text-gray-600">{{ formatDate(order.createdAt) }}</td>
                <td class="py-3">
                  <button 
                    @click="viewOrderDetails(order)"
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="7" class="py-8 text-center text-gray-400">
                  No orders yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ✅ Order Details Modal -->
    <div 
      v-if="showOrderModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showOrderModal = false"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Order Details</h2>
            <p class="text-sm text-gray-500">Order #{{ selectedOrder?.orderCode }}</p>
          </div>
          <button 
            @click="showOrderModal = false"
            class="text-gray-400 hover:text-gray-600 transition"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Order Status -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-1">Order Status</h3>
                <span 
                  class="inline-flex px-3 py-1 rounded-full text-sm font-semibold"
                  :class="{
                    'bg-green-100 text-green-700': selectedOrder?.status === 'PAID',
                    'bg-yellow-100 text-yellow-700': selectedOrder?.status === 'PENDING',
                    'bg-red-100 text-red-700': selectedOrder?.status === 'FAILED',
                    'bg-gray-100 text-gray-700': selectedOrder?.status === 'CANCELLED'
                  }">
                  {{ selectedOrder?.status }}
                </span>
              </div>
              <div class="text-right">
                <h3 class="text-sm font-medium text-gray-600 mb-1">Order Date</h3>
                <p class="text-sm font-medium">{{ formatDate(selectedOrder?.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Customer Information -->
          <div>
            <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Customer Information
            </h3>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Type:</span>
                <span class="font-medium">{{ selectedOrder?.userId ? '👤 Registered User' : '👥 Guest' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Email:</span>
                <span class="font-medium">{{ selectedOrder?.customerEmail }}</span>
              </div>
              <div v-if="selectedOrder?.customerInfo" class="border-t pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Name:</span>
                  <span class="font-medium">
                    {{ selectedOrder.customerInfo.firstName }} {{ selectedOrder.customerInfo.lastName }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Phone:</span>
                  <span class="font-medium">{{ selectedOrder.customerInfo.phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Address:</span>
                  <span class="font-medium text-right">{{ selectedOrder.customerInfo.address }}</span>
                </div>
                <div v-if="selectedOrder.customerInfo.city || selectedOrder.customerInfo.postalCode" 
                     class="flex justify-between">
                  <span class="text-gray-600">City/Postal:</span>
                  <span class="font-medium">
                    {{ selectedOrder.customerInfo.city }} {{ selectedOrder.customerInfo.postalCode }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div>
            <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Order Items ({{ selectedOrder?.items?.length || 0 }})
            </h3>
            <div class="space-y-3">
              <div 
                v-for="(item, idx) in selectedOrder?.items" 
                :key="idx"
                class="flex gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <h4 class="font-medium text-gray-800">{{ item.name }}</h4>
                  <div class="text-sm text-gray-600 mt-1 space-y-1">
                    <p>Color: <span class="font-medium">{{ item.colorName }}</span></p>
                    <p>Size: <span class="font-medium">{{ item.size }}</span></p>
                    <p>Quantity: <span class="font-medium">{{ item.quantity }}</span></p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">Unit Price</p>
                  <p class="font-semibold">{{ formatPrice(item.price) }}</p>
                  <p class="text-sm text-gray-600 mt-2">Total</p>
                  <p class="font-bold text-green-600">{{ formatPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="border-t pt-4">
            <h3 class="text-lg font-semibold mb-3">Payment Summary</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">{{ formatPrice(calculateSubtotal(selectedOrder?.items)) }}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span class="text-green-600">{{ formatPrice(selectedOrder?.amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Link ID -->
          <div v-if="selectedOrder?.paymentLinkId" class="bg-blue-50 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-1">Payment Link ID</p>
            <p class="font-mono text-sm text-blue-600">{{ selectedOrder.paymentLinkId }}</p>
          </div>

          <!-- Transaction Data -->
          <div v-if="selectedOrder?.transactionData" class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold mb-2 text-sm text-gray-700">Transaction Details</h4>
            <pre class="text-xs bg-white p-3 rounded border overflow-auto">{{ JSON.stringify(selectedOrder.transactionData, null, 2) }}</pre>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button 
            @click="showOrderModal = false"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
          >
            Close
          </button>
          <button 
            v-if="selectedOrder?.status === 'PAID'"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const stats = ref({
  totalProducts: 0,
  totalOrders: 0,
  paidOrders: 0,
  totalRevenue: 0,
  totalStock: 0
})
const recentOrders = ref([])
const showOrderModal = ref(false)
const selectedOrder = ref(null)

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/shoes/stats/dashboard')
    const data = response.data
    
    stats.value = {
      totalProducts: data.totalProducts,
      totalOrders: data.totalOrders,
      paidOrders: data.paidOrders,
      totalRevenue: data.totalRevenue,
      totalStock: data.totalStock
    }
    
    recentOrders.value = data.recentOrders || []
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
  } finally {
    loading.value = false
  }
})

// ✅ View order details
const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showOrderModal.value = true
}

// ✅ Calculate subtotal
const calculateSubtotal = (items) => {
  if (!items) return 0
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price).replace('₫', 'đ')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
