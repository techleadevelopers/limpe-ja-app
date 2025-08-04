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
    forwardRef(() => UsersModule), // Quebra a dependência circular com UsersModule
    forwardRef(() => VerificationModule), // Já estava com forwardRef
    CacheModule,
    DocumentProcessingModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}