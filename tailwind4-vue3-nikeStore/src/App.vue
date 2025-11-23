<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/header/Header.vue'
import HeaderAdmin from './views/admin/HeaderAdmin.vue'

const route = useRoute()

// ✅ Kiểm tra user từ localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// ✅ Kiểm tra có phải admin route không
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

// ✅ Kiểm tra có phải trang login không
const isLoginPage = computed(() => {
  return route.path === '/login'
})

// ✅ Kiểm tra user có phải admin không
const isAdmin = computed(() => {
  const user = getCurrentUser()
  return user && user.role === 'admin'
})

// ✅ Logic hiển thị header
const shouldShowAdminHeader = computed(() => {
  return !isLoginPage.value && isAdminRoute.value && isAdmin.value
})

const shouldShowNormalHeader = computed(() => {
  return !isLoginPage.value && !isAdminRoute.value
})
</script>

<template>
  <div>
    <!-- ✅ Header Admin: chỉ hiển thị khi ở admin route VÀ user là admin -->
    <HeaderAdmin v-if="shouldShowAdminHeader" />

    <!-- ✅ Header thường: chỉ hiển thị khi KHÔNG phải admin route VÀ KHÔNG phải login -->
    <Header v-if="shouldShowNormalHeader" />

    <!-- ✅ Main Content với padding phù hợp -->
    <main :class="shouldShowAdminHeader ? 'pt-16' : shouldShowNormalHeader ? 'pt-[128px]' : ''">
      <router-view />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
}
</style>
