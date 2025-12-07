// dto/CreatePaymentDto.ts

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

// ✅ Interface cho Item trong giỏ hàng
export interface PaymentItem {
  productId: string;
  name: string;
  colorName: string;
  size: string;
  quantity: number;
  price: number;
}

// ✅ Interface cho thông tin khách hàng
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
}

// ✅ DTO tạo payment - hỗ trợ cả guest và logged-in user
export interface CreatePaymentDto {
  orderId: string;
  description: string;
  amount: number;
  items: PaymentItem[];           // ✅ Danh sách sản phẩm
  userId?: string;                 // ✅ null nếu guest checkout
  customerEmail: string;           // ✅ Email khách hàng (bắt buộc)
  customerInfo: CustomerInfo;      // ✅ Thông tin giao hàng
}

// ✅ Interface cho Payment record
export interface Payment {
  id: string;
  orderId: string;
  userId: string | null;           // ✅ null cho guest
  customerEmail: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  paymentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
