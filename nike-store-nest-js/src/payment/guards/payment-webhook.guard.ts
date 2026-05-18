import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayosWebhookBodyPayload } from '../dto/payos-webhook-body.payload';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { convertObjToQueryStr, sortObjDataByKey } from '../payos-utils';

@Injectable()
export class PaymentWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  isValidData(
    data: Record<string, unknown>,
    currentSignature: string,
    checksumKey: string,
  ) {
    const sortedDataByKey = sortObjDataByKey(data);
    const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = createHmac('sha256', checksumKey)
      .update(dataQueryStr)
      .digest('hex');
    const expected = Buffer.from(dataToSignature, 'hex');
    const received = Buffer.from(currentSignature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const req = context.switchToHttp().getRequest<Request>();
      const CHECKSUM_KEY =
        this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY');

      const body = req.body as unknown as PayosWebhookBodyPayload;

      const isValidPayload = this.isValidData(
        body.data as unknown as Record<string, unknown>,
        body.signature,
        CHECKSUM_KEY,
      );
      console.log({
        isValidPayload,
        orderCode: body.data?.orderCode,
        paymentLinkId: body.data?.paymentLinkId,
      });
      if (!isValidPayload) {
        throw new UnauthorizedException('Invalid payload');
      }

      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid payload');
    }
  }
}
