import { InternalServerErrorException } from '@nestjs/common';
import { PaymentIntent, PaymentIntentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class PaymentIntentLocker {
  private static readonly ACTIVE_PAYMENT_INTENT_STATUSES: PaymentIntentStatus[] = [
    PaymentIntentStatus.PENDING,
  ];

  constructor(private readonly prisma: PrismaService) {}

  private isIntentActive(status: PaymentIntentStatus): boolean {
    return PaymentIntentLocker.ACTIVE_PAYMENT_INTENT_STATUSES.includes(status);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async claimPaymentIntent(
    bookingId: string,
    amountCents: number,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<{ intent: PaymentIntent; shouldCreate: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentIntent.findUnique({
        where: { bookingId },
      });

      if (existing) {
        if (this.isIntentActive(existing.status)) {
          return { intent: existing, shouldCreate: false };
        }
        const resetData = {
          amountCents,
          status: PaymentIntentStatus.PENDING,
          referenceId,
          externalRef: referenceId,
          idempotencyKey,
          externalOrderId: null,
          externalChargeId: null,
          externalQrCodeId: null,
          qrCodeText: null,
          qrCodeUrl: null,
          expiresAt: null,
        };
        const updated = await tx.paymentIntent.update({
          where: { id: existing.id },
          data: resetData,
        });
        return { intent: updated, shouldCreate: true };
      }

      const created = await tx.paymentIntent.create({
        data: {
          bookingId,
          amountCents,
          status: PaymentIntentStatus.PENDING,
          referenceId,
          externalRef: referenceId,
          idempotencyKey,
        },
      });
      return { intent: created, shouldCreate: true };
    });
  }

  async waitForIntentReady(intentId: string): Promise<PaymentIntent> {
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      const intent = await this.prisma.paymentIntent.findUnique({
        where: { id: intentId },
      });
      if (intent && intent.externalOrderId && intent.qrCodeUrl) {
        return intent;
      }
      await this.delay(150);
    }
    const fallback = await this.prisma.paymentIntent.findUnique({
      where: { id: intentId },
    });
    if (!fallback) {
      throw new InternalServerErrorException(
        'Pagamento aguardando atualização, tente novamente em instantes.',
      );
    }
    return fallback;
  }
}
