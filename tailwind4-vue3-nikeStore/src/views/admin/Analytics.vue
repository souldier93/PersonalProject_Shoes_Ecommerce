<template>
  <div class="mt-16 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Analytics</h1>
        <p class="text-sm text-gray-500 mt-1">Revenue, products, fulfillment, and inventory signals.</p>
      </div>
      <button @click="fetchAnalytics" class="px-4 py-2 bg-black text-white rounded-lg font-medium">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="py-20 text-center text-gray-500">Loading analytics...</div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">{{ card.label }}</p>
          <p class="text-2xl font-bold mt-2">{{ card.value }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ card.hint }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Revenue by Day</h2>
          <div class="space-y-3">
            <div v-for="day in data.salesByDay" :key="day.date" class="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[96px_1fr_120px]">
              <span class="text-xs text-gray-500">{{ day.date }}</span>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-black rounded-full" :style="{ width: percent(day.revenue, maxDailyRevenue) + '%' }"></div>
              </div>
              <span class="text-right text-sm font-semibold sm:block col-span-2 sm:col-span-1">{{ formatPrice(day.revenue) }}</span>
            </div>
            <p v-if="!data.salesByDay?.length" class="text-sm text-gray-500">No paid revenue yet.</p>
          </div>
        </section>

        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Revenue by Category</h2>
          <div class="space-y-3">
            <div v-for="item in data.revenueByCategory" :key="item.category" class="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[96px_1fr_120px]">
              <span class="text-sm capitalize">{{ item.category }}</span>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full" :style="{ width: percent(item.revenue, maxCategoryRevenue) + '%' }"></div>
              </div>
              <span class="text-right text-sm font-semibold col-span-2 sm:col-span-1">{{ formatPrice(item.revenue) }}</span>
            </div>
            <p v-if="!data.revenueByCategory?.length" class="text-sm text-gray-500">No category revenue yet.</p>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Top Products</h2>
          <div class="space-y-3">
            <div v-for="product in data.topProducts" :key="product.productId" class="border-b pb-3 last:border-0">
              <p class="font-semibold">{{ product.name }}</p>
              <p class="text-xs text-gray-500">{{ product.quantity }} sold · {{ formatPrice(product.revenue) }}</p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Top Sizes</h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="item in data.topSizes" :key="item.size" class="px-3 py-2 rounded-full bg-gray-100 text-sm font-medium">
              {{ item.size }} · {{ item.quantity }}
            </span>
          </div>
        </section>

        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Fulfillment</h2>
          <div class="space-y-2">
            <div v-for="item in data.fulfillmentBreakdown" :key="item.status" class="flex items-center justify-between text-sm">
              <span>{{ item.status }}</span>
              <span class="font-semibold">{{ item.count }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold">Low Stock</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-gray-600">
              <tr>
                <th class="px-5 py-3">Product</th>
                <th class="px-5 py-3">Color</th>
                <th class="px-5 py-3">Size</th>
                <th class="px-5 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.lowStockProducts" :key="`${item.productId}-${item.colorName}-${item.size}`" class="border-b last:border-0">
                <td class="px-5 py-3 font-medium">{{ item.name }}</td>
                <td class="px-5 py-3">{{ item.colorName }}</td>
                <td class="px-5 py-3">{{ item.size }}</td>
                <td class="px-5 py-3 text-orange-700 font-semibold">{{ item.stock }}</td>
              </tr>
              <tr v-if="!data.lowStockProducts?.length">
                <td colspan="4" class="p-8 text-center text-gray-500">No low-stock variants.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const loading = ref(true)
const data = ref({
  summary: {},
  salesByDay: [],
  revenueByCategory: [],
  topProducts: [],
  topSizes: [],
  fulfillmentBreakdown: [],
  lowStockProducts: [],
})

onMounted(fetchAnalytics)

const summaryCards = computed(() => [
  { label: 'Revenue', value: formatPrice(data.value.summary.totalRevenue), hint: 'Paid orders' },
  { label: 'Paid Orders', value: data.value.summary.paidOrders || 0, hint: `${data.value.summary.totalOrders || 0} total` },
  { label: 'AOV', value: formatPrice(data.value.summary.averageOrderValue), hint: 'Average order value' },
  { label: 'Discounts', value: formatPrice(data.value.summary.totalDiscount), hint: 'Coupon savings' },
  { label: 'Paid Rate', value: `${data.value.summary.conversionToPaid || 0}%`, hint: 'Paid / total orders' },
])

const maxDailyRevenue = computed(() => Math.max(...(data.value.salesByDay || []).map(item => item.revenue), 1))
const maxCategoryRevenue = computed(() => Math.max(...(data.value.revenueByCategory || []).map(item => item.revenue), 1))

async function fetchAnalytics() {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE}/analytics/overview`)
    data.value = response.data
  } catch (error) {
    console.error('Failed to load analytics:', error)
  } finally {
    loading.value = false
  }
}

function percent(value, max) {
  return Math.max(4, Math.round((Number(value || 0) / Number(max || 1)) * 100))
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0).replace('₫', 'đ')
}
</script>
