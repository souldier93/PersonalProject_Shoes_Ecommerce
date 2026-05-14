import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReturnRequestDocument = ReturnRequest & Document;

@Schema({ collection: 'returnRequests', timestamps: true })
export class ReturnRequest {
  @Prop({ required: true, index: true })
  orderCode: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null, index: true })
  userId: MongooseSchema.Types.ObjectId | null;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  colorName: string;

  @Prop({ required: true })
  size: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ enum: ['RETURN', 'EXCHANGE', 'REFUND'], required: true })
  type: 'RETURN' | 'EXCHANGE' | 'REFUND';

  @Prop({ required: true })
  reason: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'],
    default: 'REQUESTED',
    index: true,
  })
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED' | 'EXCHANGED';

  @Prop({ default: '' })
  adminNote: string;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
