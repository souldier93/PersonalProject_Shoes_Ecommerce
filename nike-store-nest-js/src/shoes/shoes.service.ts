import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shoe, ShoeDocument } from './shoes.schema';
import { ShoeDetail, ShoeDetailDocument } from './shoe-detail.schema';
import { Counter, CounterDocument } from './counter.schema';

@Injectable()
export class ShoesService {
  constructor(
    @InjectModel(Shoe.name) private shoeModel: Model<ShoeDocument>,
    @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  // ==================== COLLECTION shoes (LISTING) ====================

  async findAll() {
    const shoes = await this.shoeModel
      .find()
      .select('productId name category price color thumbnail')
      .lean()
      .exec();
    return shoes;
  }

  async findByCategory(category: string) {
    const shoes = await this.shoeModel
      .find({ category })
      .select('productId name category price color thumbnail')
      .lean()
      .exec();
    return shoes;
  }

  async findByProductId(productId: string) {
    const shoe = await this.shoeModel
      .findOne({ productId })
      .select('productId name category price color thumbnail')
      .lean()
      .exec();

    if (!shoe) {
      throw new NotFoundException(`Shoe with productId "${productId}" not found`);
    }

    return shoe;
  }

  // ==================== COLLECTION shoesDetail (DETAIL PAGE) ====================

  async findDetailByProductId(productId: string) {
    const detail = await this.shoeDetailModel.findOne({ productId }).lean().exec();
    if (!detail) {
      throw new NotFoundException(`Shoe detail with productId "${productId}" not found`);
    }
    return detail;
  }

  async findDetailByStyleCode(styleCode: string) {
    const detail = await this.shoeDetailModel.findOne({ 
      'colors.styleCode': styleCode 
    }).lean().exec();
    
    if (!detail) {
      throw new NotFoundException(`Shoe detail with styleCode "${styleCode}" not found`);
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
    const result = await this.shoeDetailModel.aggregate([
      {
        $addFields: {
          productIdNum: { $toInt: '$productId' }
        }
      },
      {
        $group: {
          _id: null,
          maxId: { $max: '$productIdNum' }
        }
      }
    ]).exec();

    const maxId = result[0]?.maxId || 0;
    return (maxId + 1).toString();
  }

  // ==================== THÃŠM Sáº¢N PHáº¨M Má»šI (NHIá»€U MÃ€U) ====================

  async createProduct(productData: {
    name: string;
    category: string;
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
      price: productData.colors[0]?.price || 0,
      
      // Array colors: Má»–I MÃ€U CÃ“ Äáº¦Y Äá»¦ Táº¤T Cáº¢ THÃ”NG TIN
      colors: productData.colors.map(color => ({
        colorName: color.colorName,
        hex: color.hex || '',
        thumbnail: color.thumbnail,
        images: color.images || [],
        sizes: color.sizes || [],
        styleCode: color.styleCode || '',
        category: productData.category,
        createdAt: now,
        description: color.description || '',
        materialNote: color.materialNote || '',
        origin: color.origin || '',
        rating: 0,
        reviewCount: 0,
        updatedAt: now,
        price: color.price
      }))
    };

    // 3. LÆ°u vÃ o collection shoesDetail (1 document cho cáº£ sáº£n pháº©m)
    const shoeDetail = new this.shoeDetailModel(shoeDetailData);
    await shoeDetail.save();

    // 4. LÆ°u vÃ o collection shoes (CHá»ˆ 1 DOCUMENT cho listing - láº¥y mÃ u Ä‘áº§u tiÃªn)
    const shoeData = {
      productId,
      name: productData.name,
      category: productData.category,
      price: productData.colors[0]?.price || 0,
      color: productData.colors[0]?.colorName || '',
      thumbnail: productData.colors[0]?.thumbnail || ''
    };

    const shoe = new this.shoeModel(shoeData);
    await shoe.save();

    return {
      productId,
      shoeDetail,
      shoe,
      message: `Created product with productId ${productId} and ${productData.colors.length} colors successfully`
    };
  }

 // ==================== UPDATE & DELETE ====================

async updateShoe(productId: string, updateData: any) {
  // 1️⃣ Update bảng shoes (listing) - CHỈ update những field user explicitly thay đổi
  const shoeUpdateData: any = {};
  
  if (updateData.name) shoeUpdateData.name = updateData.name;
  if (updateData.category) shoeUpdateData.category = updateData.category;
  
  // ⭐ CHỈ update shoes.thumbnail khi có field thumbnail EXPLICIT (từ tab Basic Info)
  // KHÔNG update khi chỉ có colors[] array
  if (updateData.thumbnail !== undefined) {
    shoeUpdateData.thumbnail = updateData.thumbnail;
  }

  // Nếu có dữ liệu cần update trong shoes table
  if (Object.keys(shoeUpdateData).length > 0) {
    const updatedShoe = await this.shoeModel
      .findOneAndUpdate({ productId }, { $set: shoeUpdateData }, { new: true })
      .exec();

    if (!updatedShoe) {
      throw new NotFoundException(`Shoe with productId "${productId}" not found`);
    }
  }

  // 2️⃣ Update bảng shoesDetail
  const detailUpdateData: any = {};
  
  if (updateData.name) detailUpdateData.name = updateData.name;
  if (updateData.category) detailUpdateData.category = updateData.category;

  // 3️⃣ Nếu có colors[] → REPLACE TOÀN BỘ colors array (bao gồm thumbnail của từng màu)
  if (updateData.colors && Array.isArray(updateData.colors)) {
    detailUpdateData.colors = updateData.colors.map(color => ({
      colorName: color.colorName || '',
      hex: color.hex || '',
      thumbnail: color.thumbnail || '', // ⭐ Thumbnail từng màu - CHỈ update trong shoesDetail
      images: Array.isArray(color.images) ? color.images : [],
      sizes: Array.isArray(color.sizes) ? color.sizes : [],
      styleCode: color.styleCode || '',
      category: color.category || updateData.category || 'men',
      createdAt: color.createdAt || new Date().toISOString(),
      description: color.description || '',
      materialNote: color.materialNote || '',
      origin: color.origin || '',
      rating: Number(color.rating) || 0,
      reviewCount: Number(color.reviewCount) || 0,
      updatedAt: new Date().toISOString(),
      price: Number(color.price) || 0
    }));
  }
  // 4️⃣ Nếu KHÔNG có colors nhưng có category → sync category cho colors hiện có
  else if (!updateData.colors && updateData.category) {
    const existingDetail = await this.shoeDetailModel.findOne({ productId }).exec();
    if (existingDetail && existingDetail.colors) {
      detailUpdateData.colors = existingDetail.colors.map(color => ({
        ...color,
        category: updateData.category,
        updatedAt: new Date().toISOString()
      }));
    }
  }

  // 5️⃣ Execute update shoesDetail
  const updatedDetail = await this.shoeDetailModel
    .findOneAndUpdate(
      { productId }, 
      { $set: detailUpdateData }, 
      { new: true }
    )
    .exec();

  if (!updatedDetail) {
    throw new NotFoundException(`Shoe detail with productId "${productId}" not found`);
  }

  return {
    detail: updatedDetail,
    message: '✅ Updated successfully'
  };
}

async deleteShoe(productId: string) {
  const result = await this.shoeModel.deleteOne({ productId }).exec();
  if (result.deletedCount === 0) {
    throw new NotFoundException(`Shoe with productId "${productId}" not found`);
  }
  return { message: 'Deleted successfully' };
}

async deleteByProductId(productId: string) {
  const resultShoe = await this.shoeModel.deleteOne({ productId }).exec();
  const resultDetail = await this.shoeDetailModel.deleteOne({ productId }).exec();
  return {
    message: `Deleted ${resultShoe.deletedCount} shoe and ${resultDetail.deletedCount} detail`
  };
}

// ==================== SOFT DELETE - SET STOCK TO ZERO ====================

// ==================== SOFT DELETE - SET STOCK TO ZERO ====================

async softDeleteProduct(productId: string) {
  // 1️⃣ Lấy chi tiết sản phẩm hiện tại
  const detail = await this.shoeDetailModel.findOne({ productId }).exec();
  
  if (!detail) {
    throw new NotFoundException(`Product with productId "${productId}" not found`);
  }

  // 2️⃣ Set tất cả stock về 0 cho TẤT CẢ màu và TẤT CẢ sizes
  const updatedColors = detail.colors.map(color => ({
    colorName: color.colorName || '',
    hex: color.hex || '',
    thumbnail: color.thumbnail || '',
    images: color.images || [],
    sizes: (color.sizes || []).map(size => ({
      size: size.size || '',
      stock: 0  // ⭐ SET STOCK = 0
    })),
    styleCode: color.styleCode || '',
    category: color.category || '',
    createdAt: color.createdAt || new Date().toISOString(),
    description: color.description || '',
    materialNote: color.materialNote || '',
    origin: color.origin || '',
    rating: color.rating || 0,
    reviewCount: color.reviewCount || 0,
    updatedAt: new Date().toISOString(),
    price: color.price || 0
  }));

  // 3️⃣ Update shoesDetail với colors đã set stock = 0
  const updatedDetail = await this.shoeDetailModel
    .findOneAndUpdate(
      { productId },
      { $set: { colors: updatedColors } },
      { new: true }
    )
    .exec();

  if (!updatedDetail) {
    throw new NotFoundException(`Failed to update product with productId "${productId}"`);
  }

  // 4️⃣ Tính tổng số sizes đã set về 0
  const totalSizes = updatedColors.reduce((sum, color) => 
    sum + (color.sizes?.length || 0), 0
  );

  return {
    success: true,
    message: '🗑️ Product soft deleted (all stock set to 0)',
    productId: productId,
    affectedColors: updatedColors.length,
    affectedSizes: totalSizes
  };
}




}