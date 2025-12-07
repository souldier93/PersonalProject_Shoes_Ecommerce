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
import { StockCheckResult, WebhookResponse } from './payment.interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel('Bill') private billModel: Model<Bill>,
    @InjectModel('ShoeDetail') private shoeDetailModel: Model<ShoeDetail>,
  ) {}

  // ✅ CREATE PAYMENT - Hỗ trợ cả guest và logged-in user
  async createPayment(body: CreatePaymentDto): Promise<any> {
    // ✅ Validation
    if (!body.items || body.items.length === 0) {
      throw new Error('❌ Items are required! Cannot create payment without items.');
    }

    if (!body.customerEmail) {
      throw new Error('❌ Customer email is required!');
    }

    if (!body.customerInfo) {
      throw new Error('❌ Customer info is required!');
    }

    const isGuest = !body.userId;
    console.log('📦 Creating payment for:', isGuest ? 'GUEST' : `USER ${body.userId}`);
    console.log('📧 Email:', body.customerEmail);
    console.log('📦 Items:', JSON.stringify(body.items, null, 2));

    // ✅ Call PayOS API
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

    // ✅ Tạo Bill document với user info
    const bill = await this.billModel.create({
      orderId: body.orderId,
      orderCode: paymentData.orderCode,
      paymentLinkId: paymentData.paymentLinkId,
      amount: paymentData.amount,
      description: paymentData.description,
      
      // ✅ User & Customer data
      userId: body.userId || null,           // null = guest
      customerEmail: body.customerEmail,
      customerInfo: body.customerInfo,
      
      items: body.items,
      status: 'PENDING',
      createdAt: new Date(),
    });

    console.log('✅ Bill created:', bill._id);
    console.log('👤 Customer type:', isGuest ? 'Guest' : 'Registered User');

    return response.data;
  }

  // ✅ WEBHOOK HANDLER - Xử lý thanh toán và trừ stock
  async handleWebhook(body: PayosWebhookBodyPayload): Promise<WebhookResponse> {
    console.log('🔔 Webhook received:', body);

    const { orderCode, paymentLinkId, ...transactionData } = body.data;

    try {
      // ✅ Tìm Bill trong MongoDB
      const bill = await this.billModel.findOne({ orderCode });

      if (!bill) {
        console.warn('⚠️ Bill not found for orderCode:', orderCode);
        return { received: true, updated: false };
      }

      console.log('📦 Bill found:', bill._id);
      console.log('👤 Customer:', bill.userId ? `User ${bill.userId}` : 'Guest');
      console.log('📧 Email:', bill.customerEmail);

      // ✅ Kiểm tra items
      if (!bill.items || bill.items.length === 0) {
        console.error('❌ Bill has no items!');
        bill.status = 'FAILED';
        bill.paidAt = new Date();
        bill.transactionData = {
          ...transactionData,
          failureReason: 'NO_ITEMS',
        };
        await bill.save();
        return { received: true, updated: true, status: 'FAILED', reason: 'No items in bill' };
      }

      // ✅ Check stock cho tất cả items
      console.log('🔍 Checking stock for all items...');
      const stockCheckResults: StockCheckResult[] = [];

      for (const item of bill.items) {
        const stockInfo = await this.checkStockBeforeDecrease(
          item.productId,
          item.colorName,
          item.size,
          item.quantity
        );
        stockCheckResults.push(stockInfo);
      }

      console.log('📊 Stock check results:', stockCheckResults);

      // ✅ Nếu thiếu stock → FAILED
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

        console.error('❌ Payment failed - insufficient stock');
        return {
          received: true,
          updated: true,
          status: 'FAILED',
          reason: 'Insufficient stock',
          details: stockCheckResults.filter(r => !r.isAvailable)
        };
      }

      // ✅ Trừ stock
      console.log('✅ Stock sufficient. Decreasing stock...');
      for (const item of bill.items) {
        await this.decreaseStock(
          item.productId,
          item.colorName,
          item.size,
          item.quantity
        );
      }

      // ✅ Update Bill → PAID
      bill.status = 'PAID';
      bill.paidAt = new Date();
      bill.transactionData = transactionData;
      await bill.save();

      console.log('✅ Payment successful!');
      console.log('✅ Bill updated:', bill._id);
      console.log('👤 Order by:', bill.userId ? 'Registered User' : 'Guest');

      return { received: true, updated: true, status: 'PAID' };

    } catch (error) {
      console.error('❌ Error in webhook:', error);

      try {
        const bill = await this.billModel.findOne({ orderCode });
        if (bill && bill.status === 'PENDING') {
          bill.status = 'FAILED';
          bill.paidAt = new Date();
          bill.transactionData = {
            ...transactionData,
            failureReason: 'WEBHOOK_ERROR',
            errorMessage: error.message,
          };
          await bill.save();
        }
      } catch (updateError) {
        console.error('❌ Failed to update bill:', updateError);
      }

      return { received: true, updated: false, error: error.message };
    }
  }

  // ✅ Check stock trước khi trừ
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
      return {
        productId,
        colorName,
        size,
        quantity,
        availableStock: 0,
        isAvailable: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // ✅ Trừ stock
  private async decreaseStock(
    productId: string,
    colorName: string,
    size: string,
    quantity: number
  ) {
    console.log(`🔻 Decreasing stock: ${productId} - ${colorName} - ${size} - ${quantity}`);

    const shoeDetail = await this.shoeDetailModel.findOne({ productId });
    if (!shoeDetail) throw new Error(`Product ${productId} not found`);

    const color = shoeDetail.colors.find(c => c.colorName === colorName);
    if (!color) throw new Error(`Color ${colorName} not found`);

    const sizeObj = color.sizes.find(s => s.size === size);
    if (!sizeObj) throw new Error(`Size ${size} not found`);

    const currentStock = sizeObj.stock || 0;
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock: Available ${currentStock}, Requested ${quantity}`);
    }

    sizeObj.stock = currentStock - quantity;
    await shoeDetail.save();

    console.log(`✅ Stock updated: ${productId} - ${colorName} - ${size} → ${sizeObj.stock}`);
  }

  // ✅ Check payment status by paymentLinkId
  async checkPaymentStatus(paymentLinkId: string) {
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
      customerEmail: bill.customerEmail,
      isGuest: !bill.userId,
      paidAt: bill.paidAt,
      transactionData: bill.transactionData
    };
  }

  // ✅ Check payment by orderCode
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
      customerEmail: bill.customerEmail,
      customerInfo: bill.customerInfo,
      isGuest: !bill.userId,
      userId: bill.userId,
      paidAt: bill.paidAt,
      transactionData: bill.transactionData
    };
  }

  // ✅ Get user orders (for logged-in users)
  async getUserOrders(userId: string) {
    return this.billModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ Get guest orders (by email)
  async getGuestOrders(email: string) {
    return this.billModel
      .find({ 
        userId: null, 
        customerEmail: email 
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
