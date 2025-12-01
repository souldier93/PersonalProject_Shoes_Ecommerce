// Lấy giỏ hàng từ localStorage
export const getBag = () => {
  const saved = localStorage.getItem('shoppingBag')
  return saved ? JSON.parse(saved) : []
}

// Lưu giỏ hàng và trigger update
export const saveBag = (bag) => {
  localStorage.setItem('shoppingBag', JSON.stringify(bag))
  window.dispatchEvent(new Event('bagUpdated'))
}

// Thêm sản phẩm vào giỏ
export const addToBag = (item) => {
  const bag = getBag()
  const existingIndex = bag.findIndex(
    i => i.productId === item.productId && 
         i.styleCode === item.styleCode && 
         i.size === item.size
  )

  if (existingIndex > -1) {
    bag[existingIndex].quantity++
  } else {
    bag.push(item)
  }

  saveBag(bag)
}

// Xóa sản phẩm khỏi giỏ
export const removeFromBag = (index) => {
  const bag = getBag()
  bag.splice(index, 1)
  saveBag(bag)
}

// Cập nhật quantity
export const updateQuantity = (index, quantity) => {
  const bag = getBag()
  if (quantity <= 0) {
    removeFromBag(index)
  } else {
    bag[index].quantity = quantity
    saveBag(bag)
  }
}

// Tính tổng số sản phẩm
export const getBagCount = () => {
  const bag = getBag()
  return bag.reduce((sum, item) => sum + item.quantity, 0)
}
