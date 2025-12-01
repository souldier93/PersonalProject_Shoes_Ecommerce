// bill.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Bill extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, unique: true })
  orderCode: number;

  @Prop({ required: true })
  paymentLinkId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  // ✅ Thêm field items để lưu chi tiết đơn hàng
  @Prop({
    type: [{
      productId: String,
      name: String,
      colorName: String,
      size: String,
      quantity: Number,
      price: Number,
    }],
    required: true,
  })
  items: {
    productId: string;
    name: string;
    colorName: string;
    size: string;
    quantity: number;
    price: number;
  }[];

  @Prop({ required: true, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' })
  status: string;

  @Prop({ type: Object })
  transactionData?: Record<string, any>;

  @Prop()
  paidAt?: Date;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
