// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PixKeyType } from '@prisma/client'; // FIX: Import PixKeyType from Prisma client

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
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
      throw error;
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

    const reporterUser = await this.prisma.user.findUnique({
        where: { id: incident.reporterId },
        select: { email: true }
    });

    if (reporterUser?.email) {
        await this.sendEmail(reporterUser.email, subject, text, html);
    } else {
        this.logger.warn(`Não foi possível encontrar o e-mail do reporterId ${incident.reporterId} para enviar atualização de incidente.`);
    }
  }

  /**
   * NEW: Envia um e-mail para o provedor informando que o saque foi solicitado.
   * @param recipientEmail E-mail do provedor.
   * @param recipientName Nome do provedor.
   * @param amount Valor do saque.
   * @param pixKeyType Tipo da chave PIX.
   * @param pixKey Chave PIX.
   * @param transactionId ID da transação de saque.
   */
  async sendWithdrawalRequestedEmail(
    recipientEmail: string,
    recipientName: string,
    amount: string,
    pixKeyType: PixKeyType,
    pixKey: string,
    transactionId: string,
  ): Promise<void> {
    const subject = `LimpeJá: Sua solicitação de saque de R$ ${amount} foi recebida!`;
    const text = `Olá ${recipientName},Sua solicitação de saque de R$ ${amount} para a chave PIX ${pixKeyType}: ${pixKey} foi recebida com sucesso (ID da Transação: ${transactionId}).O valor estará disponível em breve. Você pode acompanhar o status na seção "Ganhos" do aplicativo.Atenciosamente,Equipe LimpeJá`;
    const html = `<p>Olá <strong>${recipientName}</strong>,</p>
                  <p>Sua solicitação de saque de <strong>R$ ${amount}</strong> para a chave PIX <strong>${pixKeyType}</strong>: <strong>${pixKey}</strong> foi recebida com sucesso (ID da Transação: ${transactionId}).</p>
                  <p>O valor estará disponível em breve. Você pode acompanhar o status na seção "Ganhos" do aplicativo.</p>
                  <p>Atenciosamente,<br>Equipe LimpeJá</p>`;
    await this.sendEmail(recipientEmail, subject, text, html);
  }

  /**
   * NEW: Envia um e-mail para o provedor informando que o saque foi concluído.
   * @param recipientEmail E-mail do provedor.
   * @param recipientName Nome do provedor.
   * @param amount Valor do saque.
   * @param pixKeyType Tipo da chave PIX.
   * @param pixKey Chave PIX.
   * @param transactionId ID da transação de saque.
   */
  async sendWithdrawalCompletedEmail(
    recipientEmail: string,
    recipientName: string,
    amount: string,
    pixKeyType: PixKeyType,
    pixKey: string,
    transactionId: string,
  ): Promise<void> {
    const subject = `LimpeJá: Seu saque de R$ ${amount} foi concluído!`;
    const text = `Olá ${recipientName},Seu saque de R$ ${amount} (ID da Transação: ${transactionId}) foi concluído com sucesso e o valor foi transferido para sua chave PIX ${pixKeyType}: ${pixKey}. Verifique seu extrato bancário.Atenciosamente,Equipe LimpeJá`;
    const html = `<p>Olá <strong>${recipientName}</strong>,</p>
                  <p>Seu saque de <strong>R$ ${amount}</strong> (ID da Transação: ${transactionId}) foi concluído com sucesso e o valor foi transferido para sua chave PIX <strong>${pixKeyType}</strong>: <strong>${pixKey}</strong>. Verifique seu extrato bancário.</p>
                  <p>Atenciosamente,<br>Equipe LimpeJá</p>`;
    await this.sendEmail(recipientEmail, subject, text, html);
  }

  /**
   * NEW: Envia um e-mail para o provedor informando que o saque falhou.
   * @param recipientEmail E-mail do provedor.
   * @param recipientName Nome do provedor.
   * @param amount Valor do saque.
   * @param pixKeyType Tipo da chave PIX.
   * @param pixKey Chave PIX.
   * @param transactionId ID da transação de saque.
   * @param reason Motivo da falha.
   */
  async sendWithdrawalFailedEmail(
    recipientEmail: string,
    recipientName: string,
    amount: string,
    pixKeyType: PixKeyType,
    pixKey: string,
    transactionId: string,
    reason: string,
  ): Promise<void> {
    const subject = `LimpeJá: Seu saque de R$ ${amount} falhou!`;
    const text = `Olá ${recipientName},Lamentamos informar que seu saque de R$ ${amount} (ID da Transação: ${transactionId}) para a chave PIX ${pixKeyType}: ${pixKey} falhou.Motivo da falha: ${reason}Por favor, verifique os dados da sua chave PIX e tente novamente, ou entre em contato com nosso suporte para mais informações.Atenciosamente,Equipe LimpeJá`;
    const html = `<p>Olá <strong>${recipientName}</strong>,</p>
                  <p>Lamentamos informar que seu saque de <strong>R$ ${amount}</strong> (ID da Transação: ${transactionId}) para a chave PIX <strong>${pixKeyType}</strong>: <strong>${pixKey}</strong> falhou.</p>
                  <p><strong>Motivo da falha:</strong> ${reason}</p>
                  <p>Por favor, verifique os dados da sua chave PIX e tente novamente, ou entre em contato com nosso suporte para mais informações.</p>
                  <p>Atenciosamente,<br>Equipe LimpeJá</p>`;
    await this.sendEmail(recipientEmail, subject, text, html);
  }

  /**
   * NEW: Envia um e-mail de alerta para a equipe administrativa sobre um saque falho.
   * @param subject Assunto do e-mail de alerta.
   * @param text Conteúdo do e-mail em texto puro.
   * @param html Conteúdo do e-mail em HTML.
   */
  async sendAdminWithdrawalFailedEmail(subject: string, text: string, html: string): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL'); // Assumindo que ADMIN_EMAIL está configurado
    if (adminEmail) {
      await this.sendEmail(adminEmail, subject, text, html);
    } else {
      this.logger.warn('ADMIN_EMAIL não configurado para enviar alertas de saque falho.');
    }
  }
}