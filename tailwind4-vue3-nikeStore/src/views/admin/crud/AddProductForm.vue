<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
        <div>
          <h2 class="text-2xl font-bold">Add New Product</h2>
          <p class="text-sm text-gray-500 mt-1">Fill in basic info and add colors</p>
        </div>
        <button @click="closeModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form Content -->
      <div class="overflow-y-auto flex-1 p-6">
        <form @submit.prevent="submitProduct">
          <!-- Step Indicator -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-2">
              <button
                v-for="(step, index) in steps"
                :key="step"
                type="button"
                @click="currentStep = index + 1"
                class="flex-1 text-center py-2 text-sm font-medium transition-colors"
                :class="currentStep === index + 1 ? 'text-black' : 'text-gray-400'">
                Step {{ index + 1 }}: {{ step }}
              </button>
            </div>
            <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-black transition-all duration-300"
                :style="{ width: `${(currentStep / steps.length) * 100}%` }"></div>
            </div>
          </div>

          <!-- Step 1: Basic Info -->
          <div v-show="currentStep === 1" class="space-y-6">
            <h3 class="text-lg font-semibold mb-4">Basic Information</h3>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                placeholder="e.g., Nike Pegasus Trail 5 GORE-TEX"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Category <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.category"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                <option value="">Select category</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Main Thumbnail URL</label>
              <input
                v-model="formData.thumbnail"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
              <div v-if="formData.thumbnail" class="mt-2">
                <img :src="formData.thumbnail" alt="Preview" class="w-32 h-32 object-cover rounded-lg border" />
              </div>
            </div>
          </div>

          <!-- Step 2: Add Colors -->
          <div v-show="currentStep === 2" class="space-y-6">
            <h3 class="text-lg font-semibold mb-4">Add Color Variants</h3>

            <div class="space-y-6">
              <div
                v-for="(color, index) in formData.colors"
                :key="index"
                class="border-2 border-gray-300 rounded-lg p-6 relative">
                <button
                  v-if="formData.colors.length > 1"
                  type="button"
                  @click="removeColor(index)"
                  class="absolute top-4 right-4 text-red-600 hover:text-red-800">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h4 class="font-semibold text-lg mb-4">Color {{ index + 1 }}</h4>

                <!-- Color Basic Info -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Style Code <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="color.styleCode"
                      type="text"
                      required
                      placeholder="e.g., FQ0908-002"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Price (Rp) <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model.number="color.price"
                      type="number"
                      required
                      min="0"
                      placeholder="4999000"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color Name</label>
                    <input
                      v-model="color.colorName"
                      type="text"
                      placeholder="e.g., Black Anthracite"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Hex Code</label>
                    <input
                      v-model="color.hex"
                      type="text"
                      placeholder="#000000"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                    <input
                      v-model="color.origin"
                      type="text"
                      placeholder="e.g., Vietnam"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      v-model.number="color.rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.5"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Material Note</label>
                  <input
                    v-model="color.materialNote"
                    type="text"
                    placeholder="Made with at least 50% recycled content by weight"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    v-model="color.description"
                    rows="3"
                    placeholder="Enter product description..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"></textarea>
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
                  <input
                    v-model="color.thumbnail"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>

                <!-- ✅ Media Section (Images & Videos) -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    📸 Images & Videos
                  </label>

                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                    <h5 class="font-medium text-sm mb-2">📁 Browse R2 Folders</h5>

                    <!-- Step 1: Select Product Folder -->
                    <div class="mb-3">
                      <label class="block text-xs text-gray-600 mb-1">1. Select Product Folder</label>
                      <div class="flex gap-2">
                        <select
                          v-model="selectedProductFolder"
                          @change="loadSubFolders"
                          class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black">
                          <option value="">-- Choose product --</option>
                          <option v-for="folder in r2Folders" :key="folder" :value="folder">
                            {{ folder }}
                          </option>
                        </select>
                        <button
                          type="button"
                          @click="loadR2Folders"
                          class="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                          🔄
                        </button>
                      </div>
                    </div>

                    <!-- Step 2: Select Color Variant Subfolder -->
                    <div v-if="subFolders.length > 0" class="mb-3">
                      <label class="block text-xs text-gray-600 mb-1">2. Select Color Variant</label>
                      <select
                        v-model="selectedSubFolder"
                        @change="loadMediaFromSubfolder(index)"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black">
                        <option value="">-- Choose color variant --</option>
                        <option v-for="subfolder in subFolders" :key="subfolder" :value="subfolder">
                          {{ subfolder }}
                        </option>
                      </select>
                    </div>

                    <!-- Media Preview Grid -->
                    <div v-if="availableMedia.length > 0" class="mt-3">
                      <!-- Select/Deselect All Buttons -->
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex gap-2">
                          <button
                            type="button"
                            @click="selectAllMedia"
                            class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                            ✓ Select All
                          </button>
                          <button
                            type="button"
                            @click="deselectAllMedia"
                            :disabled="selectedMediaSet.size === 0"
                            class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            ✗ Deselect All
                          </button>
                        </div>
                        <p class="text-xs text-gray-600">
                          <strong>{{ selectedMediaSet.size }}</strong> / {{ availableMedia.length }}
                        </p>
                      </div>

                      <p class="text-xs text-gray-500 mb-2">
                        Page {{ currentPage }}/{{ totalPages }}
                      </p>

                      <!-- Media Grid -->
                      <div
                        class="grid grid-cols-6 gap-2 border border-gray-200 rounded p-2 bg-gray-50"
                        style="height: 240px; overflow-y: auto">
                        <MediaGridItem
                          v-for="media in paginatedMedia"
                          :key="media"
                          :media-url="media"
                          :is-video="isVideo(media)"
                          :is-selected="selectedMediaSet.has(media)"
                          @toggle="toggleMediaSelection(media)" />
                      </div>

                      <!-- Pagination Controls -->
                      <div class="flex items-center justify-between mt-2 gap-2">
                        <button
                          type="button"
                          @click="goToPage(currentPage - 1)"
                          :disabled="currentPage === 1"
                          class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                          ← Prev
                        </button>

                        <div class="flex gap-1">
                          <button
                            v-for="page in visiblePages"
                            :key="page"
                            type="button"
                            @click="goToPage(page)"
                            :class="
                              currentPage === page
                                ? 'bg-black text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            "
                            class="px-2 py-1 text-xs rounded">
                            {{ page }}
                          </button>
                        </div>

                        <button
                          type="button"
                          @click="goToPage(currentPage + 1)"
                          :disabled="currentPage >= totalPages"
                          class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                          Next →
                        </button>
                      </div>

                      <!-- Apply Button -->
                      <button
                        type="button"
                        @click="applySelectedMedia(index)"
                        :disabled="selectedMediaSet.size === 0"
                        class="mt-2 w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        ✅ Apply {{ selectedMediaSet.size }} Files
                      </button>
                    </div>

                    <!-- Empty State -->
                    <div
                      v-else-if="selectedProductFolder && subFolders.length === 0"
                      class="text-center py-6 text-gray-500 text-sm">
                      No subfolders found
                    </div>
                  </div>

                  <!-- Current Media Preview -->
                  <div v-if="color.images.length > 0 && color.images[0]" class="mt-3">
                    <p class="text-xs text-gray-600 mb-2">
                      <strong>Current files:</strong> {{ color.images.length }}
                    </p>
                    <div class="grid grid-cols-6 gap-2">
                      <div v-for="(media, idx) in color.images.filter((i) => i)" :key="idx" class="relative group">
                        <!-- Video Preview -->
                        <video
                          v-if="isVideo(media)"
                          :src="media"
                          class="w-full h-20 object-cover rounded border"
                          muted
                          @mouseenter="(e) => e.target.play()"
                          @mouseleave="(e) => { e.target.pause(); e.target.currentTime = 0; }">
                        </video>
                        <!-- Image Preview -->
                        <img
                          v-else
                          :src="media"
                          loading="lazy"
                          class="w-full h-20 object-cover rounded border" />
                        
                        <button
                          type="button"
                          @click="removeAppliedMedia(index, idx)"
                          class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sizes -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Sizes & Stock</label>
                  <div class="grid grid-cols-2 gap-3">
                    <div
                      v-for="(size, sizeIndex) in color.sizes"
                      :key="sizeIndex"
                      class="border border-gray-200 rounded-lg p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Size {{ sizeIndex + 1 }}</span>
                        <button
                          v-if="color.sizes.length > 1"
                          type="button"
                          @click="removeSize(index, sizeIndex)"
                          class="text-red-600 hover:text-red-800">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div class="space-y-2">
                        <input
                          v-model="size.size"
                          type="text"
                          placeholder="e.g., 38.5"
                          class="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                        <input
                          v-model.number="size.stock"
                          type="number"
                          min="0"
                          placeholder="Stock"
                          class="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                    </div>
                  </div>
                  <button type="button" @click="addSize(index)" class="mt-3 text-sm text-blue-600 hover:text-blue-800">
                    + Add size
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="addColor"
              class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors font-medium">
              + Add Another Color
            </button>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between mt-8 pt-6 border-t">
            <button
              v-if="currentStep > 1"
              type="button"
              @click="currentStep--"
              class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Previous
            </button>
            <div v-else></div>

            <button
              v-if="currentStep < steps.length"
              type="button"
              @click="currentStep++"
              class="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Next Step
            </button>
            <button
              v-else
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50">
              {{ isSubmitting ? 'Adding Product...' : 'Add Product' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import MediaGridItem from './MediaGridItem.vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'success'])

const currentStep = ref(1)
const isSubmitting = ref(false)
const steps = ['Basic Info', 'Add Colors']

// ✅ R2 Media Selection
const r2Folders = ref([])
const subFolders = ref([])
const selectedProductFolder = ref('')
const selectedSubFolder = ref('')
const availableMedia = ref([])
const selectedMediaSet = ref(new Set())

// Pagination
const currentPage = ref(1)
const mediaPerPage = 24

const totalPages = computed(() => Math.ceil(availableMedia.value.length / mediaPerPage))

const paginatedMedia = computed(() => {
  const start = (currentPage.value - 1) * mediaPerPage
  return availableMedia.value.slice(start, start + mediaPerPage)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  let start = Math.max(1, current - 2)
  let end = Math.min(total, start + 4)

  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Form data
const formData = reactive({
  name: '',
  category: '',
  thumbnail: '',
  colors: [
    {
      styleCode: '',
      price: 0,
      colorName: '',
      hex: '',
      thumbnail: '',
      images: [],
      sizes: [{ size: '', stock: 0 }],
      origin: '',
      materialNote: '',
      rating: 0,
      reviewCount: 0,
      description: ''
    }
  ]
})

onMounted(async () => {
  await loadR2Folders()
})

// ============ R2 Methods ============

const loadR2Folders = async () => {
  try {
    const response = await axios.get('http://localhost:3000/r2/folders')
    r2Folders.value = response.data
    selectedProductFolder.value = ''
    selectedSubFolder.value = ''
    subFolders.value = []
    availableMedia.value = []
  } catch (error) {
    console.error('Error loading R2 folders:', error)
    alert('Failed to load folders')
  }
}

const loadSubFolders = async () => {
  if (!selectedProductFolder.value) {
    subFolders.value = []
    return
  }

  try {
    const response = await axios.get('http://localhost:3000/r2/subfolders', {
      params: { folder: selectedProductFolder.value }
    })
    subFolders.value = response.data
    selectedSubFolder.value = ''
    availableMedia.value = []
    selectedMediaSet.value.clear()
    currentPage.value = 1
  } catch (error) {
    console.error('Error loading subfolders:', error)
    alert('Failed to load subfolders')
  }
}

// ✅ Load cả Images và Videos
const loadMediaFromSubfolder = async (colorIndex) => {
  if (!selectedSubFolder.value) return

  try {
    const response = await axios.get('http://localhost:3000/r2/media', {
      params: {
        folder: selectedProductFolder.value,
        subfolder: selectedSubFolder.value
      }
    })
    availableMedia.value = response.data
    selectedMediaSet.value.clear()
    currentPage.value = 1
  } catch (error) {
    console.error('Error loading media:', error)
    alert('Failed to load media from subfolder')
  }
}

// ✅ Helper: Check if file is video
const isVideo = (url) => {
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(url)
}

// ✅ Select/Deselect All
const selectAllMedia = () => {
  availableMedia.value.forEach(media => {
    selectedMediaSet.value.add(media)
  })
  selectedMediaSet.value = new Set(selectedMediaSet.value)
}

const deselectAllMedia = () => {
  selectedMediaSet.value.clear()
  selectedMediaSet.value = new Set(selectedMediaSet.value)
}

const toggleMediaSelection = (mediaUrl) => {
  if (selectedMediaSet.value.has(mediaUrl)) {
    selectedMediaSet.value.delete(mediaUrl)
  } else {
    selectedMediaSet.value.add(mediaUrl)
  }
  selectedMediaSet.value = new Set(selectedMediaSet.value)
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const applySelectedMedia = (colorIndex) => {
  const newMedia = Array.from(selectedMediaSet.value)
  const existingMedia = formData.colors[colorIndex].images.filter((i) => i)
  formData.colors[colorIndex].images = [...existingMedia, ...newMedia]

  selectedMediaSet.value.clear()
  availableMedia.value = []
  selectedProductFolder.value = ''
  selectedSubFolder.value = ''
  subFolders.value = []
  currentPage.value = 1

  alert(`✅ Added ${newMedia.length} files`)
}

const removeAppliedMedia = (colorIndex, mediaIndex) => {
  formData.colors[colorIndex].images.splice(mediaIndex, 1)
}

// ============ Color & Size ============

const addColor = () => {
  formData.colors.push({
    styleCode: '',
    price: 0,
    colorName: '',
    hex: '',
    thumbnail: '',
    images: [],
    sizes: [{ size: '', stock: 0 }],
    origin: '',
    materialNote: '',
    rating: 0,
    reviewCount: 0,
    description: ''
  })
}

const removeColor = (index) => {
  formData.colors.splice(index, 1)
}

const addSize = (colorIndex) => {
  formData.colors[colorIndex].sizes.push({ size: '', stock: 0 })
}

const removeSize = (colorIndex, sizeIndex) => {
  formData.colors[colorIndex].sizes.splice(sizeIndex, 1)
}

// ============ Modal ============

const closeModal = () => {
  if (confirm('Are you sure? Unsaved changes will be lost.')) {
    emit('close')
    resetForm()
  }
}

const resetForm = () => {
  currentStep.value = 1
  Object.assign(formData, {
    name: '',
    category: '',
    thumbnail: '',
    colors: [
      {
        styleCode: '',
        price: 0,
        colorName: '',
        hex: '',
        thumbnail: '',
        images: [],
        sizes: [{ size: '', stock: 0 }],
        origin: '',
        materialNote: '',
        rating: 0,
        reviewCount: 0,
        description: ''
      }
    ]
  })
}

// ============ Submit ============

const submitProduct = async () => {
  isSubmitting.value = true

  try {
    const payload = {
      name: formData.name,
      category: formData.category,
      thumbnail: formData.thumbnail,
      colors: formData.colors.map((color) => ({
        styleCode: color.styleCode,
        price: color.price,
        colorName: color.colorName,
        hex: color.hex,
        thumbnail: color.thumbnail,
        images: color.images.filter((img) => img.trim() !== ''),
        sizes: color.sizes.filter((size) => size.size.trim() !== ''),
        origin: color.origin,
        materialNote: color.materialNote,
        rating: color.rating,
        reviewCount: color.reviewCount,
        description: color.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    }

    await axios.post('http://localhost:3000/shoes/product', payload)

    alert('✅ Product added successfully!')
    emit('success')
    // emit('close')
    // resetForm()
  } catch (error) {
    console.error('Error adding product:', error)
    alert('❌ Failed to add product: ' + (error.response?.data?.message || error.message))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
