<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 class="text-2xl font-semibold mb-4">Trang không tồn tại</h2>
      <p class="text-gray-600 mb-8">Trang bạn đang tìm kiếm không tồn tại.</p>
      <button
        @click="$router.push('/')"
        class="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
      >
        Về trang chủ
      </button>
    </div>
  </div>
</template>
