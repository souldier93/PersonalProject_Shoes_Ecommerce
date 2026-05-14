const LEGACY_BAG_KEY = 'shoppingBag'
const GUEST_BAG_KEY = 'shoppingBag:guest'

export const getCurrentBagOwner = () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return 'guest'

  try {
    const user = JSON.parse(userStr)
    return user._id || user.id || user.email || user.username || 'guest'
  } catch {
    return 'guest'
  }
}

export const getBagStorageKey = () => {
  const owner = getCurrentBagOwner()
  return owner === 'guest' ? GUEST_BAG_KEY : `shoppingBag:${owner}`
}

const readJsonArray = (key) => {
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const migrateLegacyBagIfNeeded = (key) => {
  if (getCurrentBagOwner() !== 'guest') return
  if (localStorage.getItem(key)) return

  const legacyBag = readJsonArray(LEGACY_BAG_KEY)
  if (!legacyBag.length) return

  localStorage.setItem(key, JSON.stringify(legacyBag))
  localStorage.removeItem(LEGACY_BAG_KEY)
}

export const getBag = () => {
  const key = getBagStorageKey()
  migrateLegacyBagIfNeeded(key)
  return readJsonArray(key)
}

export const saveBag = (bag) => {
  localStorage.setItem(getBagStorageKey(), JSON.stringify(bag || []))
  localStorage.removeItem(LEGACY_BAG_KEY)
  window.dispatchEvent(new Event('bagUpdated'))
}

export const clearTransientCheckout = () => {
  localStorage.removeItem('checkoutItems')
  localStorage.removeItem('pendingOrder')
  localStorage.removeItem('deliveryInfo')
}
