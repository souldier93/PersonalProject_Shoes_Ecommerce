// payment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CreatePaymentDto } from './dto/CreatePaymentDto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PayosRequestPaymentPayload } from './dto/payos-request-payment.payload';
import { generateSignature } from './payos-utils';
import { PayosWebhookBodyPayload } from './dto/payos-webhook-body.payload';
import { Bill } from './bill.schema';
import { ShoeDetail } from '../shoes/shoe-detail.schema';
import { StockCheckResult, WebhookResponse } from './payment.interface'; // ✅ Import interface

const paymentStore = new Map();

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel('Bill') private billModel: Model<Bill>,
    @InjectModel('ShoeDetail') private shoeDetailModel: Model<ShoeDetail>,
  ) {}

  async createPayment(body: CreatePaymentDto): Promise<any> {
    // ✅ Validation items
    if (!body.items || body.items.length === 0) {
      throw new Error('❌ Items are required! Cannot create payment without items.');
    }

    console.log('📦 Creating payment with items:', JSON.stringify(body.items, null, 2));

    const url = `https://api-merchant.payos.vn/v2/payment-requests`;
    const config = {
      headers: {
        'x-client-id': this.configService.getOrThrow('PAYOS_CLIENT_ID'),
        'x-api-key': this.configService.getOrThrow('PAYOS_API_KEY'),
      },
    };

    const dataForSignature = {
      orderCode: Number(body.orderId),
      amount: body.amount,
      description: body.description,
      cancelUrl: 'https://example.com/cancel',
      returnUrl: 'https://example.com/return',
    };

    const signature = generateSignature(
      dataForSignature,
      this.configService.getOrThrow('PAYOS_CHECKSUM_KEY'),
    );

    const payload: PayosRequestPaymentPayload = {
      ...dataForSignature,
      signature,
    };

    const response = await firstValueFrom(
      this.httpService.post(url, payload, config),
    );

    const paymentData = response.data.data;

    // ✅ Tạo Bill document với items
    const bill = await this.billModel.create({
      orderId: body.orderId,
      orderCode: paymentData.orderCode,
      paymentLinkId: paymentData.paymentLinkId,
      amount: paymentData.amount,
      description: paymentData.description,
      items: body.items,
      status: 'PENDING',
      createdAt: new Date(),
    });

    console.log('✅ Bill created in MongoDB:', bill._id);

    // Lưu vào in-memory store
    paymentStore.set(paymentData.orderCode, {
      orderCode: paymentData.orderCode,
      paymentLinkId: paymentData.paymentLinkId,
      amount: paymentData.amount,
      description: paymentData.description,
      items: body.items,
      status: 'PENDING',
      createdAt: new Date(),
    });

    return response.data;
  }

  // ✅ Xử lý webhook: Cập nhật Bill và trừ stock
  async handleWebhook(body: PayosWebhookBodyPayload): Promise<WebhookResponse> {
    console.log('🔔 Webhook received:', body);
    const { orderCode, paymentLinkId, ...transactionData } = body.data;

    try {
      // ✅ Tìm Bill trong MongoDB
      const bill = await this.billModel.findOne({ orderCode });
      
      if (!bill) {
        console.warn('⚠️ Bill not found in MongoDB for orderCode:', orderCode);
        return { received: true, updated: false };
      }

      console.log('📦 Bill found:', bill._id);
      console.log('📦 Bill items:', JSON.stringify(bill.items, null, 2));

      // ✅ Kiểm tra items có tồn tại không
      if (!bill.items || bill.items.length === 0) {
        console.error('❌ Bill has no items!');
        bill.status = 'FAILED';
        bill.paidAt = new Date();
        bill.transactionData = {
          ...transactionData,
          failureReason: 'NO_ITEMS',
          errorMessage: 'Bill has no items'
        };
        await bill.save();
        return { received: true, updated: true, status: 'FAILED', reason: 'No items in bill' };
      }

      // ✅ Kiểm tra stock trước khi trừ
      console.log('🔍 Checking stock for all items...');
      const stockCheckResults: StockCheckResult[] = [];
      
      for (const item of bill.items) {
        console.log('🔄 Checking item:', item);
        const stockInfo = await this.checkStockBeforeDecrease(
          item.productId,
          item.colorName,
          item.size,
          item.quantity
        );
        stockCheckResults.push(stockInfo);
      }

      console.log('📊 Stock check results:', stockCheckResults);

      // ✅ Nếu có item nào thiếu stock → Update bill status = FAILED
      const hasInsufficientStock = stockCheckResults.some(result => !result.isAvailable);
      
      if (hasInsufficientStock) {
        bill.status = 'FAILED';
        bill.paidAt = new Date();
        bill.transactionData = {
          ...transactionData,
          failureReason: 'INSUFFICIENT_STOCK',
          stockCheckResults: stockCheckResults
        };
        await bill.save();

        console.error('❌ Payment failed due to insufficient stock');
        console.error('❌ Failed items:', stockCheckResults.filter(r => !r.isAvailable));

        return { 
          received: true, 
          updated: true, 
          status: 'FAILED',
          reason: 'Insufficient stock',
          details: stockCheckResults.filter(r => !r.isAvailable)
        };
      }

      // ✅ Trừ stock cho từng item trong đơn hàng
      console.log('✅ All items have sufficient stock. Proceeding to decrease...');
      for (const item of bill.items) {
        await this.decreaseStock(
          item.productId,
          item.colorName,
          item.size,
          item.quantity
        );
      }

      // ✅ Cập nhật Bill status thành PAID
      bill.status = 'PAID';
      bill.paidAt = new Date();
      bill.transactionData = transactionData;
      await bill.save();

      console.log('✅ Bill updated to PAID and stock decreased:', bill._id);

      // Cập nhật in-memory store
      const payment = paymentStore.get(orderCode);
      if (payment) {
        payment.status = 'PAID';
        payment.paidAt = new Date();
        payment.webhookData = body.data;
        paymentStore.set(orderCode, payment);
      }

      return { received: true, updated: true, status: 'PAID' };
    } catch (error) {
      console.error('❌ Error in handleWebhook:', error);
      console.error('❌ Error stack:', error.stack);
      
      // ✅ Cập nhật Bill status = FAILED nếu có lỗi
      try {
        const bill = await this.billModel.findOne({ orderCode });
        if (bill && bill.status === 'PENDING') {
          bill.status = 'FAILED';
          bill.paidAt = new Date();
          bill.transactionData = {
            ...transactionData,
            failureReason: 'WEBHOOK_ERROR',
            errorMessage: error.message,
            errorStack: error.stack
          };
          await bill.save();
          console.log('⚠️ Bill marked as FAILED due to webhook error');
        }
      } catch (updateError) {
        console.error('❌ Failed to update bill status:', updateError);
      }

      return { 
        received: true, 
        updated: false,
        error: error.message 
      };
    }
  }

  // ✅ Helper method để check stock trước khi trừ
  private async checkStockBeforeDecrease(
    productId: string,
    colorName: string,
    size: string,
    quantity: number
  ): Promise<StockCheckResult> {
    try {
      const shoeDetail = await this.shoeDetailModel.findOne({ productId });

      if (!shoeDetail) {
        return {
          productId,
          colorName,
          size,
          quantity,
          availableStock: 0,
          isAvailable: false,
          message: 'Product not found'
        };
      }

      const color = shoeDetail.colors.find(c => c.colorName === colorName);
      if (!color) {
        return {
          productId,
          colorName,
          size,
          quantity,
          availableStock: 0,
          isAvailable: false,
          message: `Color "${colorName}" not found`
        };
      }

      const sizeObj = color.sizes.find(s => s.size === size);
      if (!sizeObj) {
        return {
          productId,
          colorName,
          size,
          quantity,
          availableStock: 0,
          isAvailable: false,
          message: `Size "${size}" not found`
        };
      }

      const currentStock = sizeObj.stock || 0;
      const isAvailable = currentStock >= quantity;

      return {
        productId,
        colorName,
        size,
        quantity,
        availableStock: currentStock,
        isAvailable,
        message: isAvailable 
          ? 'Stock available' 
          : `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
      };
    } catch (error) {
      console.error(`❌ Error checking stock for ${productId}:`, error);
      return {
        productId,
        colorName,
        size,
        quantity,
        availableStock: 0,
        isAvailable: false,
        message: `Error checking stock: ${error.message}`
      };
    }
  }

  // ✅ Method để trừ stock
  private async decreaseStock(
    productId: string,
    colorName: string,
    size: string,
    quantity: number
  ) {
    console.log(`🔻 Decreasing stock: ${productId} - ${colorName} - ${size} - ${quantity}`);

    const shoeDetail = await this.shoeDetailModel.findOne({ productId });

    if (!shoeDetail) {
      throw new Error(`Product ${productId} not found`);
    }

    // Tìm màu
    const color = shoeDetail.colors.find(c => c.colorName === colorName);
    if (!color) {
      throw new Error(`Color ${colorName} not found for product ${productId}`);
    }

    // Tìm size
    const sizeObj = color.sizes.find(s => s.size === size);
    if (!sizeObj) {
      throw new Error(`Size ${size} not found for color ${colorName} of product ${productId}`);
    }

    // ✅ Trừ stock
    const currentStock = sizeObj.stock || 0;
    if (currentStock < quantity) {
      throw new Error(
        `Insufficient stock for ${productId} - ${colorName} - ${size}. Available: ${currentStock}, Requested: ${quantity}`
      );
    }

    sizeObj.stock = currentStock - quantity;

    // ✅ Lưu lại vào MongoDB
    await shoeDetail.save();

    console.log(`✅ Stock updated: ${productId} - ${colorName} - ${size} → ${sizeObj.stock}`);
  }

  // ✅ API check payment status
  async checkPaymentStatus(paymentLinkId: string) {
    console.log('🔍 Checking payment status:', paymentLinkId);
    
    const bill = await this.billModel.findOne({ paymentLinkId });
    
    if (!bill) {
      return {
        success: false,
        message: 'Bill not found',
        status: 'NOT_FOUND'
      };
    }

    return {
      success: true,
      status: bill.status,
      orderCode: bill.orderCode,
      amount: bill.amount,
      items: bill.items,
      paidAt: bill.paidAt,
      transactionData: bill.transactionData
    };
  }

  // ✅ Alternative: Check by orderCode
  async checkPaymentByOrderCode(orderCode: number) {
    const bill = await this.billModel.findOne({ orderCode });
    
    if (!bill) {
      return {
        success: false,
        message: 'Bill not found',
        status: 'NOT_FOUND'
      };
    }

    return {
      success: true,
      status: bill.status,
      orderCode: bill.orderCode,
      paymentLinkId: bill.paymentLinkId,
      amount: bill.amount,
      items: bill.items,
      paidAt: bill.paidAt,
      transactionData: bill.transactionData
    };
  }
}
