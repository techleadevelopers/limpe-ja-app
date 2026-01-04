// src/common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { I18nService } from './i18n/i18n.service';
import { APP_FILTER } from '@nestjs/core';
import { LocaleMiddleware } from './middlewares/locale.middleware';
import { ContactLeakDetector } from './services/contact-leak-detector.service';
import { ContactLeakPolicyService } from './services/contact-leak-policy.service';

@Global() // Torna este módulo globalmente disponível
@Module({
  providers: [
    I18nService,
    {
      provide: APP_FILTER, // Registra o filtro de exceções globalmente
      useClass: AllExceptionsFilter,
    },
    ContactLeakDetector,
    ContactLeakPolicyService,
  ],
  exports: [I18nService, ContactLeakDetector, ContactLeakPolicyService], // Exporta serviços para reuso
})
export class CommonModule {}
