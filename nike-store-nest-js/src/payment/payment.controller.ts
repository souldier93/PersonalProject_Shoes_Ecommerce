// payment.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import type { CreatePaymentDto } from './dto/CreatePaymentDto.js';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard.js';
import { WebhookResponse } from './payment.interface.js'; // ✅ Import interface

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() body: CreatePaymentDto): Promise<any> {
    console.log('📥 Payment request received:', JSON.stringify(body, null, 2));
    return this.paymentService.createPayment(body);
  }

  @Post('webhook')
  @UseGuards(PaymentWebhookGuard)
  handleWebhook(@Body() body: any): Promise<WebhookResponse> { // ✅ Fix: Thêm return type
    return this.paymentService.handleWebhook(body);
  }

  // ✅ API check status by paymentLinkId
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
    @Body() body: {
      fulfillmentStatus: any;
      carrier?: string;
      trackingCode?: string;
      note?: string;
    },
  ) {
    return this.paymentService.updateFulfillmentStatus(Number(orderCode), body);
  }

  // ✅ API check status by orderCode
  @Get('check-order/:orderCode')
  async checkPaymentByOrderCode(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkPaymentByOrderCode(Number(orderCode));
  }
  // ✅ Get orders by userId
@Get('user/:userId/orders')
async getUserOrders(@Param('userId') userId: string) {
  return this.paymentService.getUserOrders(userId);
}

// ✅ Get orders by email (for guest)
@Get('guest/:email/orders')
async getGuestOrders(@Param('email') email: string) {
  return this.paymentService.getGuestOrders(email);
}
}
