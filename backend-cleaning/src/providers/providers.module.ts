// src/providers/providers.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProvidersController } from './providers.controller';
import { VerificationModule } from '../verification/verification.module';
import { CacheModule } from '../cache/cache.module';
import { DocumentProcessingModule } from '../document-processing/document-processing.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => VerificationModule),
    CacheModule,
    DocumentProcessingModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService], // <-- ESSA LINHA JÁ GARANTE QUE O SERVIÇO É EXPORTADO
})
export class ProvidersModule {}
