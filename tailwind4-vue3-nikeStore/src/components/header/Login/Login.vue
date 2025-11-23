<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const message = ref('')

const handleLogin = async () => {
  try {
    const res = await axios.post('http://localhost:3000/auth/login', {
      username: username.value,
      password: password.value
    })

    console.log('Response:', res.data)

    if (res.data.success) {
      // ✅ Lưu user vào localStorage
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      // ✅ Redirect dựa trên role
      if (res.data.user.role === 'admin') {
        router.push('/admin/dashboard') // ✅ Đổi từ '/adminManage' → '/admin/dashboard'
      } else {
        router.push('/')
      }
      
      alert(`✅ Đăng nhập thành công, xin chào ${res.data.user.username}!`)
    } else {
      alert('❌ Sai tên đăng nhập hoặc mật khẩu!')
    }
  } catch (err) {
    console.error('Lỗi kết nối:', err)
    alert('🚫 Không thể kết nối đến server NestJS!')
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
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full mb-6 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
      />

      <button
        @click="handleLogin"
        class="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
      >
        Đăng nhập
      </button>

      <p class="text-red-500 text-center mt-4">{{ message }}</p>
    </div>
  </div>
</template>
