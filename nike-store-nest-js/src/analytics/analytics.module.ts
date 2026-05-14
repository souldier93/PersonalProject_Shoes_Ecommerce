import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BillSchema } from '../payment/bill.schema';
import { ShoeDetail, ShoeDetailSchema } from '../shoes/shoe-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Bill', schema: BillSchema },
      { name: ShoeDetail.name, schema: ShoeDetailSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
