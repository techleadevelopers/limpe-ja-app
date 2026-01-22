// backend-cleaning/src/safety/safety.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReportPanicDto } from './dto/report-panic.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { QueuesService } from '../queues/queues.service';
import { Decimal } from '@prisma/client/runtime/library'; // Importação correta para Decimal
import { IncidentStatus } from './entities/incident.entity';

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private smsService: SmsService,
    private queuesService: QueuesService,
  ) {}

  async reportPanic(userId: string, reportPanicDto: ReportPanicDto) {
    const { latitude, longitude, message, type } = reportPanicDto;

    const panicAlert = await this.prisma.panicAlert.create({
      data: {
        userId,
        latitude: new Decimal(latitude),
        longitude: new Decimal(longitude),
        message,
        status: 'ACTIVE', // Initial status
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }, // CORRIGIDO: Usando 'phone' conforme o schema.prisma
    });

    // Notify administrators/security team immediately
    const adminUsers = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    const notificationPromises = adminUsers.map((admin) =>
      this.notificationsService.sendPushNotification(
        admin.id,
        'ALERTA DE PÂNICO!',
        `Usuário ${userId} acionou o botão de pânico em ${latitude}, ${longitude}. Tipo: ${type}. Mensagem: ${message || 'N/A'}`,
        { type: 'panic_alert', panicAlertId: panicAlert.id },
      ),
    );

    const smsPromise =
      user && user.phone
        ? this.smsService.sendPanicAlertSms(
            user.phone,
            panicAlert.message || 'Alerta de pânico sem mensagem específica.',
          )
        : Promise.resolve(
            console.warn(
              `[SafetyService] Não foi possível enviar SMS de pânico para o usuário ${userId}: número de telefone não encontrado.`,
            ),
          );

    await Promise.all([
      this.emailService.sendPanicAlertEmail(panicAlert),
      smsPromise,
      ...notificationPromises,
    ]);

    // Usando a fila 'verification' e adicionando o jobName 'process-panic-alert'
    await this.queuesService.addJob('verification', 'process-panic-alert', {
      panicAlertId: panicAlert.id,
    });

    return { message: 'Alerta de pânico registrado e equipe notificada.' };
  }

  async reportIncident(
    reporterId: string,
    reportIncidentDto: ReportIncidentDto,
  ) {
    const { type, description, bookingId, attachments } = reportIncidentDto;

    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BadRequestException('Booking ID provided is invalid.');
      }
    }

    const incident = await this.prisma.incident.create({
      // Assumindo que 'incident' é o nome do modelo no Prisma
      data: {
        reporterId,
        type,
        description,
        bookingId,
        attachments: attachments || [],
        status: 'PENDING_REVIEW',
        // involvedUsers: involvedUsers || [], // Se você adicionar este campo ao schema
      },
    });

    // Usando a fila 'disputes' e adicionando o jobName 'process-incident-report'
    await this.queuesService.addJob('disputes', 'process-incident-report', {
      incidentId: incident.id,
    });

    return incident;
  }

  async getIncidentsForUser(userId: string) {
    return this.prisma.incident.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });
  }

  /**
   * NOVO MÉTODO: Lista todos os incidentes de segurança.
   * Destinado a administradores.
   * @returns Lista de todos os incidentes.
   */
  async listAllIncidents() {
    return this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
      // Opcional: Inclua dados relacionados se necessário para a visualização do administrador
      // include: {
      //   reporter: { select: { id: true, fullName: true, email: true } },
      //   booking: { select: { id: true, scheduledDate: true, totalPrice: true } },
      // },
    });
  }

  async updateIncidentStatus(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
    adminId: string,
  ) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found.`);
    }

    const updatedIncident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: updateIncidentDto.status,
        resolution: updateIncidentDto.resolution,
        resolvedBy:
          updateIncidentDto.status === IncidentStatus.RESOLVED
            ? adminId
            : undefined,
        resolvedAt:
          updateIncidentDto.status === IncidentStatus.RESOLVED
            ? new Date()
            : undefined,
      },
    });

    await this.notificationsService.sendPushNotification(
      updatedIncident.reporterId,
      'Atualização do Relatório de Incidente',
      `Seu incidente (${updatedIncident.type}) foi atualizado para: ${updatedIncident.status}.`,
      { type: 'incident_update', incidentId: updatedIncident.id },
    );
    await this.emailService.sendIncidentStatusUpdateEmail(updatedIncident);

    return updatedIncident;
  }

  // Admin: listar alertas de pânico (opcionalmente por status)

  async listPanicAlerts(status?: string) {
    return this.prisma.panicAlert.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });
  }

  async countPendingSafetyAlerts(): Promise<number> {
    const [panicCount, incidentCount] = await Promise.all([
      this.prisma.panicAlert.count({ where: { status: 'ACTIVE' } }),
      this.prisma.incident.count({
        where: { status: IncidentStatus.PENDING_REVIEW },
      }),
    ]);
    return panicCount + incidentCount;
  }

  async updatePanicAlertStatus(id: string, status: string) {
    const alert = await this.prisma.panicAlert.findUnique({ where: { id } });
    if (!alert)
      throw new NotFoundException(`PanicAlert with ID ${id} not found.`);
    return this.prisma.panicAlert.update({ where: { id }, data: { status } });
  }
}
