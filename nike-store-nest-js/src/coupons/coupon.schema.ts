import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ collection: 'coupons', timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ enum: ['PERCENT', 'FIXED'], required: true })
  type: 'PERCENT' | 'FIXED';

  @Prop({ type: Number, required: true })
  value: number;

  @Prop({ type: Number, default: 0 })
  minOrder: number;

  @Prop({ type: Number, default: 0 })
  maxDiscount: number;

  @Prop({ type: Number, default: 0 })
  usageLimit: number;

  @Prop({ type: Number, default: 0 })
  usedCount: number;

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  endsAt?: Date;

  @Prop({ default: true })
  active: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
