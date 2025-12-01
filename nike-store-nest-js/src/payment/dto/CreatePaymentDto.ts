// dto.ts
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

// ✅ Thêm interface cho Item
export interface PaymentItem {
  productId: string;
  name: string;
  colorName: string;
  size: string;
  quantity: number;
  price: number;
}

// ✅ Cập nhật CreatePaymentDto với field items
export interface CreatePaymentDto {
  orderId: string;
  description: string;
  amount: number;
  items: PaymentItem[]; // ✅ Thêm field items
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  paymentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
