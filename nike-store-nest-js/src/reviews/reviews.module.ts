import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillSchema } from '../payment/bill.schema';
import { ShoeDetail, ShoeDetailSchema } from '../shoes/shoe-detail.schema';
import { Review, ReviewSchema } from './review.schema';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: 'Bill', schema: BillSchema },
      { name: ShoeDetail.name, schema: ShoeDetailSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
