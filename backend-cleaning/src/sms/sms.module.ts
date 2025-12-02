// src/sms/sms.module.ts
import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Importa ConfigModule para acessar variáveis de ambiente
  providers: [SmsService],
  exports: [SmsService], // Exporta SmsService para que outros módulos possam injetá-lo
})
export class SmsModule {}
