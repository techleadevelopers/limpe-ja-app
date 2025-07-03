// src/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module'; // Certifique-se de que ProvidersModule está importado
import { BookingsModule } from '../bookings/bookings.module'; // Importar BookingsModule

@Module({
  imports: [
    PrismaModule,
    ProvidersModule, // ProvidersModule é necessário para ProvidersService em PaymentsService
    forwardRef(() => BookingsModule), // ESSENCIAL: Permite a injeção de BookingsService e resolve dependências circulares
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService], // Exportar PaymentsService se outros módulos o usarem
})
export class PaymentsModule {}
