import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShoeDetail, ShoeDetailDocument } from '../shoes/shoe-detail.schema';
import { StockMovement, StockMovementDocument } from './stock-movement.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
  ) {}

  async getOverview() {
    const details = await this.shoeDetailModel.find().lean().exec();
    const variants = details.flatMap(product =>
      (product.colors || []).flatMap(color =>
        (color.sizes || []).map(size => ({
          productId: product.productId,
          productName: product.name,
          category: product.category,
          colorName: color.colorName,
          size: size.size,
          stock: Number(size.stock || 0),
          thumbnail: color.thumbnail || color.images?.[0] || '',
        })),
      ),
    );

    const movements = await this.movementModel
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return {
      success: true,
      totalVariants: variants.length,
      totalStock: variants.reduce((sum, item) => sum + item.stock, 0),
      lowStock: variants.filter(item => item.stock > 0 && item.stock <= 5),
      outOfStock: variants.filter(item => item.stock === 0),
      variants,
      movements,
    };
  }

  async adjustStock(body: {
    productId: string;
    colorName: string;
    size: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    note?: string;
    createdBy?: string;
  }) {
    const detail = await this.shoeDetailModel.findOne({ productId: body.productId }).exec();
    if (!detail) {
      throw new NotFoundException('Product not found');
    }

    const color = detail.colors.find(item => item.colorName === body.colorName);
    if (!color) {
      throw new NotFoundException('Color not found');
    }

    const sizeObj = color.sizes.find(item => item.size === body.size);
    if (!sizeObj) {
      throw new NotFoundException('Size not found');
    }

    const beforeStock = Number(sizeObj.stock || 0);
    const quantity = Number(body.quantity || 0);
    if (quantity < 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    let afterStock = beforeStock;
    if (body.type === 'IN') afterStock = beforeStock + quantity;
    if (body.type === 'OUT') afterStock = beforeStock - quantity;
    if (body.type === 'ADJUST') afterStock = quantity;

    if (afterStock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    sizeObj.stock = afterStock;
    await detail.save();

    const movement = await this.movementModel.create({
      productId: detail.productId,
      productName: detail.name,
      colorName: color.colorName,
      size: sizeObj.size,
      type: body.type,
      quantity,
      beforeStock,
      afterStock,
      note: body.note || '',
      createdBy: body.createdBy || '',
    });

    return {
      success: true,
      movement,
      stock: afterStock,
    };
  }
}
