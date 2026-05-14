<template>
  <div class="p-8 mt-16 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Inventory</h1>
        <p class="text-sm text-gray-500 mt-1">Adjust stock and review movement history.</p>
      </div>
      <button @click="fetchInventory" class="px-4 py-2 bg-black text-white rounded-lg font-medium">Refresh</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">Total Stock</p>
        <p class="text-3xl font-bold">{{ overview.totalStock }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">Variants</p>
        <p class="text-3xl font-bold">{{ overview.totalVariants }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">Low Stock</p>
        <p class="text-3xl font-bold text-orange-700">{{ overview.lowStock?.length || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">Out of Stock</p>
        <p class="text-3xl font-bold text-red-700">{{ overview.outOfStock?.length || 0 }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h2 class="text-xl font-bold">Variants</h2>
          <input v-model="search" placeholder="Search product, color, size" class="border rounded-lg px-3 py-2 w-72" />
        </div>

        <div class="overflow-x-auto max-h-[650px]">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-gray-600 sticky top-0">
              <tr>
                <th class="px-5 py-3">Product</th>
                <th class="px-5 py-3">Color</th>
                <th class="px-5 py-3">Size</th>
                <th class="px-5 py-3">Stock</th>
                <th class="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="variant in filteredVariants" :key="`${variant.productId}-${variant.colorName}-${variant.size}`" class="border-b last:border-0">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <img :src="variant.thumbnail || fallbackImage" class="w-12 h-12 object-cover rounded bg-gray-100" />
                    <div>
                      <p class="font-semibold">{{ variant.productName }}</p>
                      <p class="text-xs text-gray-500">#{{ variant.productId }} · {{ variant.category }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3">{{ variant.colorName }}</td>
                <td class="px-5 py-3">{{ variant.size }}</td>
                <td class="px-5 py-3">
                  <span class="font-semibold" :class="variant.stock === 0 ? 'text-red-700' : variant.stock <= 5 ? 'text-orange-700' : 'text-gray-900'">
                    {{ variant.stock }}
                  </span>
                </td>
                <td class="px-5 py-3 text-right">
                  <button @click="selectVariant(variant)" class="px-3 py-2 border rounded-lg hover:bg-gray-50">Adjust</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="space-y-6">
        <form @submit.prevent="adjustStock" class="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 class="text-xl font-bold">Stock Adjustment</h2>
          <div v-if="selectedVariant" class="p-3 bg-gray-50 rounded-lg text-sm">
            <p class="font-semibold">{{ selectedVariant.productName }}</p>
            <p class="text-gray-500">{{ selectedVariant.colorName }} · Size {{ selectedVariant.size }}</p>
            <p class="text-gray-500">Current stock: {{ selectedVariant.stock }}</p>
          </div>
          <p v-else class="text-sm text-gray-500">Select a variant to adjust.</p>

          <select v-model="adjustForm.type" class="input">
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUST">Set Stock</option>
          </select>
          <input v-model.number="adjustForm.quantity" type="number" min="0" required placeholder="Quantity" class="input" />
          <textarea v-model="adjustForm.note" rows="3" placeholder="Note" class="input"></textarea>
          <button :disabled="!selectedVariant || saving" class="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:bg-gray-300">
            {{ saving ? 'Saving...' : 'Save Movement' }}
          </button>
        </form>

        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Recent Movements</h2>
          <div class="space-y-3 max-h-[420px] overflow-y-auto">
            <div v-for="move in overview.movements" :key="move._id" class="border-b pb-3 last:border-0">
              <div class="flex items-center justify-between">
                <p class="font-semibold">{{ move.productName }}</p>
                <span class="text-xs px-2 py-1 rounded-full" :class="movementBadge(move.type)">{{ move.type }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ move.colorName }} · {{ move.size }} · {{ move.beforeStock }} → {{ move.afterStock }}</p>
              <p v-if="move.note" class="text-xs text-gray-600 mt-1">{{ move.note }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'
const fallbackImage = 'https://via.placeholder.com/100'

const overview = ref({ variants: [], movements: [], lowStock: [], outOfStock: [] })
const selectedVariant = ref(null)
const saving = ref(false)
const search = ref('')
const adjustForm = ref({ type: 'IN', quantity: 1, note: '' })

onMounted(fetchInventory)

const filteredVariants = computed(() => {
  const term = search.value.toLowerCase().trim()
  if (!term) return overview.value.variants || []
  return (overview.value.variants || []).filter(item =>
    [item.productName, item.productId, item.colorName, item.size, item.category]
      .some(value => String(value || '').toLowerCase().includes(term))
  )
})

async function fetchInventory() {
  const response = await axios.get(`${API_BASE}/inventory/overview`)
  overview.value = response.data
}

function selectVariant(variant) {
  selectedVariant.value = variant
  adjustForm.value = { type: 'IN', quantity: 1, note: '' }
}

async function adjustStock() {
  if (!selectedVariant.value) return
  saving.value = true
  try {
    await axios.post(`${API_BASE}/inventory/adjust`, {
      productId: selectedVariant.value.productId,
      colorName: selectedVariant.value.colorName,
      size: selectedVariant.value.size,
      ...adjustForm.value,
      createdBy: getCurrentUser()?.username || '',
    })
    await fetchInventory()
    const updated = overview.value.variants.find(item =>
      item.productId === selectedVariant.value.productId &&
      item.colorName === selectedVariant.value.colorName &&
      item.size === selectedVariant.value.size
    )
    selectedVariant.value = updated || null
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to adjust stock')
  } finally {
    saving.value = false
  }
}

function movementBadge(type) {
  return {
    'bg-green-100 text-green-700': type === 'IN',
    'bg-red-100 text-red-700': type === 'OUT',
    'bg-blue-100 text-blue-700': type === 'ADJUST',
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
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
