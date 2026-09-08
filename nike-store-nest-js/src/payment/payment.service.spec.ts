import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService provider configuration', () => {
  const createService = (values: Record<string, string> = {}) => {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    };

    return new PaymentService({ post: jest.fn() } as any, configService as any, {} as any, {} as any, {} as any, {} as any, { delPattern: jest.fn() } as any);
  };

  const order = {
    orderId: '123456',
    description: 'PTT 123456',
    amount: 1010000,
    deliveryFee: 10000,
    customerEmail: 'checkout-test@example.com',
    customerInfo: {
      firstName: 'Checkout',
      lastName: 'Test',
      phone: '0900000000',
      address: 'Local test address',
    },
    items: [
      {
        productId: '9001',
        name: 'Test shoe',
        colorName: 'Black',
        size: '40',
        quantity: 1,
        price: 1000000,
      },
    ],
  };

  it('reports only providers that have every required key', () => {
    const service = createService({
      PAYOS_CLIENT_ID: 'client',
      PAYOS_API_KEY: 'api-key',
      PAYOS_CHECKSUM_KEY: 'checksum',
      STRIPE_SECRET_KEY: '  ',
    });

    expect(service.getPaymentProviders()).toEqual({
      payos: true,
      stripe: false,
    });
  });

  it('rejects PayOS checkout clearly before calling external services', async () => {
    const service = createService();

    await expect(service.createPayment(order)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects Stripe checkout clearly when its key is missing', async () => {
    const service = createService();

    await expect(service.createStripePaymentIntent(order)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
