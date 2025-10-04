import { Module, forwardRef } from '@nestjs/common';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { PrismaModule } from '../prisma/prisma.module'; // Já está aqui, o que é bom!
import { ProvidersModule } from '../providers/providers.module'; // <<<< NOVO: Importe o ProvidersModule
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    PrismaModule,
    ProvidersModule, // <<<< Adicione ProvidersModule aqui
    forwardRef(() => PayoutsModule),
  ],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService], // Exporta o serviço caso outros módulos (ex: Dashboard) precisem dele
})
export class EarningsModule {}
