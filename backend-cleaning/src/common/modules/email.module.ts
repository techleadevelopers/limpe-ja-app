import { Module } from '@nestjs/common';
import { EmailService } from '../services/email.service'; // Importa o serviço real
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule se o EmailService depender dele

@Module({
  imports: [ConfigModule], // O EmailService usa ConfigService, então ConfigModule é necessário aqui
  providers: [EmailService], // Declara EmailService como um provider deste módulo
  exports: [EmailService], // Exporta EmailService para que outros módulos possam injetá-lo
})
export class EmailModule {}
