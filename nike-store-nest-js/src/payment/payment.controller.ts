// payment.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
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

  // ✅ API check status by orderCode
  @Get('check-order/:orderCode')
  async checkPaymentByOrderCode(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkPaymentByOrderCode(Number(orderCode));
  }
}
