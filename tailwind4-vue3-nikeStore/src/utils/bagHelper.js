import { getBag, saveBag } from './bagStorage'

export { getBag, saveBag }

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

export const removeFromBag = (index) => {
  const bag = getBag()
  bag.splice(index, 1)
  saveBag(bag)
}

export const updateQuantity = (index, quantity) => {
  const bag = getBag()
  if (quantity <= 0) {
    removeFromBag(index)
  } else {
    bag[index].quantity = quantity
    saveBag(bag)
  }
}

export const getBagCount = () => {
  const bag = getBag()
  return bag.reduce((sum, item) => sum + item.quantity, 0)
}
