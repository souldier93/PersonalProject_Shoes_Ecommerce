import assert from 'node:assert/strict'

global.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  },
  setItem(key, value) {
    this.store.set(key, String(value))
  },
}

const {
  normalizeGuestEmail,
  normalizeGuestOrderCode,
  readGuestOrderAccess,
  saveGuestOrderAccess,
  saveGuestOrderAccessFromOrder,
} = await import('../src/utils/guestOrders.js')

assert.equal(normalizeGuestEmail('  Guest@Example.COM '), 'guest@example.com')
assert.equal(normalizeGuestOrderCode('Order #123-456 abc'), '123456')

saveGuestOrderAccess({ email: 'Guest@Example.COM', orderCode: '123456' })
saveGuestOrderAccess({ email: 'guest@example.com', orderCode: '123456' })
assert.deepEqual(readGuestOrderAccess(), [
  { email: 'guest@example.com', orderCode: '123456' },
])

saveGuestOrderAccessFromOrder({
  isGuest: true,
  customerInfo: { email: 'Buyer@Example.com' },
  paymentData: { orderCode: 999001 },
})

assert.deepEqual(readGuestOrderAccess()[0], {
  email: 'buyer@example.com',
  orderCode: '999001',
})

saveGuestOrderAccessFromOrder({
  isGuest: false,
  customerInfo: { email: 'member@example.com' },
  paymentData: { orderCode: 111 },
})

assert.equal(readGuestOrderAccess().some(item => item.orderCode === '111'), false)
