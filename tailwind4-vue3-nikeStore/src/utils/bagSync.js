// utils/bagSync.js

import axios from 'axios'
import { getBag, saveBag } from './bagStorage'
import { API_BASE } from './apiBase'

/**
 * Sync shopping bag items với database để lấy thông tin mới nhất
 * @param {Array} bagItems - Items từ localStorage
 * @returns {Promise<Array>} - Updated items với thông tin mới từ DB
 */
export async function syncBagWithDatabase(bagItems) {
  if (!bagItems || bagItems.length === 0) {
    return []
  }

  console.log('🔄 Syncing bag with database...', bagItems.length, 'items')

  const syncedItems = []
  
  for (const item of bagItems) {
    try {
      // 1. Fetch product detail from database
      const response = await axios.get(`${API_BASE}/shoes/detail/${item.productId}`)
      const productDetail = response.data

      // 2. Find matching color
      const color = productDetail.colors?.find(c => c.colorName === item.colorName)
      
      if (!color) {
        console.warn(`⚠️ Color "${item.colorName}" not found for product ${item.productId}`)
        // Giữ item cũ nhưng đánh dấu unavailable
        syncedItems.push({
          ...item,
          isAvailable: false,
          syncError: 'Color not found'
        })
        continue
      }

      // 3. Find matching size
      const size = color.sizes?.find(s => s.size === item.size)
      
      if (!size) {
        console.warn(`⚠️ Size "${item.size}" not found for ${item.colorName}`)
        syncedItems.push({
          ...item,
          isAvailable: false,
          syncError: 'Size not found'
        })
        continue
      }

      // 4. Check stock
      const currentStock = size.stock || 0
      const isAvailable = currentStock > 0

      // 5. Create updated item với thông tin mới từ DB
      const updatedItem = {
        // ✅ Giữ lại quantity từ bag
        quantity: item.quantity,
        
        // ✅ Cập nhật thông tin từ database
        productId: productDetail.productId,
        name: productDetail.name, // ✅ Tên mới
        styleCode: color.styleCode,
        colorName: color.colorName,
        size: item.size,
        price: color.price, // ✅ Giá mới
        thumbnail: color.thumbnail, // ✅ Ảnh mới
        image: color.images?.[0] || color.thumbnail,
        
        // ✅ Stock info
        stock: currentStock,
        isAvailable,
        
        // ✅ Metadata
        category: color.category,
        updatedAt: new Date().toISOString()
      }

      syncedItems.push(updatedItem)
      
      console.log(`✅ Synced: ${updatedItem.name} (${updatedItem.colorName})`)
      
    } catch (error) {
      console.error(`❌ Error syncing item ${item.productId}:`, error)
      // Giữ item cũ nhưng đánh dấu có lỗi
      syncedItems.push({
        ...item,
        syncError: error.message
      })
    }
  }

  console.log('✅ Bag sync completed:', syncedItems.length, 'items')
  
  return syncedItems
}

/**
 * Lưu synced bag vào localStorage
 * @param {Array} syncedItems 
 */
export function saveSyncedBag(syncedItems) {
  saveBag(syncedItems)
  
  // Dispatch event để Header cập nhật badge
  window.dispatchEvent(new Event('storage'))
  
  console.log('💾 Synced bag saved to localStorage')
}

/**
 * Validate và sync bag, sau đó lưu lại
 * @returns {Promise<Array>} - Synced items
 */
export async function validateAndSyncBag() {
  const bagItems = getBag()
  if (!bagItems.length) return []

  const syncedItems = await syncBagWithDatabase(bagItems)
  
  saveSyncedBag(syncedItems)
  
  return syncedItems
}
