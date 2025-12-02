// src/sms/sms.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly twilioClient: twilio.Twilio;
  private readonly twilioVerifyServiceSid: string;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('sms.twilioAccountSid');
    const authToken = this.configService.get<string>('sms.twilioAuthToken');
    this.twilioVerifyServiceSid = this.configService.get<string>(
      'sms.twilioVerifyServiceSid',
    );

    this.logger.log(`[SmsService] Lendo configurações do Twilio:`);
    this.logger.log(
      `[SmsService]   Account SID: ${accountSid ? 'Configurado' : 'NÃO CONFIGURADO'}`,
    );
    this.logger.log(
      `[SmsService]   Auth Token: ${authToken ? 'Configurado' : 'NÃO CONFIGURADO'}`,
    );
    this.logger.log(
      `[SmsService]   Verify Service SID: ${this.twilioVerifyServiceSid ? 'Configurado' : 'NÃO CONFIGURADO'}`,
    );

    if (!accountSid || !authToken || !this.twilioVerifyServiceSid) {
      this.logger.error(
        'Missing Twilio credentials. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your .env or configuration.',
      );
      throw new InternalServerErrorException(
        'Twilio credentials are not configured.',
      );
    }
    this.twilioClient = twilio(accountSid, authToken);
    this.logger.log('[SmsService] Twilio client inicializado com sucesso.');
  }

  async sendSms(to: string, message: string): Promise<void> {
    const twilioFromNumber = this.configService.get<string>(
      'sms.twilioPhoneNumber',
    );

    if (!twilioFromNumber) {
      this.logger.error(
        'TWILIO_PHONE_NUMBER (sms.twilioPhoneNumber) is not configured. Cannot send traditional SMS.',
      );
      throw new InternalServerErrorException(
        'Twilio phone number is not configured for sending SMS.',
      );
    }
    this.logger.log(
      `[SmsService] Tentando enviar SMS tradicional para ${to} de ${twilioFromNumber}.`,
    );
    try {
      await this.twilioClient.messages.create({
        body: message,
        to: to,
        from: twilioFromNumber,
      });
      this.logger.log(`SMS sent to ${to}: "${message}"`);
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${to}: ${error.message}`,
        error.stack,
      );
      if (error.code) {
        this.logger.error(
          `[SmsService] Código de erro do Twilio: ${error.code}`,
        );
      }
      throw new InternalServerErrorException(
        'Falha ao enviar SMS. Por favor, tente novamente mais tarde.',
      );
    }
  }

  // NOVO MÉTODO: sendPanicAlertSms
  async sendPanicAlertSms(to: string, message: string): Promise<void> {
    const twilioFromNumber = this.configService.get<string>(
      'sms.twilioPhoneNumber',
    );

    if (!twilioFromNumber) {
      this.logger.error(
        'TWILIO_PHONE_NUMBER (sms.twilioPhoneNumber) is not configured. Cannot send panic alert SMS.',
      );
      throw new InternalServerErrorException(
        'Twilio phone number is not configured for sending panic alert SMS.',
      );
    }
    this.logger.warn(
      `[SmsService][ALERTA DE PÂNICO] Tentando enviar SMS de alerta para ${to} de ${twilioFromNumber}.`,
    );
    try {
      await this.twilioClient.messages.create({
        body: `ALERTA DE PÂNICO: ${message}`, // Adiciona um prefixo para destacar
        to: to,
        from: twilioFromNumber,
        // Você pode adicionar opções específicas para alertas de pânico aqui, se o Twilio suportar (ex: prioridade)
      });
      this.logger.warn(
        `[SmsService][ALERTA DE PÂNICO] SMS de alerta enviado para ${to}: "${message}"`,
      );
    } catch (error) {
      this.logger.error(
        `[SmsService][ALERTA DE PÂNICO] Falha ao enviar SMS de alerta para ${to}: ${error.message}`,
        error.stack,
      );
      if (error.code) {
        this.logger.error(
          `[SmsService][ALERTA DE PÂNICO] Código de erro do Twilio: ${error.code}`,
        );
      }
      throw new InternalServerErrorException(
        'Falha ao enviar SMS de alerta de pânico. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async startVerification(
    to: string,
    channel: 'sms' | 'call' = 'sms',
  ): Promise<void> {
    this.logger.log(
      `[SmsService] Iniciando verificação para ${to} via ${channel} usando Verify SID: ${this.twilioVerifyServiceSid}`,
    );
    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.twilioVerifyServiceSid)
        .verifications.create({ to: to, channel: channel });
      this.logger.log(
        `Verification started for ${to} via ${channel}. Twilio Response: ${JSON.stringify(verification)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start verification for ${to}: ${error.message}`,
        error.stack,
      );
      if (error.code) {
        this.logger.error(
          `[SmsService] Código de erro do Twilio: ${error.code}`,
        );
      }
      throw new InternalServerErrorException(
        'Falha ao iniciar verificação. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async checkVerification(to: string, code: string): Promise<boolean> {
    this.logger.log(
      `[SmsService] Verificando código ${code} para ${to} usando Verify SID: ${this.twilioVerifyServiceSid}`,
    );
    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.twilioVerifyServiceSid)
        .verificationChecks.create({ to: to, code: code });

      this.logger.log(
        `Verification check response for ${to}: ${JSON.stringify(verificationCheck)}`,
      );

      if (verificationCheck.status === 'approved') {
        this.logger.log(`Verification successful for ${to}.`);
        return true;
      } else {
        this.logger.warn(
          `Verification failed for ${to}. Status: ${verificationCheck.status}.`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to check verification for ${to}: ${error.message}`,
        error.stack,
      );
      if (error.code) {
        this.logger.error(
          `[SmsService] Código de erro do Twilio: ${error.code}`,
        );
      }
      throw new InternalServerErrorException(
        'Falha ao verificar código. Por favor, tente novamente mais tarde.',
      );
    }
  }
}
