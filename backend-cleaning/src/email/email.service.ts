// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Para acessar variáveis de ambiente

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Exemplo de como acessar uma variável de ambiente
    const mailgunApiKey = this.configService.get<string>('MAILGUN_API_KEY');
    if (!mailgunApiKey) {
      this.logger.warn('MAILGUN_API_KEY não configurada. O envio de e-mails pode não funcionar.');
    }
  }

  /**
   * Método genérico para enviar e-mails.
   * Você precisará implementar a lógica de integração com um provedor de e-mail (ex: Nodemailer, SendGrid).
   * @param to Destinatário do e-mail
   * @param subject Assunto do e-mail
   * @param text Conteúdo do e-mail em texto puro
   * @param html Conteúdo do e-mail em HTML
   */
  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    try {
      // TODO: Implementar a lógica real de envio de e-mail aqui
      // Exemplo com Nodemailer (requer instalação e configuração):
      /*
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('EMAIL_HOST'),
        port: this.configService.get<number>('EMAIL_PORT'),
        secure: this.configService.get<boolean>('EMAIL_SECURE'), // true for 465, false for other ports
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
      });

      await transporter.sendMail({
        from: '"Limpeja" <noreply@limpeja.com>', // Remetente
        to: to,
        subject: subject,
        text: text,
        html: html,
      });
      */
      this.logger.log(`E-mail enviado para: ${to}, Assunto: ${subject}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${error.message}`, error.stack);
      throw error; // Re-lança o erro para que o chamador possa tratá-lo
    }
  }

  /**
   * Envia um e-mail de alerta de pânico.
   * @param panicAlert Objeto com os detalhes do alerta de pânico.
   */
  async sendPanicAlertEmail(panicAlert: any): Promise<void> {
    const subject = 'ALERTA DE PÂNICO REGISTRADO!';
    const text = `Um alerta de pânico foi acionado pelo usuário ${panicAlert.userId} em ${panicAlert.latitude}, ${panicAlert.longitude}. Mensagem: ${panicAlert.message || 'N/A'}.`;
    const html = `<p>Um alerta de pânico foi acionado pelo usuário <strong>${panicAlert.userId}</strong> em ${panicAlert.latitude}, ${panicAlert.longitude}.</p><p>Mensagem: ${panicAlert.message || 'N/A'}.</p>`;

    // TODO: Definir para quem este e-mail deve ser enviado (ex: administradores)
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (adminEmail) {
      await this.sendEmail(adminEmail, subject, text, html);
    } else {
      this.logger.warn('ADMIN_EMAIL não configurado para enviar alertas de pânico.');
    }
  }

  /**
   * Envia um e-mail de atualização de status de incidente.
   * @param incident Objeto com os detalhes do incidente atualizado.
   */
  async sendIncidentStatusUpdateEmail(incident: any): Promise<void> {
    const subject = `Atualização do Incidente #${incident.id}: ${incident.status}`;
    const text = `Seu incidente (${incident.type}) foi atualizado para: ${incident.status}. Resolução: ${incident.resolutionNotes || 'N/A'}.`;
    const html = `<p>Seu incidente (<strong>${incident.type}</strong>) foi atualizado para: <strong>${incident.status}</strong>.</p><p>Resolução: ${incident.resolutionNotes || 'N/A'}.</p>`;

    // TODO: Definir para quem este e-mail deve ser enviado (ex: o próprio reporterId)
    // Para isso, você precisaria buscar o e-mail do usuário pelo incident.reporterId
    const reporterUser = await this.configService.get('prisma').user.findUnique({
        where: { id: incident.reporterId },
        select: { email: true }
    });

    if (reporterUser?.email) {
        await this.sendEmail(reporterUser.email, subject, text, html);
    } else {
        this.logger.warn(`Não foi possível encontrar o e-mail do reporterId ${incident.reporterId} para enviar atualização de incidente.`);
    }
  }
}