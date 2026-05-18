<template>
  <div class="mx-auto max-w-7xl p-4 lg:p-6">
    <!-- Free Delivery Banner -->
    <div class="bg-gray-100 text-center py-3 mb-6 text-sm">
      <span class="font-semibold">FREE DELIVERY</span>
      <span class="ml-2">Applies to orders of 5,000,000₫ or more.</span>
    </div>

    <!-- Empty Bag State -->
    <div v-if="bagItems.length === 0" class="text-center py-20">
      <h2 class="text-2xl font-semibold mb-2">Your Bag is Empty</h2>
      <p class="text-gray-600 mb-6">Add some products to get started!</p>
      <router-link
        to="/"
        class="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800"
      >
        Continue Shopping
      </router-link>
    </div>

    <!-- Bag Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Bag Items -->
      <div class="lg:col-span-2">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-2xl font-semibold">Bag</h2>

          <!-- Select All -->
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <input
              ref="selectAllCheckbox"
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
              class="w-5 h-5 accent-green-600 cursor-pointer"
            />
            <span class="text-sm font-medium">
              Select All ({{ selectedCount }}/{{ bagItems.length }})
            </span>
          </label>
        </div>

        <div
          v-for="item in bagItems"
          :key="getItemKey(item)"
          class="mb-4 rounded-lg border bg-white p-4 shadow-sm transition sm:p-6"
          :class="isSelected(item) ? 'border-black' : 'border-transparent'"
        >
          <div class="grid grid-cols-[auto_96px_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_128px_minmax(0,1fr)_auto] sm:gap-4 sm:items-start">
            <!-- Checkbox -->
            <input
              type="checkbox"
              :checked="isSelected(item)"
              @change="toggleItemSelection(item)"
              class="w-5 h-5 mt-1 accent-green-600 cursor-pointer flex-shrink-0"
            />

            <!-- Product Image -->
            <img
              :src="item.thumbnail || item.image"
              :alt="item.name"
              class="h-24 w-24 rounded-md object-cover sm:h-32 sm:w-32"
            />

            <!-- Product Info -->
            <div class="min-w-0">
              <h3 class="font-semibold text-lg mb-1">{{ item.name }}</h3>
              <p class="text-gray-600 text-sm mb-2">
                {{ item.colorName }}<br />
                Size {{ item.size }}
              </p>

              <div class="mt-4 flex flex-wrap items-center gap-3">
                <button
                  @click="decreaseQty(item)"
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100"
                >
                  -
                </button>

                <span class="w-8 text-center">{{ item.quantity }}</span>

                <button
                  @click="increaseQty(item)"
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100"
                >
                  +
                </button>

                <button
                  @click="removeItem(item)"
                  class="text-sm text-red-600 hover:text-red-800 sm:ml-4"
                >
                  Remove
                </button>
              </div>
            </div>

            <!-- Price -->
            <div class="col-span-3 text-right text-lg font-semibold sm:col-span-1 sm:text-left">
              {{ formatPrice(item.price * item.quantity) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="lg:col-span-1">
        <div class="sticky bottom-0 rounded-lg bg-white p-4 shadow-lg ring-1 ring-gray-100 lg:top-24 lg:bottom-auto lg:p-6">
          <h2 class="text-2xl font-semibold mb-6">Summary</h2>

          <div class="space-y-4">
            <div class="flex justify-between">
              <span>
                Subtotal
                <span class="text-sm text-gray-500">({{ selectedCount }} selected)</span>
              </span>
              <span class="font-medium">{{ formatPrice(subtotal) }}</span>
            </div>

            <div class="flex justify-between">
              <span>Delivery</span>
              <span class="font-medium">{{ formatPrice(deliveryFee) }}</span>
            </div>

            <div class="flex justify-between pt-4 border-t font-semibold text-lg">
              <span>Total</span>
              <span>{{ formatPrice(total) }}</span>
            </div>
          </div>

          <div
            v-if="selectedCount === 0"
            class="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm"
          >
            Please select at least one product to checkout.
          </div>

          <!-- Checkout Buttons -->
          <div class="mt-6 space-y-3">
            <!-- Logged in -->
            <template v-if="isLoggedIn">
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div class="flex items-center gap-2">
                  <svg
                    class="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-sm font-medium text-green-800">
                    Logged in as {{ currentUser?.username }}
                  </span>
                </div>
              </div>

              <button
                @click="memberCheckout"
                class="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Member Checkout
              </button>
            </template>

            <!-- Not logged in -->
            <template v-else>
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                <div class="flex items-start gap-3">
                  <svg
                    class="w-6 h-6 text-gray-700 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div>
                    <h4 class="font-semibold text-sm mb-1">PTT Style Member Benefits</h4>
                    <p class="text-xs text-gray-600">
                      Fast checkout, order tracking, and exclusive access
                    </p>
                  </div>
                </div>
              </div>

              <button
                @click="memberCheckout"
                class="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Member Checkout
              </button>

              <button
                @click="guestCheckout"
                class="w-full border-2 border-black text-black py-4 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Guest Checkout
              </button>

              <p class="text-xs text-center text-gray-500 mt-2">
                Don't have an account?
                <button @click="goToSignup" class="underline hover:text-black">
                  Sign up now
                </button>
              </p>
            </template>
          </div>

          <!-- Delivery Info -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex items-start gap-3 text-sm text-gray-600">
              <svg
                class="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="font-medium text-gray-900 mb-1">Delivery Information</p>
                <p>Estimated delivery: 3-8 business days</p>
                <p class="mt-1">Free delivery on orders over 5,000,000₫</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Optional debug -->
    <!-- <pre>{{ selectedItems }}</pre> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getBag, saveBag as saveStoredBag } from '../../../utils/bagStorage'

const router = useRouter()

const bagItems = ref([])
const selectedItemKeys = ref([])
const selectAllCheckbox = ref(null)

const getItemKey = (item) => {
  return `${item.productId}-${item.styleCode}-${item.size}`
}

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('user')
})

