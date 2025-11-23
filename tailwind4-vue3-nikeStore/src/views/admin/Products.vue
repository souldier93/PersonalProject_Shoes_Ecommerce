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
        <div class="grid grid-cols-4 gap-4 mb-6">
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
      <!-- RIGHT SIDE - Edit Product Form -->
      <div class="col-span-5">
        <div class="bg-white rounded-xl p-6 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
          <div class="flex items-center justify-between mb-6 flex-shrink-0">
            <h2 class="text-2xl font-bold">Edit Product</h2>
            <button v-if="selectedProduct" @click="viewFullDetail"
              class="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <span>Full view</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div v-if="!selectedProduct" class="text-center py-12 text-gray-400 flex-1 flex flex-col justify-center">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Select a product to edit</p>
          </div>

          <div v-else class="flex-1 flex flex-col overflow-hidden">
            <!-- Tabs -->
            <div class="flex gap-1 mb-4 border-b flex-shrink-0 overflow-x-auto">
              <button v-for="tab in tabs" :key="tab" @click="activeTab = tab"
                class="px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap" :class="activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'">
                {{ tab }}
              </button>
            </div>

            <!-- Tab Content - Scrollable -->
            <div class="flex-1 overflow-y-auto pr-2">
              <!-- Basic Info Tab -->
              <div v-show="activeTab === 'Basic Info'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input v-model="editForm.name" type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
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

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Main Thumbnail URL</label>
                  <input v-model="editForm.thumbnail" type="url"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                  <div v-if="editForm.thumbnail" class="mt-2">
                    <img :src="editForm.thumbnail" alt="Preview" class="w-32 h-32 object-cover rounded-lg border" />
                  </div>
                </div>
              </div>

              <!-- Colors Tab -->
              <!-- Colors Tab - OPTIMIZED -->
              <div v-show="activeTab === 'Colors'" class="space-y-4">
                <div class="flex items-center justify-between mb-3 sticky top-0 bg-white py-2 z-10 border-b">
                  <h3 class="font-semibold">Color Variants ({{ editForm.colors.length }})</h3>
                  <div class="flex gap-2">
                    <button @click="collapseAllColors" type="button"
                      class="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                      Collapse All
                    </button>
                    <button @click="expandAllColors" type="button"
                      class="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                      Expand All
                    </button>
                    <button @click="addNewColor" type="button"
                      class="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800">
                      + Add Color
                    </button>
                  </div>
                </div>

                <!-- ⭐ ACCORDION STYLE - Chỉ render expanded colors -->
                <div v-for="(color, index) in editForm.colors" :key="`color-${index}-${color.styleCode}`"
                  class="border-2 rounded-lg overflow-hidden"
                  :class="expandedColors[index] ? 'border-blue-500' : 'border-gray-300'">

                  <!-- Color Header - Always Visible -->
                  <div @click="toggleColorExpand(index)"
                    class="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded border" :style="{ backgroundColor: color.hex || '#ccc' }"></div>
                      <div>
                        <h4 class="font-semibold">{{ color.colorName || `Color ${index + 1}` }}</h4>
                        <p class="text-xs text-gray-500">{{ color.styleCode }} • {{ formatPrice(color.price) }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-500">{{ color.sizes?.length || 0 }} sizes</span>
                      <svg class="w-5 h-5 transition-transform" :class="{ 'rotate-180': expandedColors[index] }"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <!-- Color Details - Collapsible -->
                  <transition name="slide-fade">
                    <div v-show="expandedColors[index]" class="p-4 pt-0 border-t">
                      <button v-if="editForm.colors.length > 1" @click.stop="removeColor(index)" type="button"
                        class="float-right text-red-600 hover:text-red-800 ml-2">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div class="space-y-3 mt-4">
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Style Code</label>
                            <input v-model.lazy="color.styleCode" type="text"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Price (Rp)</label>
                            <input v-model.number.lazy="color.price" type="number"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Color Name</label>
                            <input v-model.lazy="color.colorName" type="text"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Hex Code</label>
                            <input v-model.lazy="color.hex" type="text"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Origin</label>
                            <input v-model.lazy="color.origin" type="text"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                            <input v-model.number.lazy="color.rating" type="number" step="0.1" min="0" max="5"
                              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                          </div>
                        </div>

                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Material Note</label>
                          <input v-model.lazy="color.materialNote" type="text"
                            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                        </div>

                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea v-model.lazy="color.description" rows="2"
                            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"></textarea>
                        </div>

                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Thumbnail URL</label>
                          <input v-model.lazy="color.thumbnail" type="url"
                            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black" />
                        </div>

                        <!-- ⭐ Images/Videos Preview - SHOW ALL với Show More/Less -->
                        <div v-if="color.images && color.images.length > 0">
                          <div class="flex items-center justify-between mb-1">
                            <label class="block text-xs font-medium text-gray-700">
                              Images & Videos ({{ color.images.length }})
                            </label>
                            <button v-if="color.images.length > 12" @click="toggleShowAllMedia(index)" type="button"
                              class="text-xs text-blue-600 hover:text-blue-800">
                              {{ showAllMedia[index] ? '▲ Show Less' : '▼ Show All' }}
                            </button>
                          </div>

                          <!-- Media Grid -->
                          <div class="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
                            <div v-for="(img, imgIdx) in displayedMedia(color.images, index)"
                              :key="`img-${index}-${imgIdx}`" class="relative group">
                              <video v-if="isVideo(img)" :src="img" loading="lazy"
                                class="w-full h-16 object-cover rounded border" muted
                                @mouseenter="(e) => e.target.play()"
                                @mouseleave="(e) => { e.target.pause(); e.target.currentTime = 0; }">
                              </video>
                              <img v-else :src="img" loading="lazy" alt="Product image"
                                class="w-full h-16 object-cover rounded border" />
                              <button type="button" @click="removeImage(index, imgIdx)"
                                class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs hover:bg-red-700">
                                ×
                              </button>
                              <!-- File index indicator -->
                              <span
                                class="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-[10px] px-1 rounded">
                                {{ imgIdx + 1 }}
                              </span>
                            </div>
                          </div>

                          <!-- Summary info -->
                          <div v-if="!showAllMedia[index] && color.images.length > 12"
                            class="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2 text-center">
                            Showing 12 of {{ color.images.length }} files •
                            <button @click="toggleShowAllMedia(index)"
                              class="text-blue-600 hover:text-blue-800 font-medium">
                              Click to show all
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </transition>
                </div>
              </div>


              <!-- Sizes Tab -->
              <div v-show="activeTab === 'Sizes'" class="space-y-4">
                <div v-if="editForm.colors.length === 0" class="text-center py-8 text-gray-400">
                  <p>Please add colors first</p>
                </div>

                <div v-for="(color, colorIdx) in editForm.colors" :key="colorIdx" class="border rounded-lg p-4">
                  <h4 class="font-semibold mb-3 flex items-center justify-between">
                    <span>{{ color.colorName || `Color ${colorIdx + 1}` }}</span>
                    <span class="text-xs text-gray-500">{{ color.styleCode }}</span>
                  </h4>

                  <div class="grid grid-cols-2 gap-2 mb-3">
                    <div v-for="(size, sizeIdx) in color.sizes" :key="sizeIdx" class="border rounded p-2">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium">Size {{ sizeIdx + 1 }}</span>
                        <button v-if="color.sizes.length > 1" @click="removeSize(colorIdx, sizeIdx)" type="button"
                          class="text-red-600 hover:text-red-800">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <input v-model="size.size" type="text" placeholder="38.5"
                        class="w-full px-2 py-1 text-sm border rounded mb-1 focus:outline-none focus:ring-1 focus:ring-black" />
                      <input v-model.number="size.stock" type="number" placeholder="Stock"
                        class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-black" />
                    </div>
                  </div>

                  <button @click="addSize(colorIdx)" type="button" class="text-sm text-blue-600 hover:text-blue-800">
                    + Add size for this color
                  </button>
                </div>
              </div>

              <!-- Product Info Tab -->
              <div v-show="activeTab === 'Product Info'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <input :value="editForm.productId" type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Total Colors</label>
                    <input :value="editForm.colors.length" type="number"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Total Sizes</label>
                    <input :value="totalSizes" type="number"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Total Stock</label>
                  <input :value="totalStock" type="number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled />
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 class="font-semibold text-sm mb-2">📊 Summary</h5>
                  <div class="space-y-1 text-sm">
                    <p><span class="text-gray-600">Category:</span> <strong>{{ editForm.category }}</strong></p>
                    <p><span class="text-gray-600">Colors:</span> <strong>{{ editForm.colors.length }}</strong></p>
                    <p><span class="text-gray-600">Total Stock:</span> <strong>{{ totalStock }}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons - Fixed at bottom -->
            <div class="flex gap-3 mt-4 pt-4 border-t flex-shrink-0">
              <!-- ⭐ NÚT DELETE - ĐẶT Ở ĐẦU -->
              <button v-if="selectedProduct" @click="softDeleteProduct"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                title="Set all stock to 0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>

              <button @click="discardChanges"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Discard
              </button>

              <button @click="updateProduct"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
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
const showAllMedia = ref({})

const toggleShowAllMedia = (colorIndex) => {
  showAllMedia.value[colorIndex] = !showAllMedia.value[colorIndex]
}

const displayedMedia = (images, colorIndex) => {
  if (!images || images.length === 0) return []

  // Nếu showAllMedia = true hoặc ít hơn 12 files, hiển thị tất cả
  if (showAllMedia.value[colorIndex] || images.length <= 12) {
    return images
  }

  // Ngược lại, chỉ hiển thị 12 files đầu tiên
  return images.slice(0, 12)
}

const openAddProductModal = () => {
  showAddProductModal.value = true
}

const handleProductAdded = () => {
  fetchProducts()
}

// Data
const products = ref([])
const selectedProduct = ref(null)
const hoveredProduct = ref(null)
const cardPosition = ref({ top: '0px', left: '0px' })
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const activeTab = ref('Basic Info')
const expandedColors = ref({})

const toggleColorExpand = (index) => {
  expandedColors.value[index] = !expandedColors.value[index]
}

const expandAllColors = () => {
  editForm.value.colors.forEach((_, index) => {
    expandedColors.value[index] = true
  })
}

const collapseAllColors = () => {
  expandedColors.value = {}
}

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

const tabs = ['Basic Info', 'Colors', 'Sizes', 'Product Info']

const editForm = ref({
  _id: '',
  productId: '',
  name: '',
  category: '',
  thumbnail: '',
  colors: []
})

// Computed
const filteredProducts = computed(() => {
  let filtered = products.value

  if (searchQuery.value) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

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

const totalSizes = computed(() => {
  return editForm.value.colors.reduce((sum, color) => sum + (color.sizes?.length || 0), 0)
})

const totalStock = computed(() => {
  return editForm.value.colors.reduce((sum, color) => {
    return sum + (color.sizes?.reduce((s, size) => s + (size.stock || 0), 0) || 0)
  }, 0)
})

// Methods
const showProductCard = (product, event) => {
  hoveredProduct.value = product

  const rect = event.currentTarget.getBoundingClientRect()
  const cardWidth = 280
  const cardHeight = 350

  let left = rect.right + 20
  let top = rect.top

  if (left + cardWidth > window.innerWidth) {
    left = rect.left - cardWidth - 20
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
    console.log('Fetched Products:', response.data) // Debug
    products.value = response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    alert('❌ Không thể tải danh sách sản phẩm!')
  }
}


const selectProduct = async (product) => {
  try {
    selectedProduct.value = product

    const [shoeResponse, detailResponse] = await Promise.all([
      axios.get(`http://localhost:3000/shoes/product/${product.productId}`),
      axios.get(`http://localhost:3000/shoes/detail/${product.productId}`)
    ])

    const shoeData = shoeResponse.data
    const detailData = detailResponse.data

    editForm.value = {
      _id: detailData._id,
      productId: detailData.productId,
      name: detailData.name,
      category: detailData.category,
      thumbnail: shoeData.thumbnail || '',
      colors: detailData.colors ? JSON.parse(JSON.stringify(detailData.colors)) : []
    }

    editForm.value.colors = editForm.value.colors.map(color => ({
      styleCode: color.styleCode || '',
      price: color.price || 0,
      colorName: color.colorName || '',
      hex: color.hex || '',
      thumbnail: color.thumbnail || '',
      images: Array.isArray(color.images) ? color.images : [],
      sizes: Array.isArray(color.sizes) && color.sizes.length > 0
        ? color.sizes.map(s => ({ size: s.size || '', stock: s.stock || 0 }))
        : [{ size: '', stock: 0 }],
      origin: color.origin || '',
      materialNote: color.materialNote || '',
      rating: color.rating || 0,
      reviewCount: color.reviewCount || 0,
      description: color.description || '',
      category: color.category || detailData.category,
      createdAt: color.createdAt || new Date().toISOString(),
      updatedAt: color.updatedAt || new Date().toISOString()
    }))

    // ⭐ Expand only first color by default
    expandedColors.value = { 0: true }
    activeTab.value = 'Basic Info'

  } catch (error) {
    console.error('Error loading product details:', error)
    alert('❌ Failed to load product details: ' + error.message)
  }
}


const addNewColor = () => {
  editForm.value.colors.push({
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
  const color = editForm.value.colors[index]

  console.log('🔍 BEFORE:', JSON.stringify(color.sizes, null, 2)) // Debug

  const confirmDelete = confirm(
    `🗑️ Set stock to ZERO for "${color.colorName || `Color ${index + 1}`}"?\n\n` +
    `Style Code: ${color.styleCode}\n` +
    `Current sizes: ${color.sizes?.length || 0}\n\n` +
    `⚠️ This will set all stock to 0 but keep the color data.`
  )

  if (!confirmDelete) return

  // ⭐ Tạo array mới hoàn toàn
  const updatedSizes = []
  for (let i = 0; i < editForm.value.colors[index].sizes.length; i++) {
    const size = editForm.value.colors[index].sizes[i]
    updatedSizes.push({
      size: size.size,
      stock: 0  // ⭐ FORCE STOCK = 0
    })
  }

  editForm.value.colors[index].sizes = updatedSizes

  console.log('✅ AFTER:', JSON.stringify(editForm.value.colors[index].sizes, null, 2)) // Debug

  alert(`✅ Stock set to 0 for color "${color.colorName || `Color ${index + 1}`}"`)
}






const addSize = (colorIndex) => {
  editForm.value.colors[colorIndex].sizes.push({ size: '', stock: 0 })
}

const removeSize = (colorIndex, sizeIndex) => {
  editForm.value.colors[colorIndex].sizes.splice(sizeIndex, 1)
}

const removeImage = (colorIndex, imageIndex) => {
  editForm.value.colors[colorIndex].images.splice(imageIndex, 1)
}

const isVideo = (url) => {
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(url)
}

const updateProduct = async () => {
  try {
    const payload = {
      name: editForm.value.name,
      category: editForm.value.category,
      thumbnail: editForm.value.thumbnail,
      colors: editForm.value.colors.map(color => ({
        styleCode: color.styleCode,
        price: Number(color.price) || 0,
        colorName: color.colorName,
        hex: color.hex,
        thumbnail: color.thumbnail,
        images: color.images.filter(img => img && img.trim() !== ''),
        sizes: color.sizes
          .filter(size => size.size && size.size.trim() !== '')
          .map(size => ({
            size: size.size,
            stock: Number(size.stock) || 0
          })),
        origin: color.origin,
        materialNote: color.materialNote,
        rating: Number(color.rating) || 0,
        reviewCount: Number(color.reviewCount) || 0,
        description: color.description,
        category: color.category || editForm.value.category,
        createdAt: color.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    }

    console.log('Update Payload:', payload) // Debug

    const putRespone = await axios.put(`http://localhost:3000/shoes/${editForm.value.productId}`, payload)
    console.log(putRespone.data)
    alert('✅ Product updated successfully!')
    await fetchProducts()

    // Reload full product detail
    const response = await axios.get(`http://localhost:3000/shoes/detail/${editForm.value.productId}`)
    selectProduct(response.data)
  } catch (error) {
    console.error('Error updating product:', error)
    console.error('Error details:', error.response?.data) // Chi tiết lỗi
    alert('❌ Failed to update: ' + (error.response?.data?.message || error.message))
  }
}


const discardChanges = () => {
  if (selectedProduct.value && confirm('Discard all changes?')) {
    selectProduct(selectedProduct.value)
  }
}

// Soft Delete - Set stock về 0
const softDeleteProduct = async () => {
  if (!selectedProduct.value) {
    alert('⚠️ Please select a product first!')
    return
  }

  // Confirm dialog
  const confirmDelete = confirm(
    `🗑️ Are you sure you want to DELETE this product?\n\n` +
    `Product: ${editForm.value.name}\n` +
    `Product ID: ${editForm.value.productId}\n\n` +
    `⚠️ This will set ALL STOCK to ZERO for all colors.\n` +
    `(Product will not be removed from database)`
  )

  if (!confirmDelete) return

  try {
    const response = await axios.post(
      `http://localhost:3000/shoes/soft-delete/${editForm.value.productId}`
    )

    console.log('✅ Soft Delete Response:', response.data)

    // Show success message
    alert(
      `✅ Product deleted successfully!\n\n` +
      `${response.data.message}\n` +
      `Affected colors: ${response.data.affectedColors}`
    )

    // Reload products list
    await fetchProducts()

    // Clear selection
    selectedProduct.value = null
    editForm.value = {
      _id: '',
      productId: '',
      name: '',
      category: '',
      thumbnail: '',
      colors: []
    }

  } catch (error) {
    console.error('❌ Error soft deleting product:', error)
    alert('❌ Failed to delete product: ' + (error.response?.data?.message || error.message))
  }
}


const viewFullDetail = () => {
  router.push(`/shoes/${editForm.value.productId}`)
}

const toggleSort = () => {
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


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ⭐ Slide Fade Animation */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* ⭐ Smooth scrolling cho media grid */
.overflow-y-auto {
  scroll-behavior: smooth;
}

/* Custom scrollbar cho media grid */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Optimize image/video rendering */
img,
video {
  content-visibility: auto;
  will-change: transform;
}
</style>
