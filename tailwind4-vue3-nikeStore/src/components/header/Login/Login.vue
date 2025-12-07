<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '⚠️ Please enter both username and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await axios.post('http://localhost:3000/auth/login', {
      username: username.value,
      password: password.value
    })

    console.log('✅ Login response:', res.data)

    if (res.data.success) {
      // ✅ Save token và user to localStorage
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      // ✅ Set default Authorization header cho tất cả requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`
      
      // Redirect based on role
      if (res.data.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
      
      alert(`✅ Welcome back, ${res.data.user.username}!`)
    }
  } catch (err) {
    console.error('❌ Login error:', err)
    
    if (err.response) {
      errorMessage.value = err.response.data.message || '❌ Login failed'
    } else if (err.request) {
      errorMessage.value = '🚫 Cannot connect to server'
    } else {
      errorMessage.value = '❌ An error occurred'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>

      <input
        v-model="username"
        placeholder="Username"
        class="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        @keyup.enter="handleLogin"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full mb-6 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        @keyup.enter="handleLogin"
      />

      <button
        @click="handleLogin"
        :disabled="isLoading"
        class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>

      <p v-if="errorMessage" class="text-red-500 text-center mt-4">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
