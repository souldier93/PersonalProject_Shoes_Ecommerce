const CHAT_GUEST_KEY = 'chatGuestId'

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

export const getChatGuestId = () => {
  let guestId = localStorage.getItem(CHAT_GUEST_KEY)
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem(CHAT_GUEST_KEY, guestId)
  }
  return guestId
}

export const buildChatIdentity = () => {
  const user = getCurrentUser()

  if (user?._id) {
    return {
      userId: user._id,
      guestId: '',
      customerName: user.username || user.name || 'Member',
      customerEmail: user.email || '',
    }
  }

  return {
    userId: '',
    guestId: getChatGuestId(),
    customerName: 'Guest',
    customerEmail: '',
  }
}