// Get current user info
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
})

onMounted(() => {
  loadBag()
})

const loadBag = async () => {
  const savedBag = getBag()
  if (savedBag.length) {
    bagItems.value = savedBag
    console.log('📦 Bag items loaded:', bagItems.value)

    bagItems.value.forEach(item => {
      if (!item.colorName || !item.size) {
        console.warn('⚠️ Item thiếu thông tin:', item)
      }
    })

    // Mặc định chọn tất cả khi vào bag
    selectedItemKeys.value = bagItems.value.map(item => getItemKey(item))
    await nextTick()
    updateIndeterminateState()
  }
}

const saveBag = () => {
  saveStoredBag(bagItems.value)
}

const saveSelectedCheckoutItems = () => {
  localStorage.setItem('checkoutItems', JSON.stringify(selectedItems.value))
}

const isSelected = (item) => {
  return selectedItemKeys.value.includes(getItemKey(item))
}

const toggleItemSelection = async (item) => {
  const key = getItemKey(item)

  if (selectedItemKeys.value.includes(key)) {
    selectedItemKeys.value = selectedItemKeys.value.filter(itemKey => itemKey !== key)
  } else {
    selectedItemKeys.value = [...selectedItemKeys.value, key]
  }

  await nextTick()
  updateIndeterminateState()
}

const toggleSelectAll = async (event) => {
  const checked = event.target.checked

  if (checked) {
    selectedItemKeys.value = bagItems.value.map(item => getItemKey(item))
  } else {
    selectedItemKeys.value = []
  }

  await nextTick()
  updateIndeterminateState()
}

const selectedItems = computed(() => {
  return bagItems.value.filter(item =>
    selectedItemKeys.value.includes(getItemKey(item))
  )
})

const selectedCount = computed(() => {
  return selectedItems.value.length
})

const isAllSelected = computed(() => {
  return (
    bagItems.value.length > 0 &&
    selectedItemKeys.value.length === bagItems.value.length
  )
})

const isIndeterminate = computed(() => {
  return (
    selectedItemKeys.value.length > 0 &&
    selectedItemKeys.value.length < bagItems.value.length
  )
})

const updateIndeterminateState = () => {
  if (selectAllCheckbox.value) {
    selectAllCheckbox.value.indeterminate = isIndeterminate.value
  }
}

watch(
  () => [selectedItemKeys.value.length, bagItems.value.length],
  async () => {
    await nextTick()
    updateIndeterminateState()
  }
)

const subtotal = computed(() => {
  return selectedItems.value.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
})

const deliveryFee = computed(() => {
  if (selectedItems.value.length === 0) return 0
  return subtotal.value >= 5000000 ? 0 : 10000
})

const total = computed(() => {
  return subtotal.value + deliveryFee.value
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const increaseQty = (item) => {
  item.quantity++
  saveBag()
}

const decreaseQty = (item) => {
  if (item.quantity > 1) {
    item.quantity--
    saveBag()
  }
}

const removeItem = async (item) => {
  if (confirm('Remove this item from bag?')) {
    const key = getItemKey(item)

    const index = bagItems.value.findIndex(
      i =>
        i.productId === item.productId &&
        i.styleCode === item.styleCode &&
        i.size === item.size
    )

    if (index > -1) {
      bagItems.value.splice(index, 1)
      selectedItemKeys.value = selectedItemKeys.value.filter(itemKey => itemKey !== key)
      saveBag()
      await nextTick()
      updateIndeterminateState()
    }
  }
}

const validateBag = () => {
  if (selectedItems.value.length === 0) {
    alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!')
    return false
  }

  const invalidItems = selectedItems.value.filter(item => !item.colorName || !item.size)

  if (invalidItems.length > 0) {
    alert('Một số sản phẩm thiếu thông tin. Vui lòng kiểm tra lại!')
    console.error('❌ Invalid items:', invalidItems)
    return false
  }

  return true
}

// Guest Checkout - Chuyển thẳng đến checkout
const guestCheckout = () => {
  if (!validateBag()) return

  saveSelectedCheckoutItems()
  localStorage.setItem('checkoutMode', 'guest')
  router.push('/checkout')
}

// Member Checkout - Kiểm tra login trước
const memberCheckout = () => {
  if (!validateBag()) return

  saveSelectedCheckoutItems()

  if (isLoggedIn.value) {
    localStorage.setItem('checkoutMode', 'member')
    router.push('/checkout')
  } else {
    localStorage.setItem('redirectAfterLogin', '/checkout')
    localStorage.setItem('checkoutMode', 'member')
    router.push('/login')
  }
}

// Go to signup page
const goToSignup = () => {
  localStorage.setItem('redirectAfterLogin', '/bag')
  router.push('/register')
}
</script>
