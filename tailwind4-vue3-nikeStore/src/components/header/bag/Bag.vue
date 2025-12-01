<template>
  <div class="max-w-7xl mx-auto p-4 lg:p-6">
    <!-- Free Delivery Banner -->
    <div class="bg-gray-100 text-center py-3 mb-6 text-sm">
      <span class="font-semibold">FREE DELIVERY</span>
      <span class="ml-2">Applies to orders of 5,000,000₫ or more.</span>
    </div>

    <!-- Empty Bag State -->
    <div v-if="bagItems.length === 0" class="text-center py-20">
      <h2 class="text-2xl font-semibold mb-2">Your Bag is Empty</h2>
      <p class="text-gray-600 mb-6">Add some products to get started!</p>
      <router-link to="/" class="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800">
        Continue Shopping
      </router-link>
    </div>

    <!-- Bag Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Bag Items -->
      <div class="lg:col-span-2">
        <h2 class="text-2xl font-semibold mb-6">Bag</h2>
        
        <div v-for="item in bagItems" :key="`${item.productId}-${item.styleCode}-${item.size}`"
          class="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div class="flex gap-4">
            <img :src="item.thumbnail || item.image" :alt="item.name"
              class="w-32 h-32 object-cover rounded-md" />
            
            <div class="flex-1">
              <h3 class="font-semibold text-lg mb-1">{{ item.name }}</h3>
              <p class="text-gray-600 text-sm mb-2">
                {{ item.colorName }}<br>
                Size {{ item.size }}
              </p>
              
              <div class="flex items-center gap-3 mt-4">
                <button @click="decreaseQty(item)" 
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100">-</button>
                <span class="w-8 text-center">{{ item.quantity }}</span>
                <button @click="increaseQty(item)"
                  class="w-8 h-8 border border-gray-300 rounded-full hover:bg-gray-100">+</button>
                <button @click="removeItem(item)" class="ml-4 text-red-600 hover:text-red-800 text-sm">
                  Remove
                </button>
              </div>
            </div>
            
            <div class="font-semibold text-lg">{{ formatPrice(item.price) }}</div>
          </div>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg p-6 shadow-sm sticky top-6">
          <h2 class="text-2xl font-semibold mb-6">Summary</h2>
          
          <div class="space-y-4">
            <div class="flex justify-between">
              <span>Subtotal</span>
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
          
          <div class="mt-6 space-y-3">
            <button @click="guestCheckout"
              class="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800">
              Guest Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const bagItems = ref([])

onMounted(() => {
  loadBag()
})

const loadBag = () => {
  const saved = localStorage.getItem('shoppingBag')
  if (saved) {
    bagItems.value = JSON.parse(saved)
    console.log('📦 Bag items loaded:', bagItems.value)
    
    bagItems.value.forEach(item => {
      if (!item.colorName || !item.size) {
        console.warn('⚠️ Item thiếu thông tin:', item)
      }
    })
  }
}

const saveBag = () => {
  localStorage.setItem('shoppingBag', JSON.stringify(bagItems.value))
  // ✅ Dispatch event để header cập nhật
  window.dispatchEvent(new Event('bagUpdated'))
}

const subtotal = computed(() => {
  return bagItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const deliveryFee = computed(() => {
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

const removeItem = (item) => {
  if (confirm('Remove this item from bag?')) {
    const index = bagItems.value.findIndex(
      i => i.productId === item.productId && 
           i.styleCode === item.styleCode && 
           i.size === item.size
    )
    if (index > -1) {
      bagItems.value.splice(index, 1)
      saveBag()
    }
  }
}

const guestCheckout = () => {
  const invalidItems = bagItems.value.filter(item => !item.colorName || !item.size)
  
  if (invalidItems.length > 0) {
    alert('Một số sản phẩm thiếu thông tin. Vui lòng kiểm tra lại!')
    console.error('❌ Invalid items:', invalidItems)
    return
  }
  
  router.push('/checkout')
}
</script>
