import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Post()
  createReview(@Body() body: any) {
    return this.reviewsService.createReview(body);
  }

  @Patch(':id/status')
  updateReviewStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'hidden',
  ) {
    return this.reviewsService.updateReviewStatus(id, status);
  }
}
