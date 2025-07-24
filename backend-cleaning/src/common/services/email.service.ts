// src/common/services/email.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer'; // Exemplo para SMTP
// import * as sgMail from '@sendgrid/mail'; // Exemplo para SendGrid

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private emailProvider: string;
  private defaultFromEmail: string;
  // private transporter; // Para Nodemailer
  // private sendgridApiKey: string; // Para SendGrid

  constructor(private configService: ConfigService) {
    this.emailProvider = this.configService.get<string>('email.provider');
    this.defaultFromEmail = this.configService.get<string>('email.defaultFrom');

    if (!this.defaultFromEmail) {
      this.logger.error('DEFAULT_EMAIL_FROM não configurado. O serviço de e-mail pode não funcionar corretamente.');
      this.defaultFromEmail = 'noreply@example.com'; // Fallback
    }

    // Configuração para provedores reais (descomente e configure conforme necessário)
    // switch (this.emailProvider) {
    //   case 'SMTP':
    //     this.transporter = nodemailer.createTransport({
    //       host: this.configService.get<string>('email.smtpHost'),
    //       port: this.configService.get<number>('email.smtpPort'),
    //       secure: this.configService.get<number>('email.smtpPort') === 465, // true for 465, false for other ports
    //       auth: {
    //         user: this.configService.get<string>('email.smtpUser'),
    //         pass: this.configService.get<string>('email.smtpPass'),
    //       },
    //     });
    //     this.logger.log('Serviço de e-mail configurado para SMTP.');
    //     break;
    //   case 'SENDGRID':
    //     this.sendgridApiKey = this.configService.get<string>('email.sendgridApiKey');
    //     if (this.sendgridApiKey) {
    //       sgMail.setApiKey(this.sendgridApiKey);
    //       this.logger.log('Serviço de e-mail configurado para SendGrid.');
    //     } else {
    //       this.logger.error('SENDGRID_API_KEY não configurada. SendGrid não funcionará.');
    //     }
    //     break;
    //   default:
    //     this.logger.warn('Nenhum provedor de e-mail real configurado. O serviço de e-mail estará em modo de simulação.');
    // }
  }

  /**
   * Envia um e-mail para um destinatário.
   * @param to Destinatário do e-mail.
   * @param subject Assunto do e-mail.
   * @param text Conteúdo do e-mail em texto puro.
   * @param html Conteúdo do e-mail em HTML (opcional).
   */
  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    const mailOptions = {
      from: this.defaultFromEmail,
      to,
      subject,
      text,
      html,
    };

    try {
      switch (this.emailProvider) {
        // case 'SMTP':
        //   await this.transporter.sendMail(mailOptions);
        //   this.logger.log(`Email enviado para ${to} via SMTP.`);
        //   break;
        // case 'SENDGRID':
        //   await sgMail.send(mailOptions);
        //   this.logger.log(`Email enviado para ${to} via SendGrid.`);
        //   break;
        default:
          this.simulateSendEmail(mailOptions);
          break;
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail para ${to}: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao enviar e-mail: ${error.message}`);
    }
  }

  private simulateSendEmail(mailOptions: any): void {
    this.logger.warn('Simulando envio de e-mail. Nenhuma integração real configurada.');
    this.logger.debug(`
      --- SIMULAÇÃO DE E-MAIL ---
      De: ${mailOptions.from}
      Para: ${mailOptions.to}
      Assunto: ${mailOptions.subject}
      Corpo (Texto):
      ${mailOptions.text}
      ---------------------------
    `);
  }
}