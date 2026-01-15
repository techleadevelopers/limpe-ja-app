// src/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { ProvidersModule } from '../providers/providers.module';
import { AvailabilityModule } from '../availability/availability.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueuesModule } from '../queues/queues.module';
import { PricingModule } from '../pricing/pricing.module';
import { CouponsModule } from '../coupons/coupons.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MissionsModule } from '../missions/missions.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { RedisLockModule } from '../common/locks/redis-lock.module'; // NOVO: Importar RedisLockModule
import { I18nModule } from '../common/i18n/i18n.module'; // NOVO: Importar I18nModule
import { CacheModule } from '../cache/cache.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    PrismaModule,
    AvailabilityModule,
    ClientsModule,
    ProvidersModule,
    ProviderServicesModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    forwardRef(() => QueuesModule),
    forwardRef(() => PricingModule),
    forwardRef(() => CouponsModule),
    InsuranceModule,
    LoyaltyModule,
    forwardRef(() => MissionsModule),
    forwardRef(() => ReferralsModule),
    RedisLockModule, // NOVO: Adicionar RedisLockModule
    CacheModule,
    ServicesModule,
    I18nModule, // NOVO: Adicionar I18nModule
    SchedulerModule,
    ComplianceModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
