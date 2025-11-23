<script setup>
import './Header.css'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <nav class="flex items-center justify-between px-10 py-4 bg-white shadow-sm fixed top-0 left-0 w-full z-50">
    <div class="flex items-center space-x-4">
      <router-link to="/">
        <img src="/public/assets/img/Logo_NIKE.svg.png" alt="Nike"
          class="w-10 cursor-pointer hover:opacity-80 transition" />
      </router-link>
      <ul class="hidden md:flex space-x-8 font-semibold text-gray-900">
        <li><a href="#" class="hover:text-gray-600">New & Featured</a></li>
        <li><a href="#" class="hover:text-gray-600">Men</a></li>
        <li><a href="#" class="hover:text-gray-600">Women</a></li>
        <li><a href="#" class="hover:text-gray-600">Kids</a></li>
        <li><a href="#" class="hover:text-gray-600">Sale</a></li>
      </ul>
    </div>

    <div class="flex items-center space-x-6">
      <div class="flex items-center bg-gray-100 rounded-full px-4 py-1.5 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
        </svg>
        <span class="ml-2 text-sm font-medium text-gray-600">Search</span>
      </div>

      <!-- Heart -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-6 h-6 hover:scale-110 transition">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21.435 5.27a5.97 5.97 0 00-8.435 0L12 6.27l-.999-.999a5.97 5.97 0 00-8.435 8.435l.999.999L12 21l8.435-6.294.999-.999a5.97 5.97 0 000-8.435z" />
      </svg>

      <!-- Bag -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-6 h-6 hover:scale-110 transition">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M3 3h18l-2 13H5L3 3zm9 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      </svg>

      <!-- ✅ Nút Login -->
      <button @click="goToLogin" class="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition">
        Login
      </button>
    </div>
  </nav>

  <div class="text-center py-3 bg-gray-100 text-sm mt-[64px]">
    Free Standard Delivery & 30-Day Free Returns ·
    <a href="#" class="underline">Join Now</a>
  </div>
</template>
