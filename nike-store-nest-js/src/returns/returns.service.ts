import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from '../payment/bill.schema';
import { ReturnRequest, ReturnRequestDocument } from './return-request.schema';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectModel(ReturnRequest.name) private returnModel: Model<ReturnRequestDocument>,
    @InjectModel('Bill') private billModel: Model<Bill>,
  ) {}

  async create(body: Partial<ReturnRequest>) {
    const order = await this.billModel.findOne({ orderCode: Number(body.orderCode) }).lean();
    if (!order || order.status !== 'PAID') {
      throw new BadRequestException('Only paid orders can create return requests');
    }

    const item = order.items?.find(orderItem =>
      orderItem.productId === body.productId &&
      orderItem.colorName === body.colorName &&
      orderItem.size === body.size,
    );

    if (!item) {
      throw new BadRequestException('Item is not part of this order');
    }

    const request = await this.returnModel.create({
      orderCode: Number(body.orderCode),
      userId: order.userId || null,
      customerEmail: order.customerEmail,
      productId: item.productId,
      productName: item.name,
      colorName: item.colorName,
      size: item.size,
      quantity: Math.min(Number(body.quantity || 1), Number(item.quantity || 1)),
      type: body.type || 'RETURN',
      reason: body.reason,
      note: body.note || '',
      images: body.images || [],
      status: 'REQUESTED',
    });

    return {
      success: true,
      request,
    };
  }

  async findAll(status?: string) {
    const filter = status ? { status } : {};
    const requests = await this.returnModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      success: true,
      requests,
    };
  }

  async findByUser(userId: string) {
    const requests = await this.returnModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      success: true,
      requests,
    };
  }

  async updateStatus(id: string, status: ReturnRequest['status'], adminNote = '') {
    const allowed = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid return status');
    }

    const request = await this.returnModel.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true },
    );

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    return {
      success: true,
      request,
    };
  }
}
