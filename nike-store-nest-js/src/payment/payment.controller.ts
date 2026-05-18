import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { CreatePaymentDto } from './dto/CreatePaymentDto.js';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard.js';
import { WebhookResponse } from './payment.interface.js';
import { PaymentService } from './payment.service.js';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() body: CreatePaymentDto): Promise<any> {
    console.log('Payment request received:', {
      orderId: body?.orderId,
      itemCount: body?.items?.length || 0,
      paymentType: body?.userId ? 'registered' : 'guest',
    });
    return this.paymentService.createPayment(body);
  }

  @Post('stripe/create-intent')
  async createStripePayment(@Body() body: CreatePaymentDto): Promise<any> {
    return this.paymentService.createStripePaymentIntent(body);
  }

  @Post('stripe/confirm')
  async confirmStripePayment(
    @Body() body: { paymentIntentId: string },
  ): Promise<any> {
    return this.paymentService.confirmStripePayment(body.paymentIntentId);
  }

  @Post('stripe/webhook')
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<any> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for Stripe webhook');
    }

    return this.paymentService.handleStripeWebhook(req.rawBody, signature);
  }

  @Post('webhook')
  @UseGuards(PaymentWebhookGuard)
  handleWebhook(@Body() body: any): Promise<WebhookResponse> {
    return this.paymentService.handleWebhook(body);
  }

  @Get('check/:paymentLinkId')
  async checkPaymentStatus(@Param('paymentLinkId') paymentLinkId: string) {
    return this.paymentService.checkPaymentStatus(paymentLinkId);
  }

  @Get('orders')
  async getAllOrders() {
    return this.paymentService.getAllOrders();
  }

  @Patch('orders/:orderCode/fulfillment')
  async updateFulfillmentStatus(
    @Param('orderCode') orderCode: string,
    @Body()
    body: {
      fulfillmentStatus: any;
      carrier?: string;
      trackingCode?: string;
      note?: string;
    },
  ) {
    return this.paymentService.updateFulfillmentStatus(Number(orderCode), body);
  }

  @Get('check-order/:orderCode')
  async checkPaymentByOrderCode(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkPaymentByOrderCode(Number(orderCode));
  }

  @Get('user/:userId/orders')
  async getUserOrders(@Param('userId') userId: string) {
    return this.paymentService.getUserOrders(userId);
  }

  @Post('guest/orders/lookup')
  async lookupGuestOrder(@Body() body: { email: string; orderCode: string }) {
    return this.paymentService.lookupGuestOrder(body);
  }

  @Get('guest/:email/orders')
  async getGuestOrders(@Param('email') email: string) {
    return this.paymentService.getGuestOrders(email);
  }
}
