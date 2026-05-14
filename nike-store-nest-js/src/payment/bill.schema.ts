// schemas/bill.schema.ts

import { Schema, Document } from 'mongoose';

export interface BillDocument extends Document {
  orderId: string;
  orderCode: number;
  paymentLinkId: string;
  amount: number;
  subtotal?: number;
  deliveryFee?: number;
  couponCode?: string;
  discountAmount?: number;
  description: string;
  
  // ✅ User & Customer Info
  userId: Schema.Types.ObjectId | null;  // null = guest checkout
  customerEmail: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
  };
  
  // ✅ Items
  items: {
    productId: string;
    name: string;
    colorName: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  
  // ✅ Payment Status
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  fulfillmentStatus:
    | 'AWAITING_PAYMENT'
    | 'CONFIRMED'
    | 'PACKING'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'RETURN_REQUESTED'
    | 'REFUNDED'
    | 'CANCELLED';
  carrier?: string;
  trackingCode?: string;
  statusHistory: {
    status: string;
    note?: string;
    changedAt: Date;
  }[];
  transactionData?: any;
  
  // ✅ Timestamps
  createdAt: Date;
  paidAt?: Date;
  deliveredAt?: Date;
}

export const BillSchema = new Schema<BillDocument>({
  orderId: { type: String, required: true },
  orderCode: { type: Number, required: true, unique: true },
  paymentLinkId: { type: String, required: true },
  amount: { type: Number, required: true },
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  description: { type: String },
  
  // ✅ User identification
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null  // null for guest checkout
  },
  customerEmail: { type: String, required: true, index: true },
  
  // ✅ Customer delivery info
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    addressLine1: String,
    addressLine2: String,
    city: String,
    postalCode: String,
  },
  
  // ✅ Order items
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  
  // ✅ Payment status
  status: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  
  fulfillmentStatus: {
    type: String,
    enum: [
      'AWAITING_PAYMENT',
      'CONFIRMED',
      'PACKING',
      'SHIPPING',
      'DELIVERED',
      'RETURN_REQUESTED',
      'REFUNDED',
      'CANCELLED',
    ],
    default: 'AWAITING_PAYMENT',
    index: true,
  },
  carrier: String,
  trackingCode: String,
  statusHistory: [{
    status: { type: String, required: true },
    note: String,
    changedAt: { type: Date, default: Date.now },
  }],

  transactionData: { type: Schema.Types.Mixed },
  
  // ✅ Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
});

// ✅ Index for querying user orders
BillSchema.index({ userId: 1, createdAt: -1 });
BillSchema.index({ customerEmail: 1, createdAt: -1 });

export interface Bill extends BillDocument {}
