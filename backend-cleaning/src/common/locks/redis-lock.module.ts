// src/common/locks/redis-lock.module.ts (Exemplo)
import { Module } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';

@Module({
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class RedisLockModule {}