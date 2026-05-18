// payment.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { CouponsService } from '../coupons/coupons.service';
import Stripe from 'stripe';
import { OrderEmailService } from './order-email.service';

type StripeClient = InstanceType<typeof Stripe>;
type StripePaymentIntent = Awaited<
  ReturnType<StripeClient['paymentIntents']['retrieve']>
>;

@Injectable()
export class PaymentService {
  private stripeClient?: StripeClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly couponsService: CouponsService,
    private readonly orderEmailService: OrderEmailService,
    @InjectModel('Bill') private billModel: Model<Bill>,
    @InjectModel('ShoeDetail') private shoeDetailModel: Model<ShoeDetail>,
  ) {}

  private getStripeClient() {
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(
        this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      );
    }

    return this.stripeClient;
  }

  private normalizeUserId(userId?: string | null) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return null;
    }

    return new Types.ObjectId(userId);
  }

  private normalizeEmail(email?: string | null) {
    return String(email || '').trim().toLowerCase();
  }

  private assertValidEmail(email: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email');
    }
  }

  private assertValidOrderCode(orderCode: number) {
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      throw new BadRequestException('Invalid order code');
    }
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildPaymentDescription(orderCode: number) {
    return `PTT ${orderCode}`.slice(0, 25);
  }

  private sanitizeNote(value?: string) {
    return String(value || '').trim().slice(0, 300);
  }

  private isCancellationEligible(order: Bill) {
    return (
      order.status === 'PAID' &&
      ['CONFIRMED', 'PACKING'].includes(order.fulfillmentStatus || '')
    );
  }

  private assertCancellationOwner(
    order: Bill,
    body: { userId?: string; email?: string },
  ) {
    const orderUserId = order.userId ? String(order.userId) : '';

    if (orderUserId) {
      const requesterUserId = String(body.userId || '');
      if (!requesterUserId || requesterUserId !== orderUserId) {
        throw new BadRequestException('Order ownership could not be verified');
      }
      return;
    }

    const email = this.normalizeEmail(body.email);
    this.assertValidEmail(email);

    if (email !== this.normalizeEmail(order.customerEmail)) {
      throw new BadRequestException('Order ownership could not be verified');
    }
  }

  // ✅ CREATE PAYMENT - Hỗ trợ cả guest và logged-in user
  async createPayment(body: CreatePaymentDto): Promise<any> {
    // ✅ Validation
    if (!body.items || body.items.length === 0) {
      throw new Error('❌ Items are required! Cannot create payment without items.');
    }

    const customerEmail = this.normalizeEmail(body.customerEmail);
    this.assertValidEmail(customerEmail);

    if (!customerEmail) {
      throw new Error('❌ Customer email is required!');
    }

    if (!body.customerInfo) {
      throw new Error('❌ Customer info is required!');
    }

    const normalizedUserId = this.normalizeUserId(body.userId);
    const isGuest = !normalizedUserId;
    const orderCode = Number(body.orderId);
    this.assertValidOrderCode(orderCode);
    const paymentDescription = this.buildPaymentDescription(orderCode);
    console.log('Creating PayOS payment:', {
      orderCode,
      itemCount: body.items.length,
      paymentType: isGuest ? 'guest' : 'registered',
    });

    // ✅ Call PayOS API
    const itemsSubtotal = body.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const deliveryFee = Number(body.deliveryFee ?? Math.max(0, Number(body.amount || 0) - itemsSubtotal));
    const orderBeforeDiscount = itemsSubtotal + deliveryFee;
    let discountAmount = 0;
    let couponCode = '';
    let finalAmount = Number(body.amount || orderBeforeDiscount);

    if (body.couponCode) {
      const couponResult = await this.couponsService.validate(
        body.couponCode,
        orderBeforeDiscount,
      );
      discountAmount = couponResult.discountAmount;
      couponCode = couponResult.coupon.code;
      finalAmount = couponResult.finalAmount;
    }

    const url = `https://api-merchant.payos.vn/v2/payment-requests`;
    const config = {
      headers: {
        'x-client-id': this.configService.getOrThrow('PAYOS_CLIENT_ID'),
        'x-api-key': this.configService.getOrThrow('PAYOS_API_KEY'),
      },
    };

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const cancelUrl =
      this.configService.get<string>('PAYOS_CANCEL_URL') ||
      `${frontendUrl}/checkout`;
    const returnUrl =
      this.configService.get<string>('PAYOS_RETURN_URL') ||
      `${frontendUrl}/payment`;

    const dataForSignature = {
      orderCode,
      amount: finalAmount,
      description: paymentDescription,
      cancelUrl,
      returnUrl,
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
      paymentProvider: 'payos',
      amount: paymentData.amount,
      subtotal: itemsSubtotal,
      deliveryFee,
      couponCode,
      discountAmount,
      description: paymentDescription,
      
      // ✅ User & Customer data
      userId: normalizedUserId,           // null = guest
      customerEmail,
      customerInfo: body.customerInfo,
      
      items: body.items,
      status: 'PENDING',
      fulfillmentStatus: 'AWAITING_PAYMENT',
      statusHistory: [{
        status: 'AWAITING_PAYMENT',
        note: 'Order created and waiting for payment',
        changedAt: new Date(),
      }],
      createdAt: new Date(),
    });

    console.log('✅ Bill created:', bill._id);
    console.log('👤 Customer type:', isGuest ? 'Guest' : 'Registered User');
    void this.orderEmailService.sendOrderCreatedEmail(bill.toObject());

    return response.data;
  }

  async createStripePaymentIntent(body: CreatePaymentDto): Promise<any> {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('Items are required');
    }

    const customerEmail = this.normalizeEmail(body.customerEmail);
    this.assertValidEmail(customerEmail);

    if (!customerEmail || !body.customerInfo) {
      throw new BadRequestException('Customer information is required');
    }

    const orderCode = Number(body.orderId);
    this.assertValidOrderCode(orderCode);
    const paymentDescription = this.buildPaymentDescription(orderCode);

    await this.ensureItemsStockAvailable(body.items);

    const itemsSubtotal = body.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const deliveryFee = Number(
      body.deliveryFee ?? Math.max(0, Number(body.amount || 0) - itemsSubtotal),
    );
    const orderBeforeDiscount = itemsSubtotal + deliveryFee;
    let discountAmount = 0;
    let couponCode = '';
    let finalAmount = Number(body.amount || orderBeforeDiscount);

    if (body.couponCode) {
      const couponResult = await this.couponsService.validate(
        body.couponCode,
        orderBeforeDiscount,
      );
      discountAmount = couponResult.discountAmount;
      couponCode = couponResult.coupon.code;
      finalAmount = couponResult.finalAmount;
    }

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const currency = (
      this.configService.get<string>('STRIPE_CURRENCY') || 'vnd'
    ).toLowerCase();
    const paymentIntent = await this.getStripeClient().paymentIntents.create({
      amount: this.toStripeAmount(finalAmount, currency),
      currency,
      payment_method_types: ['card'],
      description: paymentDescription,
      receipt_email: customerEmail,
      metadata: {
        provider: 'stripe',
        orderId: body.orderId,
        orderCode: String(orderCode),
        customerEmail,
      },
    });

    const bill = await this.billModel.create({
      orderId: body.orderId,
      orderCode,
      paymentLinkId: paymentIntent.id,
      paymentProvider: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      amount: finalAmount,
      subtotal: itemsSubtotal,
      deliveryFee,
      couponCode,
      discountAmount,
      description: paymentDescription,
      userId: this.normalizeUserId(body.userId),
      customerEmail,
      customerInfo: body.customerInfo,
      items: body.items,
      status: 'PENDING',
      fulfillmentStatus: 'AWAITING_PAYMENT',
      statusHistory: [
        {
          status: 'AWAITING_PAYMENT',
          note: 'Stripe order created and waiting for payment',
          changedAt: new Date(),
        },
      ],
      transactionData: {
        stripePaymentIntentId: paymentIntent.id,
        currency,
      },
      createdAt: new Date(),
    });
    void this.orderEmailService.sendOrderCreatedEmail(bill.toObject());

    return {
      code: '00',
      data: {
        provider: 'stripe',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderCode: bill.orderCode,
        amount: bill.amount,
        currency,
        status: 'PENDING',
      },
    };
  }

  async confirmStripePayment(paymentIntentId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment intent id is required');
    }

    const paymentIntent =
      await this.getStripeClient().paymentIntents.retrieve(paymentIntentId);

    return this.settleStripePaymentIntent(paymentIntent, 'client-confirm');
  }

  async handleStripeWebhook(rawBody: Buffer, signature?: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const event = this.getStripeClient().webhooks.constructEvent(
      rawBody,
      signature || '',
      webhookSecret,
    );

    if (event.type === 'payment_intent.succeeded') {
      return this.settleStripePaymentIntent(
        event.data.object as StripePaymentIntent,
        'stripe-webhook',
      );
    }

    if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.canceled'
    ) {
      const paymentIntent = event.data.object as StripePaymentIntent;
      const bill = await this.billModel.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (bill && bill.status === 'PENDING') {
        bill.status = 'FAILED';
        bill.fulfillmentStatus = 'CANCELLED';
        bill.transactionData = {
          ...(bill.transactionData || {}),
          stripePaymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
          failureReason:
            paymentIntent.last_payment_error?.message || event.type,
        };
        bill.statusHistory = [
          ...(bill.statusHistory || []),
          {
            status: 'CANCELLED',
            note: `Stripe ${event.type}`,
            changedAt: new Date(),
          },
        ];
        await bill.save();
      }
    }

    return { received: true };
  }

  private toStripeAmount(amount: number, currency: string) {
    const zeroDecimalCurrencies = new Set([
      'bif',
      'clp',
      'djf',
      'gnf',
      'jpy',
      'kmf',
      'krw',
      'mga',
      'pyg',
      'rwf',
      'ugx',
      'vnd',
      'vuv',
      'xaf',
      'xof',
      'xpf',
    ]);

    return Math.round(
      Number(amount) *
        (zeroDecimalCurrencies.has(currency.toLowerCase()) ? 1 : 100),
    );
  }

  private async ensureItemsStockAvailable(items: CreatePaymentDto['items']) {
    const stockCheckResults: StockCheckResult[] = [];

    for (const item of items) {
      stockCheckResults.push(
        await this.checkStockBeforeDecrease(
          item.productId,
          item.colorName,
          item.size,
          item.quantity,
        ),
      );
    }

    const unavailableItems = stockCheckResults.filter(
      (result) => !result.isAvailable,
    );
    if (unavailableItems.length > 0) {
      throw new BadRequestException({
        message: 'Some items are out of stock',
        items: unavailableItems,
      });
    }
  }

  private async settleStripePaymentIntent(
    paymentIntent: StripePaymentIntent,
    source: string,
  ) {
    const bill = await this.billModel.findOne({
      $or: [
        { stripePaymentIntentId: paymentIntent.id },
        { paymentLinkId: paymentIntent.id },
      ],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found for Stripe payment');
    }

    if (bill.status === 'PAID') {
      return {
        success: true,
        received: true,
        status: 'PAID',
        order: this.formatOrder(bill.toObject()),
      };
    }

    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        received: true,
        status: paymentIntent.status,
        order: this.formatOrder(bill.toObject()),
      };
    }

    const expectedAmount = this.toStripeAmount(
      bill.amount,
      paymentIntent.currency || 'vnd',
    );
    if (expectedAmount !== paymentIntent.amount) {
      throw new BadRequestException('Stripe amount does not match order amount');
    }

    if (!bill.items || bill.items.length === 0) {
      bill.status = 'FAILED';
      bill.fulfillmentStatus = 'CANCELLED';
      bill.paidAt = new Date();
      bill.transactionData = {
        ...(bill.transactionData || {}),
        stripePaymentIntentId: paymentIntent.id,
        failureReason: 'NO_ITEMS',
        source,
      };
      bill.statusHistory = [
        ...(bill.statusHistory || []),
        {
          status: 'CANCELLED',
          note: 'Payment failed because the order has no items',
          changedAt: new Date(),
        },
      ];
      await bill.save();

      return { success: false, received: true, status: 'FAILED' };
    }

    const stockCheckResults: StockCheckResult[] = [];
    for (const item of bill.items) {
      stockCheckResults.push(
        await this.checkStockBeforeDecrease(
          item.productId,
          item.colorName,
          item.size,
          item.quantity,
        ),
      );
    }

    const hasInsufficientStock = stockCheckResults.some(
      (result) => !result.isAvailable,
    );
    if (hasInsufficientStock) {
      bill.status = 'FAILED';
      bill.fulfillmentStatus = 'CANCELLED';
      bill.paidAt = new Date();
      bill.transactionData = {
        ...(bill.transactionData || {}),
        stripePaymentIntentId: paymentIntent.id,
        failureReason: 'INSUFFICIENT_STOCK',
        stockCheckResults,
        source,
      };
      bill.statusHistory = [
        ...(bill.statusHistory || []),
        {
          status: 'CANCELLED',
          note: 'Payment failed because stock is insufficient',
          changedAt: new Date(),
        },
      ];
      await bill.save();

      return {
        success: false,
        received: true,
        status: 'FAILED',
        reason: 'Insufficient stock',
        details: stockCheckResults.filter((result) => !result.isAvailable),
      };
    }

    for (const item of bill.items) {
      await this.decreaseStock(
        item.productId,
        item.colorName,
        item.size,
        item.quantity,
      );
    }

    bill.status = 'PAID';
    bill.fulfillmentStatus = 'CONFIRMED';
    bill.paidAt = new Date();
    bill.transactionData = {
      ...(bill.transactionData || {}),
      stripePaymentIntentId: paymentIntent.id,
      stripeStatus: paymentIntent.status,
      amountReceived: paymentIntent.amount_received,
      paymentMethod: paymentIntent.payment_method,
      source,
    };
    bill.statusHistory = [
      ...(bill.statusHistory || []),
      {
        status: 'CONFIRMED',
        note: 'Stripe payment completed',
        changedAt: new Date(),
      },
    ];
    await bill.save();

    if (bill.couponCode) {
      await this.couponsService.incrementUsage(bill.couponCode);
    }
    void this.orderEmailService.sendPaymentConfirmedEmail(bill.toObject());

    return {
      success: true,
      received: true,
      status: 'PAID',
      order: this.formatOrder(bill.toObject()),
    };
  }

  private async createStripeRefund(order: Bill, reason: string) {
    const paymentIntentId =
      order.stripePaymentIntentId ||
      (order.paymentProvider === 'stripe' ? order.paymentLinkId : '');

    if (!paymentIntentId) {
      throw new BadRequestException('Stripe payment intent is missing');
    }

    const refund = await this.getStripeClient().refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderCode: String(order.orderCode),
        reason: reason || 'Customer cancelled before shipping',
      },
    });

    return {
      provider: 'stripe',
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
      currency: refund.currency,
    };
  }

  async cancelAndRefundOrder(
    orderCode: number,
    body: { userId?: string; email?: string; reason?: string },
  ) {
    this.assertValidOrderCode(orderCode);

    const bill = await this.billModel.findOne({ orderCode }).exec();
    if (!bill) {
      throw new NotFoundException(`Order ${orderCode} not found`);
    }

    this.assertCancellationOwner(bill, body);

    if (bill.status === 'REFUNDED' || bill.status === 'REFUND_PENDING') {
      throw new BadRequestException('This order already has a refund request');
    }

    if (bill.status !== 'PAID') {
      throw new BadRequestException('Only paid orders can be cancelled and refunded');
    }

    if (!this.isCancellationEligible(bill)) {
      throw new BadRequestException(
        'Orders can only be cancelled while they are being prepared',
      );
    }

    const reason = this.sanitizeNote(body.reason) || 'Customer cancelled before shipping';
    const refundData =
      bill.paymentProvider === 'stripe'
        ? await this.createStripeRefund(bill, reason)
        : {
            provider: bill.paymentProvider || 'payos',
            status: 'PENDING_MANUAL',
            manualRequired: true,
          };

    let stockRestored = true;
    let stockRestoreError = '';
    try {
      await this.restoreOrderStock(bill.items || []);
    } catch (error) {
      stockRestored = false;
      stockRestoreError = error?.message || 'Stock restore failed';
      console.error('Failed to restore stock after cancellation:', {
        orderCode,
        message: stockRestoreError,
      });
    }

    bill.status =
      refundData.provider === 'stripe' && refundData.status !== 'failed'
        ? 'REFUNDED'
        : 'REFUND_PENDING';
    bill.fulfillmentStatus = 'CANCELLED';
    bill.transactionData = {
      ...(bill.transactionData || {}),
      refund: {
        ...refundData,
        requestedAt: new Date(),
        reason,
        stockRestored,
        stockRestoreError: stockRestoreError || undefined,
      },
    };
    bill.statusHistory = [
      ...(bill.statusHistory || []),
      {
        status: 'CANCELLED',
        note: reason,
        changedAt: new Date(),
      },
      {
        status: bill.status,
        note:
          bill.status === 'REFUNDED'
            ? 'Refund created successfully'
            : 'Bank transfer refund requires manual processing',
        changedAt: new Date(),
      },
    ];
    await bill.save();

    void this.orderEmailService.sendOrderCancelledEmail(bill.toObject());

    return {
      success: true,
      message:
        bill.status === 'REFUNDED'
          ? 'Order cancelled and refund created'
          : 'Order cancelled. Refund is pending manual bank transfer processing',
      refund: bill.transactionData.refund,
      order: this.formatOrder(bill.toObject()),
    };
  }

  // ✅ WEBHOOK HANDLER - Xử lý thanh toán và trừ stock
  async handleWebhook(body: PayosWebhookBodyPayload): Promise<WebhookResponse> {
    console.log('PayOS webhook received:', {
      orderCode: body?.data?.orderCode,
      code: body?.code,
      success: body?.success,
    });

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

      if (bill.status === 'PAID') {
        return { received: true, updated: false, status: 'PAID' };
      }

      // ✅ Kiểm tra items
      if (!bill.items || bill.items.length === 0) {
        console.error('❌ Bill has no items!');
        bill.status = 'FAILED';
        bill.fulfillmentStatus = 'CANCELLED';
        bill.paidAt = new Date();
        bill.statusHistory = [
          ...(bill.statusHistory || []),
          {
            status: 'CANCELLED',
            note: 'Payment failed because the order has no items',
            changedAt: new Date(),
          },
        ];
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
        bill.fulfillmentStatus = 'CANCELLED';
        bill.paidAt = new Date();
        bill.statusHistory = [
          ...(bill.statusHistory || []),
          {
            status: 'CANCELLED',
            note: 'Payment failed because stock is insufficient',
            changedAt: new Date(),
          },
        ];
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
      bill.fulfillmentStatus = 'CONFIRMED';
      bill.paidAt = new Date();
      bill.statusHistory = [
        ...(bill.statusHistory || []),
        {
          status: 'CONFIRMED',
          note: 'Payment completed',
          changedAt: new Date(),
        },
      ];
      bill.transactionData = transactionData;
      await bill.save();

      console.log('✅ Payment successful!');
      console.log('✅ Bill updated:', bill._id);
      console.log('👤 Order by:', bill.userId ? 'Registered User' : 'Guest');

      if (bill.couponCode) {
        await this.couponsService.incrementUsage(bill.couponCode);
      }
      void this.orderEmailService.sendPaymentConfirmedEmail(bill.toObject());

      return { received: true, updated: true, status: 'PAID' };

    } catch (error) {
      console.error('❌ Error in webhook:', error);

      try {
        const bill = await this.billModel.findOne({ orderCode });
        if (bill && bill.status === 'PENDING') {
          bill.status = 'FAILED';
          bill.fulfillmentStatus = 'CANCELLED';
          bill.paidAt = new Date();
          bill.statusHistory = [
            ...(bill.statusHistory || []),
            {
              status: 'CANCELLED',
              note: 'Webhook processing failed',
              changedAt: new Date(),
            },
          ];
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

  private async restoreOrderStock(items: Bill['items']) {
    for (const item of items || []) {
      await this.increaseStock(
        item.productId,
        item.colorName,
        item.size,
        item.quantity,
      );
    }
  }

  private async increaseStock(
    productId: string,
    colorName: string,
    size: string,
    quantity: number,
  ) {
    const shoeDetail = await this.shoeDetailModel.findOne({ productId });
    if (!shoeDetail) throw new Error(`Product ${productId} not found`);

    const color = shoeDetail.colors.find(c => c.colorName === colorName);
    if (!color) throw new Error(`Color ${colorName} not found`);

    const sizeObj = color.sizes.find(s => s.size === size);
    if (!sizeObj) throw new Error(`Size ${size} not found`);

    sizeObj.stock = (sizeObj.stock || 0) + Number(quantity || 0);
    await shoeDetail.save();
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
      ...this.formatOrder(bill.toObject()),
      isGuest: !bill.userId,
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
      ...this.formatOrder(bill.toObject()),
      isGuest: !bill.userId,
    };
  }

  // ✅ Get user orders (for logged-in users)
async getUserOrders(userId: string) {
  const orders = await this.billModel
    .find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return {
    success: true,
    userId,
    total: orders.length,
    orders: orders.map(order => ({
      orderCode: order.orderCode,
      paymentLinkId: order.paymentLinkId,
      paymentProvider: order.paymentProvider || 'payos',
      stripePaymentIntentId: order.stripePaymentIntentId,
      amount: order.amount,
      subtotal: order.subtotal || 0,
      deliveryFee: order.deliveryFee || 0,
      couponCode: order.couponCode || '',
      discountAmount: order.discountAmount || 0,
      description: order.description,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus || 'AWAITING_PAYMENT',
      carrier: order.carrier || '',
      trackingCode: order.trackingCode || '',
      statusHistory: order.statusHistory || [],
      deliveredAt: order.deliveredAt,
      items: order.items,
      
      // ✅ Customer data
      userId: order.userId,
      customerEmail: order.customerEmail,
      customerInfo: order.customerInfo,
      
      transactionData: order.transactionData,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    }))
  };
}

// ✅ Get guest orders (by email)
async lookupGuestOrder(body: { email: string; orderCode: string }) {
  const email = this.normalizeEmail(body.email);
  this.assertValidEmail(email);

  const orderCode = Number(String(body.orderCode || '').replace(/\D/g, ''));
  this.assertValidOrderCode(orderCode);

  const order = await this.billModel
    .findOne({
      userId: null,
      orderCode,
      customerEmail: {
        $regex: `^${this.escapeRegExp(email)}$`,
        $options: 'i',
      },
    })
    .lean()
    .exec();

  if (!order) {
    return {
      success: false,
      total: 0,
      orders: [],
      message: 'Order not found for that email and order code',
    };
  }

  return {
    success: true,
    isGuest: true,
    total: 1,
    orders: [this.formatOrder(order)],
  };
}

async getGuestOrders(email: string) {
  throw new BadRequestException(
    'Guest order lookup requires email and order code',
  );
}

async getAllOrders() {
  const orders = await this.billModel
    .find()
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return {
    success: true,
    total: orders.length,
    orders: orders.map(order => this.formatOrder(order)),
  };
}

async updateFulfillmentStatus(
  orderCode: number,
  body: {
    fulfillmentStatus: Bill['fulfillmentStatus'];
    carrier?: string;
    trackingCode?: string;
    note?: string;
  },
) {
  const allowedStatuses = [
    'CONFIRMED',
    'PACKING',
    'SHIPPING',
    'DELIVERED',
    'RETURN_REQUESTED',
    'REFUNDED',
    'CANCELLED',
  ];

  if (!allowedStatuses.includes(body.fulfillmentStatus)) {
    throw new BadRequestException('Invalid fulfillment status');
  }

  const bill = await this.billModel.findOne({ orderCode }).exec();
  if (!bill) {
    throw new NotFoundException(`Order ${orderCode} not found`);
  }

  if (
    !['PAID', 'REFUND_PENDING', 'REFUNDED'].includes(bill.status) &&
    !['CANCELLED', 'REFUNDED'].includes(body.fulfillmentStatus)
  ) {
    throw new BadRequestException('Only paid orders can move through fulfillment');
  }

  bill.fulfillmentStatus = body.fulfillmentStatus;
  bill.carrier = body.carrier ?? bill.carrier;
  bill.trackingCode = body.trackingCode ?? bill.trackingCode;

  if (body.fulfillmentStatus === 'DELIVERED') {
    bill.deliveredAt = bill.deliveredAt || new Date();
  }

  if (body.fulfillmentStatus === 'CANCELLED') {
    bill.status = 'CANCELLED';
  }

  if (body.fulfillmentStatus === 'REFUNDED') {
    bill.status = 'REFUNDED';
    bill.transactionData = {
      ...(bill.transactionData || {}),
      refund: {
        ...(bill.transactionData?.refund || {}),
        status: 'MANUAL_COMPLETED',
        completedAt: new Date(),
      },
    };
  }

  bill.statusHistory = [
    ...(bill.statusHistory || []),
    {
      status: body.fulfillmentStatus,
      note: body.note || '',
      changedAt: new Date(),
    },
  ];

  await bill.save();

  return {
    success: true,
    order: this.formatOrder(bill.toObject()),
  };
}

private formatOrder(order: any) {
  return {
    orderCode: order.orderCode,
    paymentLinkId: order.paymentLinkId,
    paymentProvider: order.paymentProvider || 'payos',
    stripePaymentIntentId: order.stripePaymentIntentId,
    amount: order.amount,
    subtotal: order.subtotal || 0,
    deliveryFee: order.deliveryFee || 0,
    couponCode: order.couponCode || '',
    discountAmount: order.discountAmount || 0,
    description: order.description,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus || 'AWAITING_PAYMENT',
    carrier: order.carrier || '',
    trackingCode: order.trackingCode || '',
    statusHistory: order.statusHistory || [],
    deliveredAt: order.deliveredAt,
    items: order.items,
    userId: order.userId,
    customerEmail: order.customerEmail,
    customerInfo: order.customerInfo,
    transactionData: order.transactionData,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}

}
