// src/search/search.module.ts
import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ProvidersModule } from '../providers/providers.module';
import { ServicesModule } from '../services/services.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { OffersModule } from '../offers/offers.module';
import { PricingModule } from '../pricing/pricing.module'; // Importe o PricingModule

@Module({
  imports: [
    ProvidersModule,
    ServicesModule,
    ProviderServicesModule,
    OffersModule,
    PricingModule, // Adicione o PricingModule aqui
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
