// src/common/i18n/i18n.module.ts
import { Global, Module } from '@nestjs/common';
import { I18nService } from './i18n.service';

@Global() // <-- Torna disponível para toda a aplicação
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
