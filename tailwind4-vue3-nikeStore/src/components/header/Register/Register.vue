<script setup>
import { computed, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { API_BASE } from '../../../utils/apiBase'

const router = useRouter()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
})
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const canSubmit = computed(() => {
  return form.value.username &&
    form.value.email &&
    form.value.password &&
    form.value.confirmPassword &&
    !isLoading.value
})

const saveSession = (data) => {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('user', JSON.stringify(data.user))
  axios.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
  window.dispatchEvent(new Event('bagCountUpdated'))
}

const loginAfterRegister = async () => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    username: form.value.username.trim(),
    password: form.value.password,
  })

  if (response.data.success) {
    saveSession(response.data)
    router.push('/')
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (form.value.username.trim().length < 3) {
    errorMessage.value = 'Username must be at least 3 characters.'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    const payload = {
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      roleName: 'user',
    }

    if (form.value.age) {
      payload.age = Number(form.value.age)
    }

    const response = await axios.post(`${API_BASE}/auth/register`, payload)
    const registeredUser = response.data.user

    if (registeredUser?.isVerified) {
      successMessage.value = 'Account created. Signing you in...'
      await loginAfterRegister()
      return
    }

    successMessage.value = response.data.message || 'Account created. Please verify your email before logging in.'
  } catch (error) {
    if (error.response?.data?.message) {
      const message = error.response.data.message
      errorMessage.value = Array.isArray(message) ? message.join(' ') : message
    } else if (error.request) {
      errorMessage.value = 'Cannot connect to server.'
    } else {
      errorMessage.value = 'Registration failed. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg sm:p-8">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold">Create account</h2>
        <p class="mt-2 text-sm text-gray-500">Join the store to save orders, wishlist items, and checkout faster.</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <input
          v-model="form.username"
          class="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          placeholder="Username"
          autocomplete="username"
        />

        <input
          v-model="form.email"
          class="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          type="email"
          placeholder="Email"
          autocomplete="email"
        />

        <input
          v-model="form.age"
          class="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          type="number"
          min="1"
          placeholder="Age (optional)"
        />

        <input
          v-model="form.password"
          class="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          type="password"
          placeholder="Password"
          autocomplete="new-password"
        />

        <input
          v-model="form.confirmPassword"
          class="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          type="password"
          placeholder="Confirm password"
          autocomplete="new-password"
        />

        <button
          class="w-full rounded-full bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
          :disabled="!canSubmit"
          type="submit"
        >
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="mt-4 rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-700">
        {{ successMessage }}
      </p>

      <p class="mt-6 text-center text-sm text-gray-600">
        Already have an account?
        <router-link class="font-semibold text-black underline" to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
