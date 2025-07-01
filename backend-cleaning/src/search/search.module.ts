import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ProvidersModule } from '../providers/providers.module'; // Importa o módulo de provedores
import { ServicesModule } from '../services/services.module';   // Importa o módulo de tipos de serviço
import { OffersModule } from '../offers/offers.module'; // Importa o módulo de ofertas

@Module({
  imports: [
    ProvidersModule,
    ServicesModule,
    OffersModule, // Se houver um módulo de ofertas e você quiser buscar ofertas
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}