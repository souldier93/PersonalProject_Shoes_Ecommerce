<template>
  <div class="min-h-screen bg-white text-gray-950">
  <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-gray-950 sm:text-3xl">{{ pageTitle }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ products.length }} results</p>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-sm font-medium">
        <button type="button" @click="showFilters = !showFilters" class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 hover:border-gray-950">
          <span>{{ showFilters ? 'Hide Filters' : 'Show Filters' }}</span>
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M6 12h12M10 20h4" />
          </svg>
        </button>

        <label class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2">
          <span>Sort By</span>
          <select v-model="filters.sort" @change="fetchProducts" class="bg-transparent font-semibold outline-none">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="rating">Top Rated</option>
            <option value="stock">Most Stock</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="activeFilters.length" class="mb-5 flex flex-wrap gap-2">
      <button
        v-for="filter in activeFilters"
        :key="filter.key"
        type="button"
        @click="removeFilter(filter.key)"
        class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
      >
        {{ filter.label }}
        <span class="text-base leading-none">&times;</span>
      </button>

      <button type="button" @click="clearFilters" class="rounded-full px-4 py-2 text-sm font-semibold underline">
        Clear All
      </button>
    </div>

    <div class="grid gap-8" :class="showFilters ? 'lg:grid-cols-[250px_1fr]' : 'lg:grid-cols-1'">
      <aside v-if="showFilters" class="space-y-7 lg:sticky lg:top-40 lg:self-start">
        <section class="space-y-3">
          <h3 class="text-base font-semibold">Search</h3>
          <div class="flex items-center rounded-full bg-gray-100 px-4 py-2">
            <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
            </svg>
            <input v-model="filters.search" @keyup.enter="fetchProducts" @blur="fetchProducts" placeholder="Search" class="ml-2 w-full bg-transparent text-sm outline-none" />
          </div>
        </section>

        <section class="border-t border-gray-200 pt-5">
          <h3 class="mb-3 text-base font-semibold">Gender</h3>
          <div class="space-y-2">
            <button
              v-for="option in categoryOptions"
              :key="option.value"
              type="button"
              @click="setFilter('category', option.value)"
              class="block w-full rounded-md px-1 py-1.5 text-left text-sm font-medium hover:text-gray-500"
              :class="filters.category === option.value ? 'text-gray-950 underline' : 'text-gray-700'"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section class="border-t border-gray-200 pt-5">
          <h3 class="mb-3 text-base font-semibold">Shop by Type</h3>
          <div class="space-y-2">
            <button
              v-for="option in productTypeOptions"
              :key="option.value"
              type="button"
              @click="setFilter('productType', option.value)"
              class="block w-full rounded-md px-1 py-1.5 text-left text-sm font-medium hover:text-gray-500"
              :class="filters.productType === option.value ? 'text-gray-950 underline' : 'text-gray-700'"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section class="border-t border-gray-200 pt-5">
          <h3 class="mb-3 text-base font-semibold">Price</h3>
          <div class="space-y-2">
            <button
              v-for="range in priceRanges"
              :key="range.label"
              type="button"
              @click="setPriceRange(range)"
              class="block w-full rounded-md px-1 py-1.5 text-left text-sm font-medium hover:text-gray-500"
              :class="filters.minPrice === range.min && filters.maxPrice === range.max ? 'text-gray-950 underline' : 'text-gray-700'"
            >
              {{ range.label }}
            </button>
          </div>
        </section>

        <section class="border-t border-gray-200 pt-5">
          <h3 class="mb-3 text-base font-semibold">Color</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="color in colorFilters"
              :key="color.value"
              type="button"
              @click="setFilter('color', color.value)"
              class="flex flex-col items-center gap-1 text-xs font-medium"
              :class="filters.color === color.value ? 'text-gray-950' : 'text-gray-600'"
            >
              <span class="h-8 w-8 rounded-full border border-gray-300" :style="{ background: color.swatch }"></span>
              {{ color.label }}
            </button>
          </div>
        </section>

        <section class="border-t border-gray-200 pt-5">
          <h3 class="mb-3 text-base font-semibold">Size</h3>
          <select v-model="filters.size" @change="fetchProducts" class="filter-input">
            <option value="">Any size</option>
            <option v-for="size in sizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </section>
      </aside>

      <main>
        <div v-if="loading" class="py-20 text-center text-gray-500">Loading products...</div>

        <div v-else-if="products.length === 0" class="py-20 text-center text-gray-500">
          No products match your filters.
        </div>

        <div v-else class="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-5 xl:gap-x-6" :class="productGridClass">
          <button
            v-for="product in products"
            :key="product.id"
            @click="goToDetail(product)"
            class="group text-left"
          >
            <div class="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gray-100">
              <img :src="product.image" :alt="product.name" class="h-full w-full object-contain transition duration-300 group-hover:scale-105">
            </div>
            <div class="space-y-1">
              <p v-if="productBadge(product)" class="text-sm font-semibold text-orange-600">{{ productBadge(product) }}</p>
              <h3 class="text-sm font-semibold text-gray-950 sm:text-lg">{{ product.name }}</h3>
              <p class="text-sm text-gray-600 sm:text-base">{{ productSubtitle(product.category, product.productType) }}</p>
              <p class="text-sm text-gray-500">{{ productMeta(product) }}</p>
              <p class="text-sm text-gray-500">{{ colorCount(product) }}</p>
              <p v-if="product.stock <= 12" class="text-sm font-semibold text-red-600">Only {{ product.stock }} left</p>
              <p v-else class="text-sm text-gray-500">{{ product.stock }} in stock</p>
              <p class="font-semibold text-gray-950">{{ formatPrice(product.price) }}</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  CATEGORY_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  SIZE_OPTIONS,
  categoryLabel,
  productSubtitle,
  productTypeLabel,
} from '../../../utils/productMeta'
import { API_BASE } from '../../../utils/apiBase'

