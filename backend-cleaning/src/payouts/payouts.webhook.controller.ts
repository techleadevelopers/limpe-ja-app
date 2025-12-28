import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PspWebhookGuard } from './guards/psp-webhook.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('payouts/webhook')
@UseGuards(ThrottlerGuard, PspWebhookGuard)
export class PayoutsWebhookController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Throttle(30, 60)
  @Post('gateway')
  async handleGatewayWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: any,
  ) {
    return this.payoutsService.handleGatewayWebhook(
      signature,
      eventId,
      payload,
    );
  }
}
