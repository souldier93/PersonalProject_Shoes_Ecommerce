const GUEST_ORDER_ACCESS_KEY = 'guestOrderAccess:v1'
const MAX_GUEST_ORDER_RECORDS = 12

export const normalizeGuestEmail = (email = '') => String(email).trim().toLowerCase()

export const normalizeGuestOrderCode = (orderCode = '') =>
  String(orderCode).replace(/\D/g, '').slice(0, 18)

export const readGuestOrderAccess = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_ORDER_ACCESS_KEY) || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(record => ({
        email: normalizeGuestEmail(record.email),
        orderCode: normalizeGuestOrderCode(record.orderCode),
      }))
      .filter(record => record.email && record.orderCode)
  } catch {
    return []
  }
}

export const saveGuestOrderAccess = ({ email, orderCode }) => {
  const record = {
    email: normalizeGuestEmail(email),
    orderCode: normalizeGuestOrderCode(orderCode),
  }

  if (!record.email || !record.orderCode) return []

  const existing = readGuestOrderAccess()
  const next = [
    record,
    ...existing.filter(item =>
      item.email !== record.email || item.orderCode !== record.orderCode
    ),
  ].slice(0, MAX_GUEST_ORDER_RECORDS)

  localStorage.setItem(GUEST_ORDER_ACCESS_KEY, JSON.stringify(next))
  return next
}

export const saveGuestOrderAccessFromOrder = (orderData = {}) => {
  if (!orderData.isGuest) return []

  const email =
    orderData.customerInfo?.email ||
    orderData.customerEmail ||
    orderData.paymentData?.customerEmail ||
    ''
  const orderCode = orderData.paymentData?.orderCode || orderData.orderCode || ''

  return saveGuestOrderAccess({ email, orderCode })
}