export default {
  name: 'AllShoes',
  data() {
    return {
      loading: true,
      showFilters: true,
      products: [],
      categoryOptions: CATEGORY_OPTIONS,
      productTypeOptions: PRODUCT_TYPE_OPTIONS,
      filters: {
        search: '',
        category: '',
        productType: '',
        size: '',
        color: '',
        minPrice: '',
        maxPrice: '',
        sort: 'featured',
      },
      colorFilters: [
        { label: 'Black', value: 'Black', swatch: '#111111' },
        { label: 'White', value: 'White', swatch: '#ffffff' },
        { label: 'Blue', value: 'Blue', swatch: '#2563eb' },
        { label: 'Red', value: 'Red', swatch: '#dc2626' },
        { label: 'Pink', value: 'Pink', swatch: '#f9a8d4' },
        { label: 'Brown', value: 'Brown', swatch: '#92400e' },
        { label: 'Green', value: 'Green', swatch: '#16a34a' },
        { label: 'Grey', value: 'Grey', swatch: '#9ca3af' },
        { label: 'Multi', value: 'Multi', swatch: 'linear-gradient(135deg,#111 0 25%,#f97316 25% 50%,#22c55e 50% 75%,#2563eb 75% 100%)' },
      ],
      priceRanges: [
        { label: 'Under 1,000,000 đ', min: '', max: 1000000 },
        { label: '1,000,000 đ - 3,000,000 đ', min: 1000000, max: 3000000 },
        { label: 'Over 3,000,000 đ', min: 3000000, max: '' },
      ],
      sizeOptions: SIZE_OPTIONS,
    }
  },

  async mounted() {
    this.applyRouteFilters()
    await this.fetchProducts()
  },

  watch: {
    '$route.query': {
      deep: true,
      async handler() {
        this.applyRouteFilters()
        await this.fetchProducts()
      },
    },
  },

  computed: {
    pageTitle() {
      if (this.filters.search) return `Search results for "${this.filters.search}"`
      if (this.filters.category) return `${categoryLabel(this.filters.category)} products`
      if (this.filters.productType) return `${productTypeLabel(this.filters.productType)} products`
      if (this.filters.color) return `${this.filters.color} products`
      return 'All products'
    },

    productGridClass() {
      return this.showFilters ? 'lg:grid-cols-3 xl:grid-cols-3' : 'lg:grid-cols-4'
    },

    activeFilters() {
      const filters = []
      if (this.filters.search) filters.push({ key: 'search', label: `Search: ${this.filters.search}` })
      if (this.filters.category) filters.push({ key: 'category', label: categoryLabel(this.filters.category) })
      if (this.filters.productType) filters.push({ key: 'productType', label: productTypeLabel(this.filters.productType) })
      if (this.filters.size) filters.push({ key: 'size', label: `Size ${this.filters.size}` })
      if (this.filters.color) filters.push({ key: 'color', label: this.filters.color })
      if (this.filters.minPrice || this.filters.maxPrice) {
        filters.push({ key: 'price', label: this.priceLabel(this.filters.minPrice, this.filters.maxPrice) })
      }
      return filters
    },
  },

  methods: {
    productSubtitle,

    productMeta(product) {
      return [product.collection, product.color]
        .filter(Boolean)
        .join(' / ') || productTypeLabel(product.productType)
    },

    colorCount(product) {
      const count = Array.isArray(product.colors) ? product.colors.length : 0
      if (count > 1) return `${count} Colors`
      if (product.color) return '1 Color'
      return 'More colors available'
    },

    productBadge(product) {
      if (product.stock <= 12) return 'Few Left'
      if (product.rating >= 4.8 || product.reviewCount >= 80) return 'Best Seller'
      if (product.productType === 'apparel') return 'Sustainable Materials'
      if (product.collection && product.collection.toLowerCase().includes('jordan')) return 'Popular'
      return ''
    },

    priceLabel(min, max) {
      if (min && max) return `${this.formatPrice(min)} - ${this.formatPrice(max)}`
      if (min) return `Over ${this.formatPrice(min)}`
      if (max) return `Under ${this.formatPrice(max)}`
      return 'Price'
    },

    setFilter(key, value) {
      this.filters[key] = this.filters[key] === value ? '' : value
      this.fetchProducts()
    },

    setPriceRange(range) {
      const isActive = this.filters.minPrice === range.min && this.filters.maxPrice === range.max
      this.filters.minPrice = isActive ? '' : range.min
      this.filters.maxPrice = isActive ? '' : range.max
      this.fetchProducts()
    },

    removeFilter(key) {
      if (key === 'price') {
        this.filters.minPrice = ''
        this.filters.maxPrice = ''
      } else {
        this.filters[key] = ''
      }
      this.fetchProducts()
    },

    applyRouteFilters() {
      const query = this.$route?.query || {}
      const routeFilters = {
        search: query.search || '',
        category: query.category || '',
        productType: query.productType || '',
        size: query.size || '',
        color: query.color || '',
        minPrice: query.minPrice || '',
        maxPrice: query.maxPrice || '',
        sort: query.sort || 'featured',
      }

      Object.assign(this.filters, routeFilters)
    },

    async fetchProducts() {
      this.loading = true
      try {
        const params = {}
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params[key] = value
          }
        })

        const res = await axios.get(`${API_BASE}/shoes`, { params });
        this.products = res.data.map(item => ({
          id: item.productId,
          name: item.name,
          category: item.category,
          productType: item.productType || '',
          collection: item.collection || '',
          color: item.color,
          colors: item.colors || [],
          stock: item.stock || 0,
          rating: item.rating || 0,
          reviewCount: item.reviewCount || 0,
          price: item.price,
          image: item.thumbnail || "https://via.placeholder.com/400"
        }));
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        this.loading = false
      }
    },

    clearFilters() {
      this.filters = {
        search: '',
        category: '',
        productType: '',
        size: '',
        color: '',
        minPrice: '',
        maxPrice: '',
        sort: 'featured',
      }
      this.fetchProducts()
    },

    goToDetail(product) {
      this.$router.push(`/shoes/${product.id}`);
    },

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price).replace('₫', 'đ')
    },
  }
}
</script>

<style scoped>
.filter-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
}

.filter-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.15);
}
</style>
