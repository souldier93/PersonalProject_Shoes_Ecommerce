export const CATEGORY_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
]

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'running', label: 'Running' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'training', label: 'Training' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
]

export const SIZE_OPTIONS = [
  'ONE SIZE',
  'XXS',
  'XS',
  'S',
  'S/M',
  'M',
  'M/L',
  'L',
  'L/XL',
  'XL',
  'XXL',
  '3XL',
  '3.5Y',
  '4Y',
  '4.5Y',
  '5Y',
  '5.5Y',
  '6Y',
  '6.5Y',
  '7Y',
  '35.5',
  '36',
  '36.5',
  '37.5',
  '38',
  '38.5',
  '39',
  '40',
  '40.5',
  '41',
  '42',
  '42.5',
  '43',
  '44',
  '44.5',
  '45',
]

export const categoryLabel = (value) => {
  return CATEGORY_OPTIONS.find(option => option.value === value)?.label || value || 'Unisex'
}

export const categoryTitle = (value) => {
  const labels = {
    men: "Men's Shoes",
    women: "Women's Shoes",
    kids: "Kids' Shoes",
  }

  return labels[value] || 'Shoes'
}

export const productTypeLabel = (value) => {
  return PRODUCT_TYPE_OPTIONS.find(option => option.value === value)?.label || value || 'General'
}

export const productSubtitle = (category, productType) => {
  const type = productTypeLabel(productType)
  if (productType === 'apparel') return `${categoryLabel(category)} Apparel`
  if (productType === 'accessories') return 'Accessories'
  if (!productType) return categoryTitle(category)
  return `${categoryTitle(category)} / ${type}`
}
