import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { PspWebhookGuard } from '../payouts/guards/psp-webhook.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

type RawWebhookRequest = Request & {
  rawBody?: Buffer | string;
  bodyRaw?: Buffer | string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@Controller('payments/webhook')
@UseGuards(ThrottlerGuard, PspWebhookGuard)
export class PaymentsWebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Header('Content-Type', 'application/json')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @Post('pix')
  public async handlePixWebhook(
    @Req() req: RawWebhookRequest,
    @Res() res: Response,
  ) {
    const rawBodyInput = req.rawBody ?? req.bodyRaw ?? '';
    const rawBody =
      typeof rawBodyInput === 'string'
        ? rawBodyInput
        : rawBodyInput?.toString?.('utf8') ?? '';

    let parsed: Record<string, unknown> = {};
    try {
      const parsedJson: unknown = JSON.parse(rawBody);
      if (isRecord(parsedJson)) {
        parsed = parsedJson;
      }
    } catch {
      parsed = Object.fromEntries(new URLSearchParams(rawBody ?? ''));
    }

    const result = await this.paymentsService.handlePixWebhook(rawBody, parsed);
    return res.status(200).json(result);
  }

  @HttpCode(HttpStatus.OK)
  @Throttle(20, 60)
  @Post('withdrawal')
  public async handleWithdrawalWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.paymentsService.handleWithdrawalWebhook(
      signature,
      eventId,
      payload,
    );
  }
}
