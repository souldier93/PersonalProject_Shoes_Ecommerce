// payment.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';
import { Bill, BillSchema } from './bill.schema';
import { ShoeDetail, ShoeDetailSchema } from '../shoes/shoe-detail.schema'; // ✅ Import ShoeDetail

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: 'Bill', schema: BillSchema },
      { name: 'ShoeDetail', schema: ShoeDetailSchema }, // ✅ Thêm ShoeDetail
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
