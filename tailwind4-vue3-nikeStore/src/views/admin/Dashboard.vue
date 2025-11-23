<template>
  <div class="p-8 mt-16 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Stats Cards -->
      <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-500 text-sm font-medium">Total Products</h3>
          <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p class="text-3xl font-bold">1,234</p>
        <p class="text-sm text-green-600 mt-2">↑ 12% from last month</p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-500 text-sm font-medium">Total Orders</h3>
          <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-3xl font-bold">567</p>
        <p class="text-sm text-green-600 mt-2">↑ 8% from last month</p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-500 text-sm font-medium">Total Customers</h3>
          <svg class="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p class="text-3xl font-bold">890</p>
        <p class="text-sm text-green-600 mt-2">↑ 5% from last month</p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-500 text-sm font-medium">Revenue</h3>
          <svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-3xl font-bold">Rp 123,450,000</p>
        <p class="text-sm text-red-600 mt-2">↓ 3% from last month</p>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="text-xl font-bold mb-4">Recent Orders</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b">
            <tr class="text-left text-sm text-gray-600">
              <th class="pb-3">Order ID</th>
              <th class="pb-3">Customer</th>
              <th class="pb-3">Product</th>
              <th class="pb-3">Amount</th>
              <th class="pb-3">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr class="border-b">
              <td class="py-3">#12345</td>
              <td class="py-3">John Doe</td>
              <td class="py-3">Nike Air Max 90</td>
              <td class="py-3">Rp 1,799,000</td>
              <td class="py-3"><span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">Completed</span></td>
            </tr>
            <tr class="border-b">
              <td class="py-3">#12346</td>
              <td class="py-3">Jane Smith</td>
              <td class="py-3">Adidas Superstar</td>
              <td class="py-3">Rp 2,000,000</td>
              <td class="py-3"><span class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs">Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dashboard logic here
</script>
