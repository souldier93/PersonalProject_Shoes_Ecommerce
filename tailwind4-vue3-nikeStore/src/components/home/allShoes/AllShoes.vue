<template>
  <div class="mx-auto mt-10 w-full max-w-7xl px-4 py-8 sm:mt-16">
    <div class="flex flex-col gap-5 mb-8">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-2xl font-semibold sm:text-3xl">All products</h2>
        <p class="text-sm text-gray-500">{{ products.length }} results</p>
      </div>

      <div class="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-6">
        <input v-model="filters.search" @input="fetchProducts" placeholder="Search products" class="filter-input md:col-span-2" />

        <select v-model="filters.category" @change="fetchProducts" class="filter-input">
          <option value="">All categories</option>
          <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <select v-model="filters.productType" @change="fetchProducts" class="filter-input">
          <option value="">All types</option>
          <option v-for="option in productTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <select v-model="filters.size" @change="fetchProducts" class="filter-input">
          <option value="">Any size</option>
          <option v-for="size in sizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>

        <input v-model="filters.color" @input="fetchProducts" placeholder="Color" class="filter-input" />

        <select v-model="filters.sort" @change="fetchProducts" class="filter-input">
          <option value="featured">Featured</option>
          <option value="price-asc">Price low to high</option>
          <option value="price-desc">Price high to low</option>
          <option value="rating">Top rated</option>
          <option value="stock">Most stock</option>
        </select>

        <input v-model.number="filters.minPrice" @input="fetchProducts" type="number" min="0" placeholder="Min price" class="filter-input" />
        <input v-model.number="filters.maxPrice" @input="fetchProducts" type="number" min="0" placeholder="Max price" class="filter-input" />

        <button @click="clearFilters" class="border border-gray-300 rounded-lg px-4 py-2 font-medium hover:bg-gray-50">
          Clear
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center text-gray-500">Loading products...</div>

    <div v-else-if="products.length === 0" class="py-20 text-center text-gray-500">
      No products match your filters.
    </div>

    <div v-else class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      <button
        v-for="product in products"
        :key="product.id"
        @click="goToDetail(product)"
        class="text-left group"
      >
        <div class="bg-gray-100 rounded-lg mb-4 aspect-square flex items-center justify-center overflow-hidden">
          <img :src="product.image" :alt="product.name" class="w-full h-full object-contain group-hover:scale-105 transition">
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-semibold sm:text-lg">{{ product.name }}</h3>
          <p class="text-sm text-gray-600 sm:text-base">{{ productSubtitle(product.category, product.productType) }}</p>
          <p class="text-sm text-gray-500">{{ productMeta(product) }}</p>
          <p class="text-sm text-gray-500">{{ product.stock }} in stock</p>
          <p class="font-semibold">{{ formatPrice(product.price) }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  CATEGORY_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  SIZE_OPTIONS,
  productSubtitle,
  productTypeLabel,
} from '../../../utils/productMeta'
import { API_BASE } from '../../../utils/apiBase'

export default {
  name: 'AllShoes',
  data() {
    return {
      loading: true,
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
      sizeOptions: SIZE_OPTIONS,
    }
  },

  async mounted() {
    await this.fetchProducts()
  },

  methods: {
    productSubtitle,

    productMeta(product) {
      return [product.collection, product.color]
        .filter(Boolean)
        .join(' / ') || productTypeLabel(product.productType)
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
          stock: item.stock || 0,
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
