<template>
  <div class="p-8 mt-16 bg-gray-50 min-h-screen">
    <div class="grid grid-cols-12 gap-6">
      <!-- LEFT SIDE - Products List -->
      <div class="col-span-7">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold">Products</h1>
        </div>

        <!-- Search and Add Button -->
        <div class="flex items-center justify-between mb-6">
          <div class="relative flex-1 max-w-md">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" type="text" placeholder="Search product..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <button @click="openAddProductModal"
            class="ml-4 flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="font-medium">Add New Product</span>
          </button>

          <!-- Add Product Modal -->
          <AddProductForm :is-open="showAddProductModal" @close="showAddProductModal = false"
            @success="handleProductAdded" />
        </div>

        <!-- Category Filters -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button v-for="category in categories" :key="category.value" @click="selectedCategory = category.value"
            class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors" :class="selectedCategory === category.value
              ? 'bg-gray-900 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'">
            {{ category.label }}
          </button>

          <!-- Sort Button -->
          <button @click="toggleSort"
            class="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="text-sm font-medium">Sort by</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div v-for="product in filteredProducts" :key="product._id" @click="selectProduct(product)"
            @mouseenter="showProductCard(product, $event)" @mouseleave="hideProductCard"
            class="bg-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 relative"
            :class="selectedProduct?._id === product._id ? 'border-black' : 'border-transparent'">
            <!-- Product Image -->
            <div class="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
              <img :src="product.thumbnail || '/placeholder-shoe.png'" :alt="product.name"
                class="w-full h-full object-cover" />
            </div>

            <!-- Product Info -->
            <h3 class="font-semibold text-sm mb-1 line-clamp-2">{{ product.name }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ formatPrice(product.price) }}</p>

            <!-- Stock and Sold -->
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Stock <span class="font-semibold text-gray-900">{{ product.stock || 0 }}</span></span>
              <span>Sold <span class="font-semibold text-gray-900">{{ product.sold || 0 }}</span></span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            Showing {{ currentPage * 10 - 9 }} to {{ Math.min(currentPage * 10, totalProducts) }} of {{ totalProducts }}
            results
          </p>

          <div class="flex items-center gap-2">
            <button @click="previousPage" :disabled="currentPage === 1"
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button v-for="page in visiblePages" :key="page" @click="currentPage = page"
              class="px-3 py-1 rounded transition-colors" :class="currentPage === page
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100'">
              {{ page }}
            </button>

            <button @click="nextPage" :disabled="currentPage === totalPages"
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDE - Edit Product Form -->
      <div class="col-span-5">
        <div class="bg-white rounded-xl p-6 sticky top-20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Edit Products</h2>
            <button v-if="selectedProduct" @click="viewFullDetail"
              class="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <span>See full view</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div v-if="!selectedProduct" class="text-center py-12 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Select a product to edit</p>
          </div>

          <div v-else>
            <!-- Tabs -->
            <div class="flex gap-1 mb-6 border-b">
              <button v-for="tab in tabs" :key="tab" @click="activeTab = tab"
                class="px-4 py-2 text-sm font-medium transition-colors border-b-2" :class="activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'">
                {{ tab }}
              </button>
            </div>

            <!-- Tab Content -->
            <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <!-- Description Tab -->
              <div v-show="activeTab === 'Descriptions'">
                <!-- Product Image -->
                <div class="mb-4">
                  <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img :src="editForm.thumbnail" :alt="editForm.name" class="w-full h-full object-cover" />
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input v-model="editForm.name" type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea v-model="editForm.description" rows="4"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"></textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select v-model="editForm.category"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Inventory Tab -->
              <div v-show="activeTab === 'Inventory'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input v-model.number="editForm.stock" type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Sold</label>
                  <input v-model.number="editForm.sold" type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    disabled />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <input v-model="editForm.productId" type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled />
                </div>
              </div>

              <!-- Pricing Tab -->
              <div v-show="activeTab === 'Pricing'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input v-model.number="editForm.price" type="number"
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input v-model.number="editForm.discount" type="number" min="0" max="100"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>

                <div class="bg-gray-50 p-3 rounded-lg">
                  <p class="text-sm text-gray-600">Final Price:</p>
                  <p class="text-2xl font-bold">{{ formatPrice(finalPrice) }}</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6 pt-6 border-t">
              <button @click="discardChanges"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Discard
              </button>
              <button @click="updateProduct"
                class="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Update Product
              </button>
            </div>
          </div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="hoveredProduct" class="fixed bg-black text-white rounded-xl shadow-2xl p-6 z-50 min-w-[280px]"
          :style="cardPosition">
          <!-- Card Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="font-semibold">ProductCard</span>
            </div>
            <button @click="hideProductCard" class="text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <!-- Product Details -->
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-gray-400 text-sm">ProductName</span>
              <span class="text-right font-medium max-w-[150px] truncate">{{ hoveredProduct.name }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">ProductPrice</span>
              <span class="font-medium">{{ formatPrice(hoveredProduct.price) }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">StockTotal</span>
              <span class="font-bold">{{ hoveredProduct.stock || 0 }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">ProductSold</span>
              <span class="font-bold">{{ hoveredProduct.sold || 0 }}</span>
            </div>

            <div class="pt-3 border-t border-gray-700">
              <span class="text-gray-400 text-sm block mb-2">ProductImage</span>
              <div class="flex justify-between items-start">
                <span class="text-sm">ProductName</span>
                <span class="text-sm font-medium max-w-[150px] truncate">{{ hoveredProduct.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import AddProductForm from './crud/AddProductForm.vue'

const router = useRouter()

const showAddProductModal = ref(false)

const openAddProductModal = () => {
  showAddProductModal.value = true
}

const handleProductAdded = () => {
  fetchProducts() // Refresh product list
}

// Data
const products = ref([])
const selectedProduct = ref(null)
const hoveredProduct = ref(null)
const cardPosition = ref({ top: '0px', left: '0px' })
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const activeTab = ref('Descriptions')

const categories = [
  { label: 'All products', value: 'all' },
  { label: 'Most purchased', value: 'most_purchased' },
  { label: 'Basketball', value: 'basketball' },
  { label: 'Running', value: 'running' },
  { label: 'Skateboard', value: 'skateboard' },
  { label: 'Football', value: 'football' },
  { label: 'Fun Sneakers', value: 'fun_sneakers' },
  { label: 'Soccer', value: 'soccer' }
]

const tabs = ['Descriptions', 'Inventory', 'Pricing']

const editForm = ref({
  _id: '',
  productId: '',
  name: '',
  description: '',
  category: '',
  price: 0,
  discount: 0,
  stock: 0,
  sold: 0,
  thumbnail: ''
})

// Computed
const filteredProducts = computed(() => {
  let filtered = products.value

  // Filter by search
  if (searchQuery.value) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  return filtered
})

const totalProducts = computed(() => filteredProducts.value.length)
const totalPages = computed(() => Math.ceil(totalProducts.value / 10))
const visiblePages = computed(() => {
  const pages = []
  for (let i = 1; i <= Math.min(totalPages.value, 10); i++) {
    pages.push(i)
  }
  return pages
})

const finalPrice = computed(() => {
  const price = editForm.value.price || 0
  const discount = editForm.value.discount || 0
  return price - (price * discount / 100)
})

// Methods

// Methods
const showProductCard = (product, event) => {
  hoveredProduct.value = product

  // Calculate position for the card
  const rect = event.currentTarget.getBoundingClientRect()
  const cardWidth = 280
  const cardHeight = 350

  // Position to the right of the product card
  let left = rect.right + 20
  let top = rect.top

  // Check if card would go off-screen
  if (left + cardWidth > window.innerWidth) {
    left = rect.left - cardWidth - 20 // Show on left instead
  }

  if (top + cardHeight > window.innerHeight) {
    top = window.innerHeight - cardHeight - 20
  }

  cardPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

const hideProductCard = () => {
  hoveredProduct.value = null
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

const fetchProducts = async () => {
  try {
    const response = await axios.get('http://localhost:3000/shoes')
    console.log('API Response:', response.data) // Debug log
    products.value = response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    console.error('Error details:', error.response?.data) // Chi tiết lỗi
    alert('❌ Không thể tải danh sách sản phẩm!')
  }
}


const selectProduct = (product) => {
  selectedProduct.value = product
  editForm.value = {
    _id: product._id,
    productId: product.productId,
    name: product.name,
    description: product.description || '',
    category: product.category,
    price: product.price,
    discount: product.discount || 0,
    stock: product.stock || 0,
    sold: product.sold || 0,
    thumbnail: product.thumbnail
  }
}

const updateProduct = async () => {
  try {
    await axios.put(`http://localhost:3000/shoes/${editForm.value.productId}`, editForm.value)
    alert('✅ Product updated successfully!')
    await fetchProducts()
    selectedProduct.value = products.value.find(p => p._id === editForm.value._id)
  } catch (error) {
    console.error('Error updating product:', error)
    alert('❌ Failed to update product!')
  }
}

const discardChanges = () => {
  if (selectedProduct.value) {
    selectProduct(selectedProduct.value)
  }
}

const viewFullDetail = () => {
  router.push(`/shoes/${editForm.value.productId}`)
}

const toggleSort = () => {
  // Implement sort functionality
  products.value.reverse()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

onMounted(() => {
  fetchProducts()
})
</script>
