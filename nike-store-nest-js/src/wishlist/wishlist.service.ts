import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShoeDetail, ShoeDetailDocument } from '../shoes/shoe-detail.schema';
import { WishlistItem, WishlistItemDocument } from './wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistItem.name)
    private wishlistModel: Model<WishlistItemDocument>,
    @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
  ) {}

  async getUserWishlist(userId: string) {
    const items = await this.wishlistModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const enrichedItems = await Promise.all(
      items.map(async item => {
        const detail = await this.shoeDetailModel
          .findOne({ productId: item.productId })
          .lean()
          .exec();
        const color =
          detail?.colors?.find(colorItem => colorItem.colorName === item.colorName) ||
          detail?.colors?.[0];
        const sizeStock = color?.sizes?.find(size => size.size === item.size)?.stock ?? 0;
        const hasSelectedSize = !!item.size;

        return {
          ...item,
          colorName: item.colorName || color?.colorName || '',
          productName: detail?.name || '',
          category: detail?.category || '',
          productType: color?.productType || detail?.productType || '',
          styleCode: color?.styleCode || '',
          price: color?.price || detail?.price || 0,
          thumbnail: color?.thumbnail || color?.images?.[0] || '',
          image: color?.images?.[0] || color?.thumbnail || '',
          stock: sizeStock,
          isAvailable: hasSelectedSize
            ? sizeStock > 0
            : !!color?.sizes?.some(size => size.stock > 0),
        };
      }),
    );

    return {
      success: true,
      userId,
      total: enrichedItems.length,
      items: enrichedItems,
    };
  }

  async addItem(body: {
    userId: string;
    productId: string;
    colorName?: string;
    size?: string;
    notifyOnRestock?: boolean;
  }) {
    const detail = await this.shoeDetailModel.findOne({ productId: body.productId }).lean();
    if (!detail) {
      throw new NotFoundException('Product not found');
    }

    const item = await this.wishlistModel.findOneAndUpdate(
      {
        userId: body.userId,
        productId: body.productId,
        colorName: body.colorName || '',
        size: body.size || '',
      },
      {
        $set: {
          notifyOnRestock: !!body.notifyOnRestock,
        },
        $setOnInsert: {
          userId: body.userId,
          productId: body.productId,
          colorName: body.colorName || '',
          size: body.size || '',
        },
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      item,
    };
  }

  async removeItem(id: string) {
    const result = await this.wishlistModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Wishlist item not found');
    }

    return {
      success: true,
      deletedId: id,
    };
  }

  async removeByProduct(userId: string, productId: string) {
    await this.wishlistModel.deleteMany({ userId, productId }).exec();

    return {
      success: true,
      userId,
      productId,
    };
  }
}
