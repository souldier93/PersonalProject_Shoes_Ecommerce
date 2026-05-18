// payment.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BillSchema } from './bill.schema';
import { ShoeDetailSchema } from '../shoes/shoe-detail.schema';
import { CouponsModule } from '../coupons/coupons.module';
import { OrderEmailService } from './order-email.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    CouponsModule,
    MongooseModule.forFeature([
      { name: 'Bill', schema: BillSchema },
      { name: 'ShoeDetail', schema: ShoeDetailSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, OrderEmailService],
  exports: [PaymentService],
})
export class PaymentModule {}
