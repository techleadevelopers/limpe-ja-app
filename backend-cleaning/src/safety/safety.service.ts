// backend-cleaning/src/safety/safety.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportPanicDto } from './dto/report-panic.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { NotificationsService } from '../notifications/notifications.service'; // Assuming NotificationsService
import { EmailService } from '../email/email.service'; // Assuming EmailService
import { SmsService } from '../sms/sms.service'; // Assuming SmsService
import { QueuesService } from '../queues/queues.service'; // Assuming QueuesService for BullMQ

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private smsService: SmsService,
    private queuesService: QueuesService, // For async processing
  ) {}

  async reportPanic(userId: string, reportPanicDto: ReportPanicDto) {
    const { latitude, longitude, message, type } = reportPanicDto;

    const panicAlert = await this.prisma.panicAlert.create({
      data: {
        userId,
        latitude: new this.prisma.Decimal(latitude),
        longitude: new this.prisma.Decimal(longitude),
        message,
        status: 'ACTIVE', // Initial status
      },
    });

    // Notify administrators/security team immediately
    // This should ideally be handled by a dedicated emergency response system
    const adminUsers = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    const notificationPromises = adminUsers.map(admin =>
      this.notificationsService.sendPushNotification(
        admin.id,
        'ALERTA DE PÂNICO!',
        `Usuário ${userId} acionou o botão de pânico em ${latitude}, ${longitude}. Tipo: ${type}. Mensagem: ${message || 'N/A'}`,
        { type: 'panic_alert', panicAlertId: panicAlert.id }
      )
    );
    // Also send email/SMS to critical personnel
    await Promise.all([
      this.emailService.sendPanicAlertEmail(panicAlert),
      this.smsService.sendPanicAlertSms(panicAlert),
      ...notificationPromises,
    ]);

    // Add to a queue for further processing (e.g., initiating investigation workflow)
    await this.queuesService.addJob('panic-alert-processing', { panicAlertId: panicAlert.id });

    return { message: 'Alerta de pânico registrado e equipe notificada.' };
  }

  async reportIncident(reporterId: string, reportIncidentDto: ReportIncidentDto) {
    const { type, description, bookingId, involvedUsers, attachments } = reportIncidentDto;

    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new BadRequestException('Booking ID provided is invalid.');
      }
    }

    const incident = await this.prisma.incident.create({
      data: {
        reporterId,
        type,
        description,
        bookingId,
        attachments: attachments || [],
        status: 'PENDING_REVIEW',
        // involvedUsers: involvedUsers || [], // If you add this field to the schema
      },
    });

    // Notify relevant parties (e.g., admin, involved users if applicable)
    await this.queuesService.addJob('incident-processing', { incidentId: incident.id });

    return incident;
  }

  async getIncidentsForUser(userId: string) {
    return this.prisma.incident.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIncidentStatus(id: string, updateIncidentDto: UpdateIncidentDto, adminId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found.`);
    }

    const updatedIncident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: updateIncidentDto.status,
        resolution: updateIncidentDto.resolution,
        resolvedBy: updateIncidentDto.status === 'RESOLVED' ? adminId : undefined,
        resolvedAt: updateIncidentDto.status === 'RESOLVED' ? new Date() : undefined,
      },
    });

    // Notify reporter about status update
    await this.notificationsService.sendPushNotification(
      updatedIncident.reporterId,
      'Atualização do Relatório de Incidente',
      `Seu incidente (${updatedIncident.type}) foi atualizado para: ${updatedIncident.status}.`,
      { type: 'incident_update', incidentId: updatedIncident.id }
    );
    await this.emailService.sendIncidentStatusUpdateEmail(updatedIncident);

    return updatedIncident;
  }
}