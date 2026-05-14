import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from '../payment/bill.schema';
import { ShoeDetail, ShoeDetailDocument } from '../shoes/shoe-detail.schema';
import { Review, ReviewDocument } from './review.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel('Bill') private billModel: Model<Bill>,
    @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
  ) {}

  async getProductReviews(productId: string) {
    const reviews = await this.reviewModel
      .find({ productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      success: true,
      productId,
      summary: this.buildSummary(reviews),
      reviews,
    };
  }

  async createReview(body: {
    productId: string;
    orderCode: number;
    userId: string;
    username: string;
    colorName: string;
    size: string;
    rating: number;
    comment?: string;
    images?: string[];
  }) {
    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const order = await this.billModel.findOne({
      orderCode: Number(body.orderCode),
      userId: body.userId,
      status: 'PAID',
    });

    if (!order) {
      throw new BadRequestException('Only paid orders can be reviewed');
    }

    const boughtItem = order.items?.find(
      item =>
        item.productId === body.productId &&
        item.colorName === body.colorName &&
        item.size === body.size,
    );

    if (!boughtItem) {
      throw new BadRequestException('This product variant was not in the order');
    }

    const existing = await this.reviewModel.findOne({
      productId: body.productId,
      orderCode: Number(body.orderCode),
      userId: body.userId,
      colorName: body.colorName,
      size: body.size,
    });

    if (existing) {
      throw new ConflictException('You already reviewed this item from this order');
    }

    const review = await this.reviewModel.create({
      ...body,
      orderCode: Number(body.orderCode),
      rating,
      comment: body.comment || '',
      images: body.images || [],
      status: 'approved',
    });

    await this.recalculateProductRating(body.productId, body.colorName);

    return {
      success: true,
      review,
    };
  }

  async updateReviewStatus(id: string, status: 'approved' | 'hidden') {
    if (!['approved', 'hidden'].includes(status)) {
      throw new BadRequestException('Invalid review status');
    }

    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.recalculateProductRating(review.productId, review.colorName);

    return {
      success: true,
      review,
    };
  }

  private buildSummary(reviews: any[]) {
    const total = reviews.length;
    const average = total
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;

    return {
      total,
      average: Number(average.toFixed(1)),
      breakdown: [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(review => Number(review.rating) === star).length,
      })),
    };
  }

  private async recalculateProductRating(productId: string, colorName: string) {
    const reviews = await this.reviewModel
      .find({ productId, colorName, status: 'approved' })
      .lean()
      .exec();

    const summary = this.buildSummary(reviews);
    const detail = await this.shoeDetailModel.findOne({ productId }).exec();
    if (!detail) return;

    detail.colors = detail.colors.map(color => {
      if (color.colorName !== colorName) {
        return color;
      }

      return {
        ...color,
        rating: summary.average,
        reviewCount: summary.total,
        updatedAt: new Date().toISOString(),
      };
    });

    await detail.save();
  }
}
