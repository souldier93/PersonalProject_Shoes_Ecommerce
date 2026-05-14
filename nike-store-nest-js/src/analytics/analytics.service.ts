import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from '../payment/bill.schema';
import { ShoeDetail, ShoeDetailDocument } from '../shoes/shoe-detail.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Bill') private billModel: Model<Bill>,
    @InjectModel(ShoeDetail.name) private shoeDetailModel: Model<ShoeDetailDocument>,
  ) {}

  async getOverview() {
    const orders = await this.billModel.find().lean().exec();
    const paidOrders = orders.filter(order => order.status === 'PAID');
    const details = await this.shoeDetailModel.find().lean().exec();

    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalDiscount = paidOrders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0);
    const averageOrderValue = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

    const salesByDayMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const sizeMap = new Map<string, number>();
    const fulfillmentMap = new Map<string, number>();

    orders.forEach(order => {
      const fulfillment = order.fulfillmentStatus || 'AWAITING_PAYMENT';
      fulfillmentMap.set(fulfillment, (fulfillmentMap.get(fulfillment) || 0) + 1);
    });

    paidOrders.forEach(order => {
      const day = new Date(order.paidAt || order.createdAt).toISOString().slice(0, 10);
      salesByDayMap.set(day, (salesByDayMap.get(day) || 0) + Number(order.amount || 0));

      (order.items || []).forEach(item => {
        const existing = productMap.get(item.productId) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(item.quantity || 0);
        existing.revenue += Number(item.price || 0) * Number(item.quantity || 0);
        productMap.set(item.productId, existing);
        sizeMap.set(item.size, (sizeMap.get(item.size) || 0) + Number(item.quantity || 0));

        const detail = details.find(product => product.productId === item.productId);
        const category = detail?.category || 'Unknown';
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(item.price || 0) * Number(item.quantity || 0));
      });
    });

    const lowStockProducts = details.flatMap(product =>
      (product.colors || []).flatMap(color =>
        (color.sizes || [])
          .filter(size => Number(size.stock || 0) > 0 && Number(size.stock || 0) <= 5)
          .map(size => ({
            productId: product.productId,
            name: product.name,
            colorName: color.colorName,
            size: size.size,
            stock: Number(size.stock || 0),
          })),
      ),
    );

    return {
      success: true,
      summary: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalDiscount,
        averageOrderValue,
        conversionToPaid: orders.length ? Number(((paidOrders.length / orders.length) * 100).toFixed(1)) : 0,
      },
      salesByDay: Array.from(salesByDayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, revenue]) => ({ date, revenue })),
      revenueByCategory: Array.from(categoryMap.entries())
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: Array.from(productMap.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      topSizes: Array.from(sizeMap.entries())
        .map(([size, quantity]) => ({ size, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8),
      fulfillmentBreakdown: Array.from(fulfillmentMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      lowStockProducts: lowStockProducts.slice(0, 20),
    };
  }
}
