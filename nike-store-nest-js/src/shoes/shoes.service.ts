import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shoe, ShoeDocument } from './shoes.schema';
import { ShoeDetail, ShoeDetailDocument } from './shoe-detail.schema';
import { Counter, CounterDocument } from './counter.schema';
import { Bill } from '../payment/bill.schema';
@Injectable()
export class ShoesService {
  constructor(
  @InjectModel(Shoe.name) private shoeModel: Model<ShoeDocument>,
  @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
  @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  @InjectModel('Bill') private billModel: Model<Bill>, // ✅ Thêm Bill model
) {}

  // ==================== COLLECTION shoes (LISTING) ====================

 // shoes.service.ts
async findAll() {
  const shoes = await this.shoeModel
    .find()
    .select('productId name category productType collection price color thumbnail')
    .lean()
    .exec();

  // ⭐ Tính stock và sold từ shoesDetail cho mỗi product
  const shoesWithStock = await Promise.all(
    shoes.map(async (shoe) => {
      const detail = await this.shoeDetailModel
        .findOne({ productId: shoe.productId })
        .lean()
        .exec();

      let totalStock = 0;
      // let totalSold = 0;

      if (detail?.colors) {
        detail.colors.forEach((color) => {
          if (color.sizes) {
            color.sizes.forEach((size) => {
              totalStock += Number(size.stock) || 0;
              // totalSold += Number(size.sold) || 0;
            });
          }
        });
      }

      return {
        ...shoe,
        stock: totalStock,
        // sold: totalSold,
      };
    })
  );

  return shoesWithStock;
}

async findWithFilters(query: {
  search?: string;
  category?: string;
  productType?: string;
  collection?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  color?: string;
  sort?: string;
}) {
  const details = await this.shoeDetailModel.find().lean().exec();
  const search = (query.search || '').trim().toLowerCase();
  const category = (query.category || '').trim().toLowerCase();
  const productType = (query.productType || '').trim().toLowerCase();
  const collection = (query.collection || '').trim().toLowerCase();
  const colorFilter = (query.color || '').trim().toLowerCase();
  const sizeFilter = (query.size || '').trim();
  const minPrice = query.minPrice ? Number(query.minPrice) : 0;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : Number.MAX_SAFE_INTEGER;

  const products = details
    .map(detail => {
      const matchingColors = (detail.colors || []).filter(color => {
        const price = Number(color.price || detail.price || 0);
        const colorStock = (color.sizes || []).reduce(
          (sum, size) => sum + Number(size.stock || 0),
          0,
        );
        const hasSize = !sizeFilter || (color.sizes || []).some(size => size.size === sizeFilter && Number(size.stock || 0) > 0);
        const matchesColor = !colorFilter || color.colorName?.toLowerCase().includes(colorFilter);

        return price >= minPrice && price <= maxPrice && hasSize && matchesColor && colorStock > 0;
      });

      const primaryColor = matchingColors[0] || detail.colors?.[0];
      const totalStock = matchingColors.reduce((sum, color) => {
        return sum + (color.sizes || []).reduce(
          (sizeSum, size) => sizeSum + Number(size.stock || 0),
          0,
        );
      }, 0);

      return {
        productId: detail.productId,
        name: detail.name,
        category: detail.category,
        productType: detail.productType || primaryColor?.productType || '',
        collection: detail.collection || primaryColor?.collection || '',
        price: Number(primaryColor?.price || detail.price || 0),
        color: primaryColor?.colorName || '',
        thumbnail: primaryColor?.thumbnail || primaryColor?.images?.[0] || '',
        stock: totalStock,
        rating: Number(primaryColor?.rating || 0),
        reviewCount: Number(primaryColor?.reviewCount || 0),
        colors: matchingColors.map(color => color.colorName),
        sizes: matchingColors.flatMap(color => color.sizes || []),
      };
    })
    .filter(product => {
      if (!product.stock) return false;
      if (category && product.category?.toLowerCase() !== category) return false;
      if (productType && product.productType?.toLowerCase() !== productType) return false;
      if (collection && product.collection?.toLowerCase() !== collection) return false;
      if (!search) return true;

      return [
        product.name,
        product.category,
        product.productType,
        product.collection,
        product.color,
        ...(product.colors || []),
      ].some(value => String(value || '').toLowerCase().includes(search));
    });

  const sort = query.sort || 'featured';
  products.sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'stock') return b.stock - a.stock;
    return Number(a.productId) - Number(b.productId);
  });

  return products;
}


  async findByCategory(category: string) {
    const shoes = await this.shoeModel
      .find({ category })
      .select('productId name category productType collection price color thumbnail')
      .lean()
      .exec();
    return shoes;
  }

  async findByProductId(productId: string) {
    const shoe = await this.shoeModel
      .findOne({ productId })
      .select('productId name category productType collection price color thumbnail')
      .lean()
      .exec();

    if (!shoe) {
      throw new NotFoundException(
        `Shoe with productId "${productId}" not found`,
      );
    }

    return shoe;
  }

  // ==================== COLLECTION shoesDetail (DETAIL PAGE) ====================

  async findDetailByProductId(productId: string) {
    const detail = await this.shoeDetailModel
      .findOne({ productId })
      .lean()
      .exec();
    if (!detail) {
      throw new NotFoundException(
        `Shoe detail with productId "${productId}" not found`,
      );
    }
    return detail;
  }

  async findDetailByStyleCode(styleCode: string) {
    const detail = await this.shoeDetailModel
      .findOne({
        'colors.styleCode': styleCode,
      })
      .lean()
      .exec();

    if (!detail) {
      throw new NotFoundException(
        `Shoe detail with styleCode "${styleCode}" not found`,
      );
    }
    return detail;
  }

  async findAllDetails() {
    return this.shoeDetailModel.find().lean().exec();
  }

  async findDetailsByCategory(category: string) {
    return this.shoeDetailModel.find({ category }).lean().exec();
  }

  // ==================== AUTO INCREMENT PRODUCT ID ====================

  private async getNextProductId(): Promise<string> {
    const result = await this.shoeDetailModel
      .aggregate([
        {
          $addFields: {
            productIdNum: { $toInt: '$productId' },
          },
        },
        {
          $group: {
            _id: null,
            maxId: { $max: '$productIdNum' },
          },
        },
      ])
      .exec();

    const maxId = result[0]?.maxId || 0;
    return (maxId + 1).toString();
  }

  // ==================== THÃŠM Sáº¢N PHáº¨M Má»šI (NHIá»€U MÃ€U) ====================

  async createProduct(productData: {
    name: string;
    category: string;
    productType?: string;
    collection?: string;
    colors: any[];
  }) {
    // 1. Táº¡o productId tá»± tÄƒng
    const productId = await this.getNextProductId();

    const now = new Date().toISOString();

    // 2. Chuáº©n bá»‹ dá»¯ liá»‡u cho shoesDetail
    // THEO Cáº¤U TRÃšC PRODUCTID 2: Táº¤T Cáº¢ THÃ”NG TIN TRONG colors[]
    const shoeDetailData = {
      productId,
      name: productData.name,
      category: productData.category,
      productType: productData.productType || '',
      collection: productData.collection || '',
      price: productData.colors[0]?.price || 0,

      // Array colors: Má»–I MÃ€U CÃ“ Äáº¦Y Äá»¦ Táº¤T Cáº¢ THÃ”NG TIN
      colors: productData.colors.map((color) => ({
        colorName: color.colorName,
        hex: color.hex || '',
        thumbnail: color.thumbnail,
        images: color.images || [],
        sizes: color.sizes || [],
        styleCode: color.styleCode || '',
        category: productData.category,
        productType: color.productType || productData.productType || '',
        collection: color.collection || productData.collection || '',
        createdAt: now,
        description: color.description || '',
        materialNote: color.materialNote || '',
        origin: color.origin || '',
        rating: 0,
        reviewCount: 0,
        updatedAt: now,
        price: color.price,
      })),
    };

    // 3. LÆ°u vÃ o collection shoesDetail (1 document cho cáº£ sáº£n pháº©m)
    const shoeDetail = new this.shoeDetailModel(shoeDetailData);
    await shoeDetail.save();

    // 4. LÆ°u vÃ o collection shoes (CHá»ˆ 1 DOCUMENT cho listing - láº¥y mÃ u Ä‘áº§u tiÃªn)
    const shoeData = {
      productId,
      name: productData.name,
      category: productData.category,
      productType: productData.productType || '',
      collection: productData.collection || '',
      price: productData.colors[0]?.price || 0,
      color: productData.colors[0]?.colorName || '',
      thumbnail: productData.colors[0]?.thumbnail || '',
    };

    const shoe = new this.shoeModel(shoeData);
    await shoe.save();

    return {
      productId,
      shoeDetail,
      shoe,
      message: `Created product with productId ${productId} and ${productData.colors.length} colors successfully`,
    };
  }

  // ==================== UPDATE & DELETE ====================

  async updateShoe(productId: string, updateData: any) {
    // 1️⃣ Update bảng shoes (listing) - CHỈ update những field user explicitly thay đổi
    const shoeUpdateData: any = {};

    if (updateData.name) shoeUpdateData.name = updateData.name;
    if (updateData.category) shoeUpdateData.category = updateData.category;
    if (updateData.productType !== undefined) shoeUpdateData.productType = updateData.productType;
    if (updateData.collection !== undefined) shoeUpdateData.collection = updateData.collection;

    // ⭐ CHỈ update shoes.thumbnail khi có field thumbnail EXPLICIT (từ tab Basic Info)
    // KHÔNG update khi chỉ có colors[] array
    if (updateData.thumbnail !== undefined) {
      shoeUpdateData.thumbnail = updateData.thumbnail;
    }

    // Nếu có dữ liệu cần update trong shoes table
    if (Object.keys(shoeUpdateData).length > 0) {
      const updatedShoe = await this.shoeModel
        .findOneAndUpdate(
          { productId },
          { $set: shoeUpdateData },
          { new: true },
        )
        .exec();

      if (!updatedShoe) {
        throw new NotFoundException(
          `Shoe with productId "${productId}" not found`,
        );
      }
    }

    // 2️⃣ Update bảng shoesDetail
    const detailUpdateData: any = {};

    if (updateData.name) detailUpdateData.name = updateData.name;
    if (updateData.category) detailUpdateData.category = updateData.category;
    if (updateData.productType !== undefined) detailUpdateData.productType = updateData.productType;
    if (updateData.collection !== undefined) detailUpdateData.collection = updateData.collection;

    // 3️⃣ Nếu có colors[] → REPLACE TOÀN BỘ colors array (bao gồm thumbnail của từng màu)
    if (updateData.colors && Array.isArray(updateData.colors)) {
      detailUpdateData.colors = updateData.colors.map((color) => ({
        colorName: color.colorName || '',
        hex: color.hex || '',
        thumbnail: color.thumbnail || '', // ⭐ Thumbnail từng màu - CHỈ update trong shoesDetail
        images: Array.isArray(color.images) ? color.images : [],
        sizes: Array.isArray(color.sizes) ? color.sizes : [],
        styleCode: color.styleCode || '',
        category: color.category || updateData.category || 'men',
        productType: color.productType || updateData.productType || '',
        collection: color.collection || updateData.collection || '',
        createdAt: color.createdAt || new Date().toISOString(),
        description: color.description || '',
        materialNote: color.materialNote || '',
        origin: color.origin || '',
        rating: Number(color.rating) || 0,
        reviewCount: Number(color.reviewCount) || 0,
        updatedAt: new Date().toISOString(),
        price: Number(color.price) || 0,
      }));
    }
    // 4️⃣ Nếu KHÔNG có colors nhưng có category → sync category cho colors hiện có
    else if (!updateData.colors && updateData.category) {
      const existingDetail = await this.shoeDetailModel
        .findOne({ productId })
        .exec();
      if (existingDetail && existingDetail.colors) {
        detailUpdateData.colors = existingDetail.colors.map((color) => ({
          ...color,
          category: updateData.category,
          productType: updateData.productType || color.productType || '',
          collection: updateData.collection || color.collection || '',
          updatedAt: new Date().toISOString(),
        }));
      }
    }

    // 5️⃣ Execute update shoesDetail
    const updatedDetail = await this.shoeDetailModel
      .findOneAndUpdate(
        { productId },
        { $set: detailUpdateData },
        { new: true },
      )
      .exec();

    if (!updatedDetail) {
      throw new NotFoundException(
        `Shoe detail with productId "${productId}" not found`,
      );
    }

    return {
      detail: updatedDetail,
      message: '✅ Updated successfully',
    };
  }

  async deleteShoe(productId: string) {
    const result = await this.shoeModel.deleteOne({ productId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Shoe with productId "${productId}" not found`,
      );
    }
    return { message: 'Deleted successfully' };
  }

  async deleteByProductId(productId: string) {
    const resultShoe = await this.shoeModel.deleteOne({ productId }).exec();
    const resultDetail = await this.shoeDetailModel
      .deleteOne({ productId })
      .exec();
    return {
      message: `Deleted ${resultShoe.deletedCount} shoe and ${resultDetail.deletedCount} detail`,
    };
  }

  // ==================== SOFT DELETE - SET STOCK TO ZERO ====================

  // ==================== SOFT DELETE - SET STOCK TO ZERO ====================

  async softDeleteProduct(productId: string) {
    // 1️⃣ Lấy chi tiết sản phẩm hiện tại
    const detail = await this.shoeDetailModel.findOne({ productId }).exec();

    if (!detail) {
      throw new NotFoundException(
        `Product with productId "${productId}" not found`,
      );
    }

    // 2️⃣ Set tất cả stock về 0 cho TẤT CẢ màu và TẤT CẢ sizes
    const updatedColors = detail.colors.map((color) => ({
      colorName: color.colorName || '',
      hex: color.hex || '',
      thumbnail: color.thumbnail || '',
      images: color.images || [],
      sizes: (color.sizes || []).map((size) => ({
        size: size.size || '',
        stock: 0, // ⭐ SET STOCK = 0
      })),
      styleCode: color.styleCode || '',
      category: color.category || '',
      productType: color.productType || '',
      collection: color.collection || '',
      createdAt: color.createdAt || new Date().toISOString(),
      description: color.description || '',
      materialNote: color.materialNote || '',
      origin: color.origin || '',
      rating: color.rating || 0,
      reviewCount: color.reviewCount || 0,
      updatedAt: new Date().toISOString(),
      price: color.price || 0,
    }));

    // 3️⃣ Update shoesDetail với colors đã set stock = 0
    const updatedDetail = await this.shoeDetailModel
      .findOneAndUpdate(
        { productId },
        { $set: { colors: updatedColors } },
        { new: true },
      )
      .exec();

    if (!updatedDetail) {
      throw new NotFoundException(
        `Failed to update product with productId "${productId}"`,
      );
    }

    // 4️⃣ Tính tổng số sizes đã set về 0
    const totalSizes = updatedColors.reduce(
      (sum, color) => sum + (color.sizes?.length || 0),
      0,
    );

    return {
      success: true,
      message: '🗑️ Product soft deleted (all stock set to 0)',
      productId: productId,
      affectedColors: updatedColors.length,
      affectedSizes: totalSizes,
    };
  }

  // ✅ Check stock cho 1 item
async checkStock(productId: string, colorName: string, size: string) {
  const detail = await this.shoeDetailModel.findOne({ productId }).exec();
  
  if (!detail) {
    return {
      success: false,
      message: 'Product not found',
      stock: 0
    };
  }

  const color = detail.colors.find(c => c.colorName === colorName);
  if (!color) {
    return {
      success: false,
      message: 'Color not found',
      stock: 0
    };
  }

  const sizeObj = color.sizes.find(s => s.size === size);
  if (!sizeObj) {
    return {
      success: false,
      message: 'Size not found',
      stock: 0
    };
  }

  return {
    success: true,
    productId,
    colorName,
    size,
    stock: sizeObj.stock || 0,
    available: (sizeObj.stock || 0) > 0
  };
}

// ✅ Check stock cho nhiều items
async checkStockBatch(items: Array<{
  productId: string;
  colorName: string;
  size: string;
  quantity: number;
}>) {
  const results = await Promise.all(
    items.map(async (item) => {
      const stockInfo = await this.checkStock(
        item.productId,
        item.colorName,
        item.size
      );
      
      return {
        ...item,
        availableStock: stockInfo.stock,
        isAvailable: stockInfo.stock >= item.quantity,
        stockShortage: Math.max(0, item.quantity - stockInfo.stock)
      };
    })
  );

  const allAvailable = results.every(r => r.isAvailable);
  const outOfStockItems = results.filter(r => !r.isAvailable);

  return {
    success: allAvailable,
    items: results,
    outOfStockItems,
    message: allAvailable 
      ? 'All items available' 
      : `${outOfStockItems.length} item(s) out of stock`
  };
}

// shoes.service.ts (ĐÃ CÓ - CHỈ CẦN KIỂM TRA LẠI)

async getDashboardStats() {
  // 1. Tổng số sản phẩm
  const totalProducts = await this.shoeModel.countDocuments().exec();

  // 2. Tổng số orders
  const totalOrders = await this.billModel.countDocuments().exec();

  // 3. Số orders PAID
  const paidOrders = await this.billModel.countDocuments({ status: 'PAID' }).exec();

  // 4. Tổng doanh thu
  const revenueData = await this.billModel.aggregate([
    { $match: { status: 'PAID' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).exec();
  const totalRevenue = revenueData[0]?.total || 0;

  // 5. Tổng stock
  const allDetails = await this.shoeDetailModel.find().lean().exec();
  let totalStock = 0;
  allDetails.forEach(detail => {
    detail.colors?.forEach(color => {
      color.sizes?.forEach(size => {
        totalStock += Number(size.stock) || 0;
      });
    });
  });

  // 6. Recent orders với đầy đủ customer info
  const recentOrders = await this.billModel
    .find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
    .exec();

  // ✅ Map để trả về đầy đủ customer info
  const formattedOrders = recentOrders.map(bill => ({
    orderCode: bill.orderCode,
    paymentLinkId: bill.paymentLinkId,
    amount: bill.amount,
    subtotal: bill.subtotal || 0,
    deliveryFee: bill.deliveryFee || 0,
    couponCode: bill.couponCode || '',
    discountAmount: bill.discountAmount || 0,
    description: bill.description,
    status: bill.status,
    fulfillmentStatus: bill.fulfillmentStatus || 'AWAITING_PAYMENT',
    carrier: bill.carrier || '',
    trackingCode: bill.trackingCode || '',
    statusHistory: bill.statusHistory || [],
    deliveredAt: bill.deliveredAt,
    items: bill.items,
    
    // ✅ Customer data
    userId: bill.userId,
    customerEmail: bill.customerEmail,
    customerInfo: bill.customerInfo,
    
    transactionData: bill.transactionData,
    createdAt: bill.createdAt,
    paidAt: bill.paidAt,
  }));

  return {
    totalProducts,
    totalStock,
    totalOrders,
    paidOrders,
    totalRevenue,
    recentOrders: formattedOrders
  };
}


}
