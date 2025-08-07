// backend-cleaning/src/safety/safety.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportPanicDto } from './dto/report-panic.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { NotificationsService } from '../notifications/notifications.service'; // Assuming NotificationsService
import { EmailService } from '../email/email.service'; // Assuming EmailService - VERIFIQUE O CAMINHO E EXISTÊNCIA
import { SmsService } from '../sms/sms.service'; // Assuming SmsService
import { QueuesService } from '../queues/queues.service'; // Assuming QueuesService for BullMQ
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService, // VERIFIQUE SE ESTE SERVIÇO ESTÁ CORRETAMENTE IMPLEMENTADO
    private smsService: SmsService,
    private queuesService: QueuesService, // For async processing
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

    // --- INÍCIO DA CORREÇÃO PARA OS ERROS DE 'phoneNumber' ---
    // O campo no seu schema.prisma é 'phone', não 'phoneNumber'.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true } // CORRIGIDO: Usando 'phone' conforme o schema.prisma
    });
    // --- FIM DA CORREÇÃO PARA OS ERROS DE 'phoneNumber' ---

    // Notify administrators/security team immediately
    // This should ideally be handled by a dedicated emergency response system
    const adminUsers = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    const notificationPromises = adminUsers.map(admin =>
      // CORREÇÃO: Assumindo que NotificationsService.sendPushNotification existe
      this.notificationsService.sendPushNotification(
        admin.id,
        'ALERTA DE PÂNICO!',
        `Usuário ${userId} acionou o botão de pânico em ${latitude}, ${longitude}. Tipo: ${type}. Mensagem: ${message || 'N/A'}`,
        { type: 'panic_alert', panicAlertId: panicAlert.id }
      )
    );
    // Also send email/SMS to critical personnel
    // --- INÍCIO DA CORREÇÃO PARA OS ERROS DE 'phoneNumber' ---
    // Garante que o SMS só é enviado se houver um número de telefone válido.
    const smsPromise = user && user.phone // CORRIGIDO: Usando 'user.phone'
      ? this.smsService.sendPanicAlertSms(user.phone, panicAlert.message || 'Alerta de pânico sem mensagem específica.') // Corrigido: Passa o número de telefone e a mensagem
      : Promise.resolve(console.warn(`[SafetyService] Não foi possível enviar SMS de pânico para o usuário ${userId}: número de telefone não encontrado.`));
    // --- FIM DA CORREÇÃO PARA OS ERROS DE 'phoneNumber' ---

    await Promise.all([
      this.emailService.sendPanicAlertEmail(panicAlert), // VERIFIQUE SE ESTE MÉTODO EXISTE NO EmailService
      smsPromise, // Aguarda a promessa do SMS
      ...notificationPromises,
    ]);

    // Add to a queue for further processing (e.g., initiating investigation workflow)
    // O método addJob espera (queueName: string, jobName: string, data: T, options?: ...).
    // Estava faltando o 'jobName' (segundo argumento).
    // ATENÇÃO: 'panic-alert-processing' não é uma fila definida no seu QueuesService.
    // Mudei para 'verification' que é uma fila existente. Se você quiser 'panic-alert-processing',
    // você precisa adicioná-la ao QueuesService (construtor e switch case).
    await this.queuesService.addJob('verification', 'process-panic-alert', { panicAlertId: panicAlert.id });

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
    // O método addJob espera (queueName: string, jobName: string, data: T, options?: ...).
    // Estava faltando o 'jobName' (segundo argumento).
    // ATENÇÃO: 'incident-processing' não é uma fila definida no seu QueuesService.
    // Mudei para 'disputes' que é uma fila existente. Se você quiser 'incident-processing',
    // você precisa adicioná-la ao QueuesService (construtor e switch case).
    await this.queuesService.addJob('disputes', 'process-incident-report', { incidentId: incident.id });

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
    // CORREÇÃO: Assumindo que NotificationsService.sendPushNotification existe
    await this.notificationsService.sendPushNotification(
      updatedIncident.reporterId,
      'Atualização do Relatório de Incidente',
      `Seu incidente (${updatedIncident.type}) foi atualizado para: ${updatedIncident.status}.`,
      { type: 'incident_update', incidentId: updatedIncident.id }
    );
    this.emailService.sendIncidentStatusUpdateEmail(updatedIncident); // VERIFIQUE SE ESTE MÉTODO EXISTE NO EmailService

    return updatedIncident;
  }
}