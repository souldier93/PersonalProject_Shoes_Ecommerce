export const WISHLIST_UPDATED_EVENT = 'wishlistUpdated'

const toText = (value) => (value == null ? '' : String(value))

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const getWishlistItemKey = (item = {}) => {
  return [
    toText(item.userId),
    toText(item.productId),
    toText(item.colorName),
    toText(item.size),
  ].join('|')
}

export const normalizeWishlistItem = (item = {}) => {
  const productId = toText(item.productId)
  const id = toText(item._id || item.id || productId)
  const size = toText(item.size)
  const stock = toNumber(item.stock)
  const isAvailable = Boolean(item.isAvailable ?? stock > 0)

  return {
    ...item,
    id,
    productId,
    name: toText(item.productName || item.name || 'Product'),
    colorName: toText(item.colorName),
    size,
    price: toNumber(item.price),
    thumbnail: toText(item.thumbnail || item.image),
    image: toText(item.image || item.thumbnail),
    styleCode: toText(item.styleCode),
    stock,
    isAvailable,
    notifyOnRestock: Boolean(item.notifyOnRestock),
    canMoveToBag: Boolean(productId && size && isAvailable && stock > 0),
  }
}

export const createBagItemFromWishlist = (item = {}) => {
  const normalized = normalizeWishlistItem(item)
  if (!normalized.canMoveToBag) return null

  return {
    productId: normalized.productId,
    name: normalized.name,
    styleCode: normalized.styleCode || `${normalized.productId}-${normalized.colorName || 'default'}`,
    colorName: normalized.colorName,
    size: normalized.size,
    price: normalized.price,
    quantity: 1,
    thumbnail: normalized.thumbnail,
    image: normalized.image || normalized.thumbnail,
    stock: normalized.stock,
  }
}

export const emitWishlistUpdated = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT))
}
