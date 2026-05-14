import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ collection: 'reviews', timestamps: true })
export class Review {
  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  orderCode: number;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  colorName: string;

  @Prop({ required: true })
  size: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  comment: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ['approved', 'hidden'], default: 'approved', index: true })
  status: 'approved' | 'hidden';
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index(
  { productId: 1, orderCode: 1, userId: 1, colorName: 1, size: 1 },
  { unique: true },
);
