export const PRODUCT_SCROLL_RESTORE_KEY = 'ptt-product-scroll-restore'
export const PRODUCT_SCROLL_RESTORE_MAX_AGE_MS = 10 * 60 * 1000

const canUseSessionStorage = () => typeof window !== 'undefined' && window.sessionStorage

export const removeProductScrollRestore = () => {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(PRODUCT_SCROLL_RESTORE_KEY)
}

export const readProductScrollRestore = (routeFullPath, { removeInvalid = true } = {}) => {
  if (!canUseSessionStorage()) return null

  try {
    const raw = window.sessionStorage.getItem(PRODUCT_SCROLL_RESTORE_KEY)
    if (!raw) return null

    const saved = JSON.parse(raw)
    const isExpired = Date.now() - Number(saved.savedAt || 0) > PRODUCT_SCROLL_RESTORE_MAX_AGE_MS
    const isSameRoute = saved.route === (routeFullPath || '')

    if (isExpired || !isSameRoute) {
      if (removeInvalid) removeProductScrollRestore()
      return null
    }

    return saved
  } catch {
    if (removeInvalid) removeProductScrollRestore()
    return null
  }
}

export const hasProductScrollRestoreForRoute = (routeFullPath) =>
  Boolean(readProductScrollRestore(routeFullPath, { removeInvalid: false }))
