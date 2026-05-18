<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/header/Header.vue'
import HeaderAdmin from './views/admin/HeaderAdmin.vue'
import ChatWidget from './components/chat/ChatWidget.vue'

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
const isAuthPage = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

// ✅ Kiểm tra user có phải admin không
const isAdmin = computed(() => {
  const user = getCurrentUser()
  return user && ['admin', 'manager'].includes(user.role)
})

// ✅ Logic hiển thị header
const shouldShowAdminHeader = computed(() => {
  return !isAuthPage.value && isAdminRoute.value && isAdmin.value
})

const shouldShowNormalHeader = computed(() => {
  return !isAuthPage.value && !isAdminRoute.value
})
</script>

<template>
  <div>
    <!-- ✅ Header Admin: chỉ hiển thị khi ở admin route VÀ user là admin -->
    <HeaderAdmin v-if="shouldShowAdminHeader" />

    <!-- ✅ Header thường: chỉ hiển thị khi KHÔNG phải admin route VÀ KHÔNG phải login -->
    <Header v-if="shouldShowNormalHeader" />

    <!-- ✅ Main Content với padding phù hợp -->
    <main :class="shouldShowAdminHeader ? 'pt-16' : shouldShowNormalHeader ? 'pt-[112px] md:pt-[140px]' : ''">
      <router-view />
    </main>

    <ChatWidget v-if="shouldShowNormalHeader" />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
}
</style>
