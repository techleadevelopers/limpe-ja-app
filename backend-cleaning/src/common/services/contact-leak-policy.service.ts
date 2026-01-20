import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  PolicyEnforcement,
  PolicyLeakType,
  PolicySource,
} from '@prisma/client';
import { ContactLeakDetector } from './contact-leak-detector.service';
import { contactLeakPolicyCounter } from '../../metrics/prometheus';

export interface ContactPolicyOptions {
  chatId?: string;
  bookingId?: string;
  disputeId?: string;
  userId: string;
  content: string;
  source: PolicySource;
}

export interface ContactPolicyResult {
  enforcement: PolicyEnforcement;
  type: PolicyLeakType;
}

@Injectable()
export class ContactLeakPolicyService {
  private readonly logger = new Logger(ContactLeakPolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly contactLeakDetector: ContactLeakDetector,
  ) {}

  async evaluatePolicy(
    options: ContactPolicyOptions,
  ): Promise<ContactPolicyResult | null> {
    const detection = this.contactLeakDetector.detect(options.content);
    if (!detection) {
      return null;
    }

    const hashedMatch = this.contactLeakDetector.hashMatch(
      detection.matches.join('|') || detection.matches[0] || options.content,
    );
    const previousHits = await this.prisma.messagePolicyHit.count({
      where: { userId: options.userId },
    });
    const enforcement =
      previousHits > 0
        ? PolicyEnforcement.BLOCKED
        : PolicyEnforcement.SANITIZED;

    await this.prisma.messagePolicyHit.create({
      data: {
        id: randomUUID(),
        userId: options.userId,
        chatId: options.chatId,
        bookingId: options.bookingId,
        disputeId: options.disputeId,
        type: detection.type,
        hashedMatch,
        enforcement,
        source: options.source,
      },
    });

    contactLeakPolicyCounter.inc({ type: detection.type });

    this.logger.warn(
      `[ContactLeakPolicy] hit user=${options.userId} source=${options.source} type=${detection.type} enforcement=${enforcement}`,
    );

    if (enforcement === PolicyEnforcement.SANITIZED) {
      await this.notificationsService.createNotification({
        userId: options.userId,
        type: 'POLICY_WARNING',
        title: 'Conteúdo removido',
        message:
          'Seu texto continha informações de contato e foi substituído por segurança.',
        category: 'policy',
        relatedId: options.chatId || options.disputeId || options.bookingId,
        payload: {
          chatId: options.chatId,
          disputeId: options.disputeId,
          bookingId: options.bookingId,
          leakType: detection.type,
        },
      });
    } else {
      await this.notificationsService.createNotification({
        userId: 'ADMIN_USER_ID',
        type: 'POLICY_BLOCKED',
        title: 'Mensagem bloqueada por leak',
        message: `Mensagem bloqueada de ${options.userId} (${detection.type}).`,
        category: 'policy',
        targetUrl: '/app/support/policy-review',
        payload: {
          chatId: options.chatId,
          disputeId: options.disputeId,
          bookingId: options.bookingId,
          leakType: detection.type,
          enforcement,
        },
      });
    }

    return {
      enforcement,
      type: detection.type,
    };
  }
}
