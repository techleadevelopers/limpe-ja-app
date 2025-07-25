// src/sms/sms.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio'; // Importa Twilio

@Injectable()
export class SmsService {
  private readonly twilioClient: twilio.Twilio;
  private readonly twilioFromNumber: string;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioFromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !this.twilioFromNumber) {
      this.logger.error('Missing Twilio credentials. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in .env');
      throw new InternalServerErrorException('Twilio credentials are not configured.');
    }
    this.twilioClient = twilio(accountSid, authToken);
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        to: to, // Número de telefone no formato E.164 (ex: +5511999999999)
        from: this.twilioFromNumber, // Seu número Twilio
      });
      this.logger.log(`SMS sent to ${to}: "${message}"`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao enviar SMS. Por favor, tente novamente mais tarde.');
    }
  }
}