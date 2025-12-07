<template>
  <div class="p-8 mt-16 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Users Management</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>

    <!-- User Management Section -->
    <div v-else class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold">All Users</h2>
          <p class="text-sm text-gray-500 mt-1">Total: {{ users.length }} users</p>
        </div>
        <button 
          @click="showCreateUserModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b-2 border-gray-200">
            <tr class="text-left text-sm font-semibold text-gray-700">
              <th class="pb-3 px-2">Username</th>
              <th class="pb-3 px-2">Email</th>
              <th class="pb-3 px-2">Role</th>
              <th class="pb-3 px-2">Age</th>
              <th class="pb-3 px-2">Status</th>
              <th class="pb-3 px-2">Created At</th>
              <th class="pb-3 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-for="user in users" :key="user._id" class="border-b hover:bg-gray-50 transition">
              <td class="py-4 px-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 font-semibold text-sm">{{ user.username.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="font-medium">{{ user.username }}</span>
                </div>
              </td>
              <td class="py-4 px-2 text-gray-600">{{ user.email }}</td>
              <td class="py-4 px-2">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-purple-100 text-purple-700': user.roleId?.name === 'admin',
                    'bg-blue-100 text-blue-700': user.roleId?.name === 'manager',
                    'bg-gray-100 text-gray-700': user.roleId?.name === 'user'
                  }">
                  {{ user.roleId?.name || 'N/A' }}
                </span>
              </td>
              <td class="py-4 px-2 text-gray-600">{{ user.age || '-' }}</td>
              <td class="py-4 px-2">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-green-100 text-green-700': user.active,
                    'bg-red-100 text-red-700': !user.active
                  }">
                  {{ user.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="py-4 px-2 text-gray-600">{{ formatDate(user.createdAt) }}</td>
              <td class="py-4 px-2">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditRoleModal(user)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Change Role">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="viewUserDetails(user)"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="View Details">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="7" class="py-12 text-center text-gray-400">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p class="text-lg">No users found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Create New User</h3>
          <button @click="showCreateUserModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="createUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Username *</label>
            <input 
              v-model="newUser.username" 
              type="text" 
              required
              placeholder="Enter username"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Email *</label>
            <input 
              v-model="newUser.email" 
              type="email" 
              required
              placeholder="user@example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Password *</label>
            <input 
              v-model="newUser.password" 
              type="password" 
              required
              placeholder="Minimum 6 characters"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Role *</label>
            <select 
              v-model="newUser.roleName" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Age</label>
            <input 
              v-model.number="newUser.age" 
              type="number" 
              placeholder="Optional"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div class="flex gap-3 justify-end pt-4">
            <button 
              type="button"
              @click="showCreateUserModal = false"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Role Modal -->
    <div v-if="showEditRoleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Change User Role</h3>
          <button @click="showEditRoleModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">User: <strong class="text-gray-900">{{ selectedUser?.username }}</strong></p>
          <p class="text-sm text-gray-600">Current Role: 
            <span class="px-2 py-1 rounded text-xs font-semibold" :class="{
              'bg-purple-100 text-purple-700': selectedUser?.roleId?.name === 'admin',
              'bg-blue-100 text-blue-700': selectedUser?.roleId?.name === 'manager',
              'bg-gray-100 text-gray-700': selectedUser?.roleId?.name === 'user'
            }">
              {{ selectedUser?.roleId?.name }}
            </span>
          </p>
        </div>
        <form @submit.prevent="updateUserRole">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700">Select New Role</label>
            <select 
              v-model="editRole.roleName" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-4">
            <button 
              type="button"
              @click="showEditRoleModal = false"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View User Details Modal -->
    <div v-if="showUserDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">User Details</h3>
          <button @click="showUserDetailsModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div v-if="selectedUser" class="space-y-3">
          <div class="flex items-center gap-3 pb-3 border-b">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-bold text-2xl">{{ selectedUser.username.charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <p class="font-bold text-lg">{{ selectedUser.username }}</p>
              <p class="text-sm text-gray-500">{{ selectedUser.email }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-500 mb-1">Role</p>
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="{
                'bg-purple-100 text-purple-700': selectedUser.roleId?.name === 'admin',
                'bg-blue-100 text-blue-700': selectedUser.roleId?.name === 'manager',
                'bg-gray-100 text-gray-700': selectedUser.roleId?.name === 'user'
              }">
                {{ selectedUser.roleId?.name }}
              </span>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Status</p>
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="{
                'bg-green-100 text-green-700': selectedUser.active,
                'bg-red-100 text-red-700': !selectedUser.active
              }">
                {{ selectedUser.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Age</p>
              <p class="font-medium">{{ selectedUser.age || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Created</p>
              <p class="font-medium text-sm">{{ formatDate(selectedUser.createdAt) }}</p>
            </div>
          </div>
          <div v-if="selectedUser.roleId?.permissions" class="pt-3 border-t">
            <p class="text-xs text-gray-500 mb-2">Permissions</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="perm in selectedUser.roleId.permissions" :key="perm" 
                class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {{ perm }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const users = ref([])

// Modal states
const showCreateUserModal = ref(false)
const showEditRoleModal = ref(false)
const showUserDetailsModal = ref(false)
const selectedUser = ref(null)

// Form data
const newUser = ref({
  username: '',
  email: '',
  password: '',
  roleName: 'user',
  age: null
})

const editRole = ref({
  roleName: ''
})

onMounted(async () => {
  await loadUsers()
})

const loadUsers = async () => {
  try {
    const accessTokenaccessToken = localStorage.getItem('accessToken')
    const response = await axios.get('http://localhost:3000/auth/users', {
      headers: {
        'Authorization': `Bearer ${accessTokenaccessToken}`
      }
    })
    users.value = response.data
  } catch (error) {
    console.error('Failed to load users:', error)
    alert('Failed to load users. Please make sure you are logged in as admin.')
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  try {
    const response = await axios.post('http://localhost:3000/auth/register', newUser.value)
    
    alert('✅ User created successfully!')
    showCreateUserModal.value = false
    
    // Reset form
    newUser.value = {
      username: '',
      email: '',
      password: '',
      roleName: 'user',
      age: null
    }
    
    // Reload users
    await loadUsers()
  } catch (error) {
    console.error('Failed to create user:', error)
    alert('❌ ' + (error.response?.data?.message || 'Failed to create user'))
  }
}

const openEditRoleModal = (user) => {
  selectedUser.value = user
  editRole.value.roleName = user.roleId?.name || 'user'
  showEditRoleModal.value = true
}

const updateUserRole = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken')
    await axios.patch(
      `http://localhost:3000/auth/users/${selectedUser.value._id}/role`,
      { roleName: editRole.value.roleName },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    alert('✅ User role updated successfully!')
    showEditRoleModal.value = false
    
    // Reload users
    await loadUsers()
  } catch (error) {
    console.error('Failed to update user role:', error)
    alert('❌ ' + (error.response?.data?.message || 'Failed to update user role'))
  }
}

const viewUserDetails = (user) => {
  selectedUser.value = user
  showUserDetailsModal.value = true
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>