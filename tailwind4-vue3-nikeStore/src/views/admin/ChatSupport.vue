<template>
  <div class="mt-16 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Support Chat</h1>
        <p class="text-sm text-gray-500 mt-1">Quản lý hội thoại khách hàng và chatbot</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select v-model="statusFilter" @change="fetchConversations" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All conversations</option>
          <option value="pending_manager">Need manager</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <button @click="fetchConversations" class="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">
          Refresh
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <aside class="overflow-hidden rounded-xl border border-gray-200 bg-white xl:col-span-4">
        <div v-if="loadingList" class="p-8 text-center text-gray-500">Loading...</div>
        <button
          v-for="item in conversations"
          v-else
          :key="item._id"
          @click="selectConversation(item._id)"
          class="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50"
          :class="selectedId === item._id ? 'bg-gray-100' : ''">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold truncate">{{ item.customerName || 'Guest' }}</h3>
            <span class="text-[11px] px-2 py-1 rounded-full" :class="statusClass(item.status)">
              {{ statusLabel(item.status) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ item.customerEmail || item.userId || item.guestId }}</p>
          <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ item.lastMessage }}</p>
          <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>{{ formatDate(item.updatedAt) }}</span>
            <span v-if="item.unreadForManager" class="bg-red-600 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
              {{ item.unreadForManager }}
            </span>
          </div>
        </button>

        <div v-if="!loadingList && conversations.length === 0" class="p-8 text-center text-gray-500">
          No conversations yet.
        </div>
      </aside>

      <section class="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white xl:col-span-8 xl:min-h-[680px]">
        <div v-if="!selectedConversation" class="flex-1 flex items-center justify-center text-gray-400">
          Select a conversation to reply
        </div>

        <template v-else>
          <header class="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold">{{ selectedConversation.customerName || 'Guest' }}</h2>
              <p class="text-sm text-gray-500">{{ selectedConversation.customerEmail || selectedConversation.guestId }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="updateStatus('open')"
                class="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                Open
              </button>
              <button
                @click="updateStatus('resolved')"
                class="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">
                Resolve
              </button>
            </div>
          </header>

          <div ref="messagesRef" class="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-3">
            <div
              v-for="message in selectedConversation.messages"
              :key="message._id || `${message.createdAt}-${message.text}`"
              class="flex"
              :class="message.senderType === 'manager' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[72%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line" :class="bubbleClass(message.senderType)">
                <p class="text-[11px] mb-1 opacity-70">{{ senderLabel(message) }}</p>
                <p>{{ message.text }}</p>
                <p class="text-[10px] mt-1 opacity-60">{{ formatTime(message.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-gray-200">
            <div class="flex gap-2 mb-3 overflow-x-auto">
              <button
                v-for="reply in cannedReplies"
                :key="reply"
                @click="draft = reply"
                class="shrink-0 px-3 py-1 rounded-full border border-gray-300 text-xs hover:bg-gray-100">
                {{ reply }}
              </button>
            </div>

            <form @submit.prevent="sendManagerReply" class="flex items-end gap-3">
              <textarea
                v-model="draft"
                rows="2"
                placeholder="Nhập phản hồi cho khách..."
                class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"></textarea>
              <button
                type="submit"
                :disabled="sending || !draft.trim()"
                class="px-5 py-3 rounded-lg bg-gray-950 text-white font-medium disabled:opacity-40">
                Send
              </button>
            </form>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'

const conversations = ref([])
const selectedConversation = ref(null)
const selectedId = ref('')
const statusFilter = ref('all')
const loadingList = ref(false)
const sending = ref(false)
const draft = ref('')
const messagesRef = ref(null)
let pollTimer = null

const cannedReplies = [
  'Bạn gửi giúp mình mã đơn hàng để mình kiểm tra nhé.',
  'Sản phẩm này còn hàng, bạn chọn size/màu mình sẽ kiểm tra kỹ hơn.',
  'Mình đã nhận thông tin và sẽ hỗ trợ bạn ngay.',
]

const fetchConversations = async () => {
  loadingList.value = true
  try {
    const response = await axios.get(`${API_BASE}/chat/conversations`, {
      params: { status: statusFilter.value },
    })
    conversations.value = response.data

    if (selectedId.value) {
      const stillSelected = conversations.value.find((item) => item._id === selectedId.value)
      if (stillSelected) await fetchSelected()
    }
  } finally {
    loadingList.value = false
  }
}

const selectConversation = async (id) => {
  selectedId.value = id
  await fetchSelected()
  await markManagerRead()
  scrollToBottom()
}

const fetchSelected = async () => {
  if (!selectedId.value) return
  const response = await axios.get(`${API_BASE}/chat/conversations/${selectedId.value}`)
  selectedConversation.value = response.data
}

const markManagerRead = async () => {
  if (!selectedId.value) return
  const response = await axios.patch(`${API_BASE}/chat/conversations/${selectedId.value}/read`, {
    target: 'manager',
  })
  selectedConversation.value = response.data
}

const sendManagerReply = async () => {
  const text = draft.value.trim()
  if (!text || !selectedConversation.value?._id || sending.value) return

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  sending.value = true
  draft.value = ''

  try {
    const response = await axios.post(`${API_BASE}/chat/conversations/${selectedConversation.value._id}/messages`, {
      senderType: 'manager',
      senderName: user.username || 'Store Manager',
      text,
      botEnabled: false,
    })
    selectedConversation.value = response.data
    await fetchConversations()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const updateStatus = async (status) => {
  if (!selectedConversation.value?._id) return
  const response = await axios.patch(`${API_BASE}/chat/conversations/${selectedConversation.value._id}/status`, {
    status,
  })
  selectedConversation.value = response.data
  await fetchConversations()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const bubbleClass = (senderType) => {
  if (senderType === 'manager') return 'bg-gray-950 text-white rounded-br-sm'
  if (senderType === 'bot') return 'bg-blue-50 border border-blue-100 text-gray-900 rounded-bl-sm'
  return 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
}

const senderLabel = (message) => {
  if (message.senderType === 'manager') return message.senderName || 'Quản lý'
  if (message.senderType === 'bot') return message.senderName || 'Store Assistant'
  return message.senderName || 'Khách hàng'
}

const statusLabel = (status) => {
  if (status === 'pending_manager') return 'Need manager'
  if (status === 'resolved') return 'Resolved'
  return 'Open'
}

const statusClass = (status) => {
  if (status === 'pending_manager') return 'bg-orange-100 text-orange-700'
  if (status === 'resolved') return 'bg-green-100 text-green-700'
  return 'bg-blue-100 text-blue-700'
}

const formatTime = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(async () => {
  await fetchConversations()
  pollTimer = window.setInterval(fetchConversations, 7000)
})

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>
