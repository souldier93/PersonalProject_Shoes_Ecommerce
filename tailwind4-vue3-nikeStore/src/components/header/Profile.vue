<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 mt-16">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 h-fit">
        <h1 class="text-3xl font-bold mb-2">My Profile</h1>
        <p class="text-gray-500 text-sm">{{ user.email }}</p>
        <div class="mt-6 space-y-2 text-sm">
          <router-link to="/my-orders" class="block px-3 py-2 rounded-lg hover:bg-gray-50">Orders</router-link>
          <router-link to="/wishlist" class="block px-3 py-2 rounded-lg hover:bg-gray-50">Wishlist</router-link>
        </div>
      </section>

      <div class="lg:col-span-2 space-y-6">
        <form @submit.prevent="saveProfile" class="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 class="text-xl font-bold">Account Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input v-model="profile.username" placeholder="Username" class="input" />
            <input v-model="profile.fullName" placeholder="Full name" class="input" />
            <input v-model="profile.email" type="email" placeholder="Email" class="input" />
            <input v-model="profile.phone" placeholder="Phone" class="input" />
          </div>
          <button class="bg-black text-white px-5 py-3 rounded-lg font-semibold">Save Profile</button>
        </form>

        <form @submit.prevent="changePassword" class="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 class="text-xl font-bold">Password</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input v-model="passwordForm.currentPassword" type="password" placeholder="Current password" class="input" />
            <input v-model="passwordForm.newPassword" type="password" placeholder="New password" class="input" />
          </div>
          <button class="bg-black text-white px-5 py-3 rounded-lg font-semibold">Change Password</button>
        </form>

        <section class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">Addresses</h2>
            <button @click="resetAddressForm" class="text-sm underline">New Address</button>
          </div>

          <form @submit.prevent="saveAddress" class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <input v-model="addressForm.label" placeholder="Label, e.g. Home" class="input" />
            <input v-model="addressForm.phone" placeholder="Phone" class="input" />
            <input v-model="addressForm.firstName" placeholder="First name" class="input" />
            <input v-model="addressForm.lastName" placeholder="Last name" class="input" />
            <input v-model="addressForm.address" placeholder="Address" class="input md:col-span-2" />
            <input v-model="addressForm.city" placeholder="City" class="input" />
            <input v-model="addressForm.postalCode" placeholder="Postal code" class="input" />
            <label class="flex items-center gap-2 text-sm">
              <input v-model="addressForm.isDefault" type="checkbox" />
              Default address
            </label>
            <button class="bg-black text-white px-5 py-3 rounded-lg font-semibold md:justify-self-end">
              {{ editingAddressIndex === null ? 'Add Address' : 'Update Address' }}
            </button>
          </form>

          <div class="space-y-3">
            <div v-for="(address, index) in addresses" :key="index" class="border rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-semibold">{{ address.label || 'Address' }}</p>
                  <span v-if="address.isDefault" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Default</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ address.firstName }} {{ address.lastName }} · {{ address.phone }}</p>
                <p class="text-sm text-gray-600">{{ address.address }}, {{ address.city }} {{ address.postalCode }}</p>
              </div>
              <div class="flex gap-2">
                <button @click="editAddress(address, index)" class="text-sm text-blue-600">Edit</button>
                <button @click="deleteAddress(index)" class="text-sm text-red-600">Delete</button>
              </div>
            </div>
            <p v-if="addresses.length === 0" class="text-sm text-gray-500">No saved addresses yet.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const router = useRouter()

const user = ref({})
const profile = ref({})
const addresses = ref([])
const editingAddressIndex = ref(null)
const passwordForm = ref({ currentPassword: '', newPassword: '' })
const addressForm = ref(emptyAddress())

onMounted(async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    router.push('/login')
    return
  }
  user.value = JSON.parse(userStr)
  await fetchProfile()
})

async function fetchProfile() {
  const response = await axios.get(`${API_BASE}/auth/users/${user.value._id}/profile`)
  const data = response.data
  profile.value = {
    username: data.username,
    fullName: data.fullName || '',
    email: data.email,
    phone: data.phone || '',
  }
  addresses.value = data.addresses || []
}

async function saveProfile() {
  const response = await axios.patch(`${API_BASE}/auth/users/${user.value._id}/profile`, profile.value)
  const updatedUser = {
    ...user.value,
    username: response.data.user.username,
    email: response.data.user.email,
    fullName: response.data.user.fullName,
    phone: response.data.user.phone,
  }
  localStorage.setItem('user', JSON.stringify(updatedUser))
  user.value = updatedUser
  alert('Profile saved')
}

async function changePassword() {
  await axios.patch(`${API_BASE}/auth/users/${user.value._id}/password`, passwordForm.value)
  passwordForm.value = { currentPassword: '', newPassword: '' }
  alert('Password changed')
}

async function saveAddress() {
  const url = editingAddressIndex.value === null
    ? `${API_BASE}/auth/users/${user.value._id}/addresses`
    : `${API_BASE}/auth/users/${user.value._id}/addresses/${editingAddressIndex.value}`
  const method = editingAddressIndex.value === null ? axios.post : axios.patch
  const response = await method(url, addressForm.value)
  addresses.value = response.data.addresses || []
  resetAddressForm()
}

function editAddress(address, index) {
  editingAddressIndex.value = index
  addressForm.value = { ...address }
}

async function deleteAddress(index) {
  const response = await axios.delete(`${API_BASE}/auth/users/${user.value._id}/addresses/${index}`)
  addresses.value = response.data.addresses || []
}

function resetAddressForm() {
  editingAddressIndex.value = null
  addressForm.value = emptyAddress()
}

function emptyAddress() {
  return {
    label: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    isDefault: false,
  }
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
}

.input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.15);
}
</style>
