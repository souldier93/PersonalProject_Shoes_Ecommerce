<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { API_BASE } from '../../../utils/apiBase'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter username/email and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      username: username.value.trim(),
      password: password.value,
    })

    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.dispatchEvent(new Event('bagCountUpdated'))
      axios.defaults.headers.common.Authorization = `Bearer ${res.data.accessToken}`

      if (res.data.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
    }
  } catch (err) {
    if (err.response) {
      errorMessage.value = err.response.data.message || 'Login failed'
    } else if (err.request) {
      errorMessage.value = 'Cannot connect to server'
    } else {
      errorMessage.value = 'An error occurred'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-10">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg sm:p-8">
      <h2 class="mb-6 text-center text-2xl font-bold">Sign in</h2>

      <input
        v-model="username"
        placeholder="Username or email"
        class="mb-4 w-full rounded-md border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
        autocomplete="username"
        @keyup.enter="handleLogin"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="mb-6 w-full rounded-md border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
        autocomplete="current-password"
        @keyup.enter="handleLogin"
      />

      <button
        @click="handleLogin"
        :disabled="isLoading"
        class="w-full rounded-full bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {{ isLoading ? 'Signing in...' : 'Sign in' }}
      </button>

      <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <p class="mt-6 text-center text-sm text-gray-600">
        New to the store?
        <router-link class="font-semibold text-black underline" to="/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>
