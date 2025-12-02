// src/common/services/sms.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import twilio from 'twilio'; // Exemplo para Twilio

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private smsProvider: string;
  // private twilioClient: twilio.Twilio;
  // private twilioPhoneNumber: string;

  constructor(private configService: ConfigService) {
    this.smsProvider = this.configService.get<string>('sms.provider');

    // Configuração para provedores reais (descomente e configure conforme necessário)
    // switch (this.smsProvider) {
    //   case 'TWILIO':
    //     const accountSid = this.configService.get<string>('sms.twilioAccountSid');
    //     const authToken = this.configService.get<string>('sms.twilioAuthToken');
    //     this.twilioPhoneNumber = this.configService.get<string>('sms.twilioPhoneNumber');
    //     if (accountSid && authToken && this.twilioPhoneNumber) {
    //       this.twilioClient = twilio(accountSid, authToken);
    //       this.logger.log('Serviço de SMS configurado para Twilio.');
    //     } else {
    //       this.logger.error('Credenciais Twilio incompletas. Twilio não funcionará.');
    //     }
    //     break;
    //   default:
    //     this.logger.warn('Nenhum provedor de SMS real configurado. O serviço de SMS estará em modo de simulação.');
    // }
  }

  /**
   * Envia uma mensagem SMS para um número de telefone.
   * @param to Número de telefone do destinatário (formato internacional, ex: +5511987654321).
   * @param message Conteúdo da mensagem SMS.
   */
  async sendSms(to: string, message: string): Promise<void> {
    try {
      switch (this.smsProvider) {
        // case 'TWILIO':
        //   await this.twilioClient.messages.create({
        //     body: message,
        //     from: this.twilioPhoneNumber,
        //     to: to,
        //   });
        //   this.logger.log(`SMS enviado para ${to} via Twilio.`);
        //   break;
        default:
          this.simulateSendSms(to, message);
          break;
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar SMS para ${to}: ${error.message}`);
      throw new InternalServerErrorException(
        `Falha ao enviar SMS: ${error.message}`,
      );
    }
  }

  private simulateSendSms(to: string, message: string): void {
    this.logger.warn(
      'Simulando envio de SMS. Nenhuma integração real configurada.',
    );
    this.logger.debug(`
      --- SIMULAÇÃO DE SMS ---
      Para: ${to}
      Mensagem: ${message}
      ------------------------
    `);
  }
}
