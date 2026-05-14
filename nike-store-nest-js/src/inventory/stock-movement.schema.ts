import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

@Schema({ collection: 'stockMovements', timestamps: true })
export class StockMovement {
  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  colorName: string;

  @Prop({ required: true })
  size: string;

  @Prop({ enum: ['IN', 'OUT', 'ADJUST'], required: true })
  type: 'IN' | 'OUT' | 'ADJUST';

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  beforeStock: number;

  @Prop({ type: Number, required: true })
  afterStock: number;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: '' })
  createdBy: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
