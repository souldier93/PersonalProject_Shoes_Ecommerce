<template>
  <div class="mt-16 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p class="text-sm text-gray-500 mt-1">Promotion and system controls.</p>
      </div>
      <button @click="fetchCoupons" class="px-4 py-2 bg-black text-white rounded-lg font-medium">
        Refresh
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form @submit.prevent="createCoupon" class="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 class="text-xl font-bold">Create Coupon</h2>

        <input v-model="form.code" required placeholder="Code" class="input" />

        <div class="grid grid-cols-2 gap-3">
          <select v-model="form.type" class="input">
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed amount</option>
          </select>
          <input v-model.number="form.value" required type="number" min="1" placeholder="Value" class="input" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.minOrder" type="number" min="0" placeholder="Min order" class="input" />
          <input v-model.number="form.maxDiscount" type="number" min="0" placeholder="Max discount" class="input" />
        </div>

        <input v-model.number="form.usageLimit" type="number" min="0" placeholder="Usage limit, 0 = unlimited" class="input" />

        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs text-gray-500">
            Starts
            <input v-model="form.startsAt" type="date" class="input mt-1" />
          </label>
          <label class="text-xs text-gray-500">
            Ends
            <input v-model="form.endsAt" type="date" class="input mt-1" />
          </label>
        </div>

        <button type="submit" :disabled="saving" class="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:bg-gray-300">
          {{ saving ? 'Creating...' : 'Create Coupon' }}
        </button>
      </form>

      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h2 class="text-xl font-bold">Coupons</h2>
          <span class="text-sm text-gray-500">{{ coupons.length }} total</span>
        </div>

        <div v-if="loading" class="p-8 text-center text-gray-500">Loading coupons...</div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-gray-600">
              <tr>
                <th class="px-5 py-3">Code</th>
                <th class="px-5 py-3">Discount</th>
                <th class="px-5 py-3">Conditions</th>
                <th class="px-5 py-3">Usage</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coupon in coupons" :key="coupon._id" class="border-b last:border-0">
                <td class="px-5 py-4 font-mono font-semibold">{{ coupon.code }}</td>
                <td class="px-5 py-4">
                  {{ coupon.type === 'PERCENT' ? `${coupon.value}%` : formatPrice(coupon.value) }}
                  <p v-if="coupon.maxDiscount" class="text-xs text-gray-500">Max {{ formatPrice(coupon.maxDiscount) }}</p>
                </td>
                <td class="px-5 py-4">
                  <p>Min {{ formatPrice(coupon.minOrder || 0) }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(coupon.startsAt) }} - {{ formatDate(coupon.endsAt) }}</p>
                </td>
                <td class="px-5 py-4">{{ coupon.usedCount || 0 }} / {{ coupon.usageLimit || '∞' }}</td>
                <td class="px-5 py-4">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                    {{ coupon.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right">
                  <button @click="toggleCoupon(coupon)" class="px-3 py-2 border rounded-lg font-medium hover:bg-gray-50">
                    {{ coupon.active ? 'Disable' : 'Enable' }}
                  </button>
                </td>
              </tr>
              <tr v-if="coupons.length === 0">
                <td colspan="6" class="p-8 text-center text-gray-500">No coupons yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const loading = ref(true)
const saving = ref(false)
const coupons = ref([])
const form = ref({
  code: '',
  type: 'PERCENT',
  value: 10,
  minOrder: 0,
  maxDiscount: 0,
  usageLimit: 0,
  startsAt: '',
  endsAt: '',
})

onMounted(fetchCoupons)

async function fetchCoupons() {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE}/coupons`)
    coupons.value = response.data.coupons || []
  } catch (error) {
    console.error('Failed to load coupons:', error)
  } finally {
    loading.value = false
  }
}

async function createCoupon() {
  saving.value = true
  try {
    await axios.post(`${API_BASE}/coupons`, {
      ...form.value,
      code: form.value.code.toUpperCase(),
      startsAt: form.value.startsAt || undefined,
      endsAt: form.value.endsAt || undefined,
      active: true,
    })
    form.value.code = ''
    await fetchCoupons()
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to create coupon')
  } finally {
    saving.value = false
  }
}

async function toggleCoupon(coupon) {
  await axios.patch(`${API_BASE}/coupons/${coupon._id}`, {
    active: !coupon.active,
  })
  await fetchCoupons()
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0).replace('₫', 'đ')
}

function formatDate(date) {
  if (!date) return 'Anytime'
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
}

.input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.15);
}
</style>
