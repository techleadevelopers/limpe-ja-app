// src/email/email.module.ts
import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config'; // Importe ConfigModule se for usar variáveis de ambiente

@Global() // Torna este módulo globalmente disponível, evitando importá-lo em cada módulo que o utiliza
@Module({
  imports: [ConfigModule], // Importe ConfigModule se EmailService usar ConfigService
  providers: [EmailService],
  exports: [EmailService], // Exporte EmailService para que outros módulos possam injetá-lo
})
export class EmailModule {}