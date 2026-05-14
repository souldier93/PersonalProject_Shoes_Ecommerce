import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async findAll() {
    const coupons = await this.couponModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      success: true,
      coupons,
    };
  }

  async create(body: Partial<Coupon>) {
    const coupon = await this.couponModel.create({
      code: body.code?.toUpperCase(),
      type: body.type,
      value: Number(body.value || 0),
      minOrder: Number(body.minOrder || 0),
      maxDiscount: Number(body.maxDiscount || 0),
      usageLimit: Number(body.usageLimit || 0),
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      active: body.active ?? true,
    });

    return {
      success: true,
      coupon,
    };
  }

  async update(id: string, body: Partial<Coupon>) {
    const updateData: any = { ...body };
    if (body.code) updateData.code = body.code.toUpperCase();
    if (body.startsAt) updateData.startsAt = new Date(body.startsAt);
    if (body.endsAt) updateData.endsAt = new Date(body.endsAt);

    const coupon = await this.couponModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      success: true,
      coupon,
    };
  }

  async validate(code: string, orderAmount: number) {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase() })
      .lean()
      .exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();
    if (!coupon.active) {
      throw new BadRequestException('Coupon is not active');
    }
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new BadRequestException('Coupon has not started yet');
    }
    if (coupon.endsAt && new Date(coupon.endsAt) < now) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (orderAmount < coupon.minOrder) {
      throw new BadRequestException(`Minimum order is ${coupon.minOrder}`);
    }

    let discountAmount =
      coupon.type === 'PERCENT'
        ? Math.floor((orderAmount * coupon.value) / 100)
        : coupon.value;

    if (coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }

    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      success: true,
      coupon,
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
    };
  }

  async incrementUsage(code: string) {
    await this.couponModel.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
    );
  }
}
