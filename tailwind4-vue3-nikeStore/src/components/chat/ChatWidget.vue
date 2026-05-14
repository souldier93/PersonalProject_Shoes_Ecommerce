<template>
  <div class="fixed bottom-5 right-5 z-50">
    <button
      v-if="!isOpen"
      @click="openChat"
      class="relative h-14 w-14 rounded-full bg-gray-950 text-white shadow-xl hover:bg-black transition flex items-center justify-center"
      aria-label="Open support chat">
      <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m8-2a9 9 0 11-4.21-7.62L21 4l-.92 4.09A8.96 8.96 0 0121 12z" />
      </svg>
      <span v-if="unreadCount" class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-[11px] font-bold flex items-center justify-center">
        {{ unreadCount }}
      </span>
    </button>

    <section
      v-else
      class="w-[calc(100vw-2rem)] sm:w-[380px] h-[560px] max-h-[calc(100vh-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      <header class="px-4 py-3 bg-gray-950 text-white flex items-center justify-between">
        <div>
          <h3 class="font-semibold leading-tight">Support Chat</h3>
          <p class="text-xs text-gray-300">Chatbot + quản lý cửa hàng</p>
        </div>
        <button @click="isOpen = false" class="p-2 rounded-lg hover:bg-white/10" aria-label="Close support chat">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div ref="messagesRef" class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        <div v-if="loading" class="h-full flex items-center justify-center text-sm text-gray-500">
          Loading chat...
        </div>

        <template v-else>
          <div
            v-for="message in messages"
            :key="message._id || `${message.createdAt}-${message.text}`"
            class="flex"
            :class="message.senderType === 'user' ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[82%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line"
              :class="bubbleClass(message.senderType)">
              <p class="text-[11px] mb-1 opacity-70">{{ senderLabel(message) }}</p>
              <p>{{ message.text }}</p>
              <p class="text-[10px] mt-1 opacity-60">{{ formatTime(message.createdAt) }}</p>
            </div>
          </div>
        </template>
      </div>

      <div class="px-3 py-2 border-t bg-white">
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="reply in quickReplies"
            :key="reply"
            @click="sendQuickReply(reply)"
            class="shrink-0 text-xs border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-100">
            {{ reply }}
          </button>
        </div>

        <form @submit.prevent="sendMessage" class="flex items-end gap-2">
          <textarea
            v-model="draft"
            rows="1"
            placeholder="Nhập câu hỏi của bạn..."
            class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            @keydown.enter.exact.prevent="sendMessage"></textarea>
          <button
            type="submit"
            :disabled="sending || !draft.trim()"
            class="h-10 w-10 rounded-lg bg-gray-950 text-white flex items-center justify-center disabled:opacity-40">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE } from '../../utils/apiBase'
import { buildChatIdentity } from '../../utils/chatIdentity'

const isOpen = ref(false)
const loading = ref(false)
const sending = ref(false)
const conversation = ref(null)
const draft = ref('')
const messagesRef = ref(null)
let pollTimer = null

const quickReplies = ['Tư vấn size', 'Kiểm tra tồn kho', 'Theo dõi đơn hàng', 'Gặp quản lý']

const messages = computed(() => conversation.value?.messages || [])
const unreadCount = computed(() => conversation.value?.unreadForCustomer || 0)

const openChat = async () => {
  isOpen.value = true
  await ensureConversation()
  await markRead()
  scrollToBottom()
}

const ensureConversation = async () => {
  if (conversation.value) return

  loading.value = true
  try {
    const response = await axios.post(`${API_BASE}/chat/conversations`, buildChatIdentity())
    conversation.value = response.data
  } finally {
    loading.value = false
  }
}

const refreshConversation = async () => {
  if (!conversation.value?._id) return

  try {
    const response = await axios.get(`${API_BASE}/chat/conversations/${conversation.value._id}`)
    conversation.value = response.data
    if (isOpen.value) {
      await markRead()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to refresh chat:', error)
  }
}

const markRead = async () => {
  if (!conversation.value?._id) return
  try {
    const response = await axios.patch(`${API_BASE}/chat/conversations/${conversation.value._id}/read`, {
      target: 'customer',
    })
    conversation.value = response.data
  } catch (error) {
    console.error('Failed to mark chat as read:', error)
  }
}

const sendMessage = async () => {
  const text = draft.value.trim()
  if (!text || sending.value) return

  await ensureConversation()
  sending.value = true
  draft.value = ''

  try {
    const identity = buildChatIdentity()
    const response = await axios.post(`${API_BASE}/chat/conversations/${conversation.value._id}/messages`, {
      senderType: 'user',
      senderName: identity.customerName || 'Customer',
      text,
      botEnabled: true,
    })
    conversation.value = response.data
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const sendQuickReply = async (text) => {
  draft.value = text
  await sendMessage()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const bubbleClass = (senderType) => {
  if (senderType === 'user') return 'bg-gray-950 text-white rounded-br-sm'
  if (senderType === 'manager') return 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
  return 'bg-blue-50 border border-blue-100 text-gray-900 rounded-bl-sm'
}

const senderLabel = (message) => {
  if (message.senderType === 'user') return 'Bạn'
  if (message.senderType === 'manager') return message.senderName || 'Quản lý'
  return message.senderName || 'Store Assistant'
}

const formatTime = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(async () => {
  await ensureConversation()
  pollTimer = window.setInterval(refreshConversation, 6000)
})

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>
