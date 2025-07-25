// src/sms/sms.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly twilioClient: twilio.Twilio;
  private readonly twilioVerifyServiceSid: string;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioVerifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    // Apenas TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_VERIFY_SERVICE_SID são obrigatórios para a inicialização do serviço.
    if (!accountSid || !authToken || !this.twilioVerifyServiceSid) {
      this.logger.error('Missing Twilio credentials. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in .env');
      throw new InternalServerErrorException('Twilio credentials are not configured.');
    }
    this.twilioClient = twilio(accountSid, authToken);
  }

  async sendSms(to: string, message: string): Promise<void> {
    // twilioFromNumber é necessário apenas para o método sendSms, não para o Verify
    const twilioFromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    // Verifica se twilioFromNumber está configurado apenas quando o método sendSms é chamado
    if (!twilioFromNumber) {
      this.logger.error('TWILIO_PHONE_NUMBER is not configured. Cannot send SMS.');
      throw new InternalServerErrorException('Twilio phone number is not configured for sending SMS.');
    }
    try {
      await this.twilioClient.messages.create({
        body: message,
        to: to,
        from: twilioFromNumber,
      });
      this.logger.log(`SMS sent to ${to}: "${message}"`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao enviar SMS. Por favor, tente novamente mais tarde.');
    }
  }

  async startVerification(to: string, channel: 'sms' | 'call' = 'sms'): Promise<void> {
    try {
      await this.twilioClient.verify.v2.services(this.twilioVerifyServiceSid)
        .verifications
        .create({ to: to, channel: channel });
      this.logger.log(`Verification started for ${to} via ${channel}.`);
    } catch (error) {
      this.logger.error(`Failed to start verification for ${to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao iniciar verificação. Por favor, tente novamente mais tarde.');
    }
  }

  async checkVerification(to: string, code: string): Promise<boolean> {
    try {
      const verificationCheck = await this.twilioClient.verify.v2.services(this.twilioVerifyServiceSid)
        .verificationChecks
        .create({ to: to, code: code });
      if (verificationCheck.status === 'approved') {
        this.logger.log(`Verification successful for ${to}.`);
        return true;
      } else {
        this.logger.warn(`Verification failed for ${to}. Status: ${verificationCheck.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to check verification for ${to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao verificar código. Por favor, tente novamente mais tarde.');
    }
  }
}
