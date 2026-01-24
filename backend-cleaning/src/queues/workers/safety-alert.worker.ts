import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from '../../email/email.service';
import { SmsService } from '../../sms/sms.service';

@Processor('safety-alerts-queue')
export class SafetyAlertWorker {
  private readonly logger = new Logger(SafetyAlertWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Process('dispatch-panic-alert')
  async dispatchPanicAlert(
    job: Job<{ panicAlertId: string; panicType?: string }>,
  ): Promise<void> {
    const { panicAlertId, panicType } = job.data;
    this.logger.log(
      `Processando alerta crítico de pânico (${panicAlertId}).`,
    );

    const panicAlert = await this.prisma.panicAlert.findUnique({
      where: { id: panicAlertId },
      include: {
        user: {
          select: { id: true, phone: true, fullName: true, email: true },
        },
      },
    });

    if (!panicAlert) {
      this.logger.warn(
        `Alerta de pânico ${panicAlertId} não encontrado. Ignorando job.`,
      );
      return;
    }

    const adminUsers = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const formattedLocation = `${panicAlert.latitude}, ${panicAlert.longitude}`;
    const finalMessage =
      `Usuário ${panicAlert.user?.fullName ?? panicAlert.userId} acionou o botão de pânico em ${formattedLocation}. ` +
      `Tipo: ${panicType ?? 'N/A'}. Mensagem: ${panicAlert.message ?? 'N/A'}.`;

    const payload = { type: 'panic_alert', panicAlertId };

    try {
      await Promise.all(
        adminUsers.map((admin) =>
          this.notificationsService.sendPushNotification(
            admin.id,
            'ALERTA DE PÂNICO!',
            finalMessage,
            payload,
          ),
        ),
      );

      await this.emailService.sendPanicAlertEmail(panicAlert);

      if (panicAlert.user?.phone) {
        await this.smsService.sendPanicAlertSms(
          panicAlert.user.phone,
          panicAlert.message || 'Alerta de pânico sem mensagem específica.',
        );
      } else {
        this.logger.warn(
          `[SafetyAlertWorker] Usuário ${panicAlert.userId} não possui telefone para SMS.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Falha ao processar alerta de pânico ${panicAlertId}: ${
          (error as Error).message
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
