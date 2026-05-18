import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type OrderEmailKind = 'created' | 'paid';

@Injectable()
export class OrderEmailService {
  private transporter: any;

  constructor(private readonly configService: ConfigService) {}

  async sendOrderCreatedEmail(order: any) {
    await this.sendOrderEmail(order, 'created');
  }

  async sendPaymentConfirmedEmail(order: any) {
    await this.sendOrderEmail(order, 'paid');
  }

  private async sendOrderEmail(order: any, kind: OrderEmailKind) {
    const transporter = this.getTransporter();
    if (!transporter) {
      console.warn('Order email skipped: Gmail credentials are not configured');
      return;
    }

    const recipient = this.normalizeEmail(order.customerEmail);
    if (!recipient) {
      console.warn('Order email skipped: missing customer email', {
        orderCode: order.orderCode,
      });
      return;
    }

    const sender = this.configService.get<string>('EMAIL_USER') || '';
    const notificationEmail = this.normalizeEmail(
      this.configService.get<string>('ORDER_NOTIFICATION_EMAIL') || sender,
    );
    const storeCopy =
      notificationEmail && notificationEmail !== recipient
        ? notificationEmail
        : undefined;
    const subject =
      kind === 'paid'
        ? `PTT Style - Payment confirmed for order #${order.orderCode}`
        : `PTT Style - Order #${order.orderCode} received`;

    try {
      await transporter.sendMail({
        from: `"PTT Style" <${sender}>`,
        to: recipient,
        bcc: storeCopy,
        subject,
        html: this.buildOrderHtml(order, kind),
        text: this.buildOrderText(order, kind),
      });

      console.log('Order email sent:', {
        orderCode: order.orderCode,
        type: kind,
        hasStoreCopy: !!storeCopy,
      });
    } catch (error) {
      console.error('Order email failed:', {
        orderCode: order.orderCode,
        type: kind,
        message: error?.message || 'Unknown error',
      });
    }
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');
    if (!user || !pass) return null;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    return this.transporter;
  }

  private buildOrderHtml(order: any, kind: OrderEmailKind) {
    const customerName = this.escapeHtml(
      `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() ||
        'there',
    );
    const statusText =
      kind === 'paid'
        ? 'Your payment has been confirmed and the order is now being prepared.'
        : 'We received your order and are waiting for payment confirmation.';
    const orderUrl = `${this.getFrontendUrl()}/my-orders`;
    const rows = (order.items || [])
      .map((item) => {
        const name = this.escapeHtml(item.name || 'Item');
        const details = this.escapeHtml(
          `${item.colorName || ''} / Size ${item.size || ''} / Qty ${item.quantity || 0}`,
        );
        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <div style="font-weight: 700; color: #111827;">${name}</div>
              <div style="font-size: 13px; color: #6b7280;">${details}</div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
              ${this.formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <div style="margin: 0; background: #f5f5f5; padding: 24px; font-family: Arial, sans-serif; color: #111827;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #111111; color: #ffffff; padding: 24px;">
            <div style="font-size: 13px; letter-spacing: .08em; text-transform: uppercase;">PTT Style</div>
            <h1 style="margin: 8px 0 0; font-size: 24px;">Order #${this.escapeHtml(String(order.orderCode || ''))}</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px;">Hi ${customerName},</p>
            <p style="margin: 0 0 20px; color: #374151;">${statusText}</p>

            <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 8px;">
                <span style="color: #6b7280;">Payment status</span>
                <strong>${this.escapeHtml(order.status || 'PENDING')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 8px;">
                <span style="color: #6b7280;">Fulfillment</span>
                <strong>${this.escapeHtml(order.fulfillmentStatus || 'AWAITING_PAYMENT')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="color: #6b7280;">Total</span>
                <strong>${this.formatPrice(order.amount || 0)}</strong>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tbody>${rows}</tbody>
            </table>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; color: #374151;">
              <div style="font-weight: 700; margin-bottom: 8px;">Delivery address</div>
              <div>${this.escapeHtml(order.customerInfo?.address || '')}</div>
              <div>${this.escapeHtml(
                [order.customerInfo?.city, order.customerInfo?.postalCode]
                  .filter(Boolean)
                  .join(' '),
              )}</div>
            </div>

            <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px;">
              Guest customers can view this order with the checkout email and order code at
              <a href="${orderUrl}" style="color: #111111;">${orderUrl}</a>.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private buildOrderText(order: any, kind: OrderEmailKind) {
    const statusText =
      kind === 'paid'
        ? 'Payment confirmed. Your order is being prepared.'
        : 'Order received. We are waiting for payment confirmation.';
    const items = (order.items || [])
      .map((item) => {
        return `- ${item.name} (${item.colorName}, size ${item.size}) x${item.quantity}: ${this.formatPrice(
          Number(item.price || 0) * Number(item.quantity || 0),
        )}`;
      })
      .join('\n');

    return [
      `PTT Style order #${order.orderCode}`,
      statusText,
      `Payment status: ${order.status || 'PENDING'}`,
      `Fulfillment: ${order.fulfillmentStatus || 'AWAITING_PAYMENT'}`,
      `Total: ${this.formatPrice(order.amount || 0)}`,
      '',
      'Items:',
      items,
      '',
      `View guest orders: ${this.getFrontendUrl()}/my-orders`,
    ].join('\n');
  }

  private getFrontendUrl() {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');
  }

  private normalizeEmail(email?: string | null) {
    return String(email || '').trim().toLowerCase();
  }

  private escapeHtml(value: string) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatPrice(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(value || 0));
  }
}
