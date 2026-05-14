import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WishlistItemDocument = WishlistItem & Document;

@Schema({ collection: 'wishlist', timestamps: true })
export class WishlistItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ default: '' })
  colorName: string;

  @Prop({ default: '' })
  size: string;

  @Prop({ default: false })
  notifyOnRestock: boolean;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
WishlistItemSchema.index(
  { userId: 1, productId: 1, colorName: 1, size: 1 },
  { unique: true },
);
