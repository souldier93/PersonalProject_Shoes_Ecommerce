import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillSchema } from '../payment/bill.schema';
import { ReturnRequest, ReturnRequestSchema } from './return-request.schema';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
      { name: 'Bill', schema: BillSchema },
    ]),
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
