import assert from 'node:assert/strict'

import {
  createBagItemFromWishlist,
  normalizeWishlistItem,
} from '../src/utils/wishlist.js'

const rawItem = {
  _id: 'wish-1',
  productId: '9001',
  productName: 'PTT Runner',
  colorName: 'Sail Black',
  size: '42',
  price: 2490000,
  thumbnail: '/shoe.webp',
  image: '/shoe-large.webp',
  stock: 3,
  styleCode: 'PTT-9001-100',
  isAvailable: true,
}

const item = normalizeWishlistItem(rawItem)

assert.equal(item.id, 'wish-1')
assert.equal(item.name, 'PTT Runner')
assert.equal(item.canMoveToBag, true)

assert.deepEqual(createBagItemFromWishlist(item), {
  productId: '9001',
  name: 'PTT Runner',
  styleCode: 'PTT-9001-100',
  colorName: 'Sail Black',
  size: '42',
  price: 2490000,
  quantity: 1,
  thumbnail: '/shoe.webp',
  image: '/shoe-large.webp',
  stock: 3,
})

assert.equal(
  createBagItemFromWishlist({ ...item, size: '', canMoveToBag: false }),
  null,
)

assert.equal(
  createBagItemFromWishlist({ ...item, isAvailable: false, canMoveToBag: false }),
  null,
)

const fallbackItem = normalizeWishlistItem({
  productId: '9002',
  name: 'Fallback Sneaker',
  price: '1490000',
  stock: 0,
})

assert.equal(fallbackItem.id, '9002')
assert.equal(fallbackItem.price, 1490000)
assert.equal(fallbackItem.canMoveToBag, false)
