import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PayoutsService } from './payouts.service';

@Controller('payouts/webhook')
export class PayoutsWebhookController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('gateway')
  async handleGatewayWebhook(
    @Headers('x-signature') signature: string,
    @Headers('x-event-id') eventId: string,
    @Body() payload: any,
  ) {
    return this.payoutsService.handleGatewayWebhook(signature, eventId, payload);
  }
}
