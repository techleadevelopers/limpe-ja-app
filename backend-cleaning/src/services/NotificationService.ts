import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, IncidentStatus, IncidentType } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private initialized = false;

  constructor(private readonly prisma: PrismaService) {}

  private getFirebaseConfig() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        '[NotificationService] Firebase credentials missing. Pushes will be simulated.',
      );
      return null;
    }
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  private ensureInitialized() {
    if (admin.apps.length) {
      this.initialized = true;
      return;
    }
    if (this.initialized) {
      return;
    }
    const credentials = this.getFirebaseConfig();
    if (!credentials) {
      return;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      this.initialized = true;
      this.logger.log('[NotificationService] Firebase Admin initialized.');
    } catch (error: unknown) {
      this.logger.warn(
        `[NotificationService] Failed to initialize Firebase Admin: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }
  }

  private formatDataPayload(payload?: Record<string, unknown>) {
    if (!payload) return undefined;
    const data: Record<string, string> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string') {
        data[key] = value;
      } else {
        data[key] = JSON.stringify(value);
      }
    });
    return data;
  }

  private async reportMissingTokenIncident(
    userId: string,
    context: string,
  ): Promise<void> {
    try {
      await this.prisma.incident.create({
        data: {
          reporterId: userId,
          type: IncidentType.OTHER,
          description: context,
          attachments: [],
          status: IncidentStatus.PENDING_REVIEW,
        },
      });
    } catch (error) {
      this.logger.warn(
        `[NotificationService] Falha ao registrar incidente para ${userId}: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }
  }

  private buildBookingMessage(status: BookingStatus) {
    if (status === BookingStatus.STARTED) {
      return {
        title: 'Sua limpeza começou! 🧼',
        body: 'O prestador iniciou o atendimento no seu endereço.',
      };
    }
    if (status === BookingStatus.FINISHED) {
      return {
        title: 'Faxina finalizada! ✨',
        body: 'Confira o relatório no app.',
      };
    }
    return null;
  }

  async notifyBookingStatusPush(
    bookingId: string,
    clientId: string | null | undefined,
    status: BookingStatus,
  ) {
    if (!clientId) {
      this.logger.warn(
        `[Push] Booking ID: ${bookingId} | Destinatário: ${clientId} | Status: ${status} | motivo: clientId ausente`,
      );
      return;
    }

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (!client?.userId) {
      this.logger.warn(
        `[Push] Booking ID: ${bookingId} | Destinatário: ${clientId} | Status: ${status} | motivo: userId ausente`,
      );
      return;
    }

    const message = this.buildBookingMessage(status);
    if (!message) return;

    await this.sendToUser(client.userId, message.title, message.body, {
      bookingId,
      status,
    });

    this.logger.log(
      `[Push] Booking ID: ${bookingId} | Destinatário: ${clientId} | Status: ${status}`,
    );
  }

  async sendPush(
    targetToken: string,
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ) {
    if (!targetToken) {
      this.logger.warn(
        '[NotificationService] Missing targetToken, skipping push.',
      );
      return;
    }
    this.ensureInitialized();
    if (!admin.apps.length) {
      this.logger.warn(
        '[NotificationService] Firebase Admin not ready, push skipped.',
      );
      return;
    }

    try {
      await admin.messaging().send({
        token: targetToken,
        notification: {
          title,
          body,
        },
        data: this.formatDataPayload(payload),
        android: {
          notification: {
            channelId: 'high-priority',
            priority: 'high',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      this.logger.log(`[NotificationService] Push sent to ${targetToken}`);
    } catch (error: unknown) {
      this.logger.error(
        `[NotificationService] Push error for ${targetToken}: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    payload?: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (!user?.fcmToken) {
      await this.reportMissingTokenIncident(
        userId,
        `FCM token ausente ao enviar "${title}"`,
      );
      this.logger.warn(
        `[NotificationService] User ${userId} sem fcmToken para "${title}".`,
      );
      return;
    }
    await this.sendPush(user.fcmToken, title, body, payload);
  }
}
