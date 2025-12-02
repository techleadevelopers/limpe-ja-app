// src/common/locks/redis-lock.service.ts

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly defaultTtlMs: number; // Default TTL in milliseconds

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in environment variables.');
    }
    this.redisClient = new Redis(redisUrl);
    this.defaultTtlMs = 5000; // Default lock duration: 5 seconds
  }

  /**
   * Adquire um lock distribuído no Redis.
   * @param key A chave do lock.
   * @param value O valor a ser armazenado no lock (e.g., um ID de transação).
   * @param ttlMs O tempo de vida do lock em milissegundos (opcional, padrão 5s).
   * @returns true se o lock foi adquirido, false caso contrário.
   */
  async acquireLock(
    key: string,
    value: string,
    ttlMs: number = this.defaultTtlMs,
  ): Promise<boolean> {
    // SET key value PX ttlMs NX
    // PX: Set the specified expire time, in milliseconds.
    // NX: Only set the key if it does not already exist.
    const result = await this.redisClient.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  /**
   * Libera um lock distribuído no Redis.
   * O lock só é liberado se o valor armazenado corresponder ao valor fornecido,
   * garantindo que apenas o proprietário do lock possa liberá-lo.
   * @param key A chave do lock.
   * @param value O valor do lock (deve corresponder ao valor usado na aquisição).
   * @returns true se o lock foi liberado, false caso contrário.
   */
  async releaseLock(key: string, value: string): Promise<boolean> {
    // Usar um script Lua para garantir atomicidade:
    // 1. Verifica se o valor da chave corresponde ao valor fornecido.
    // 2. Se sim, deleta a chave.
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redisClient.eval(script, 1, key, value);
    return result === 1; // 1 means the key was deleted
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }
}
