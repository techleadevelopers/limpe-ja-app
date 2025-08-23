// src/common/locks/locks.module.ts

import { Module, Global } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';
import { ConfigModule } from '@nestjs/config';

@Global() // Torna o serviço disponível globalmente
@Module({
  imports: [ConfigModule], // Importa ConfigModule para acessar ConfigService
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class LocksModule {}