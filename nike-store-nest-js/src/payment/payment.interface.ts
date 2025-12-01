// payment.interface.ts
export interface StockCheckResult {
  productId: string;
  colorName: string;
  size: string;
  quantity: number;
  availableStock: number;
  isAvailable: boolean;
  message: string;
}

export interface WebhookResponse {
  received: boolean;
  updated: boolean;
  status?: string;
  reason?: string;
  details?: StockCheckResult[];
  error?: string;
}
