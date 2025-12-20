// backend-cleaning/src/cache/cache.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
// Importe CACHE_MANAGER e Cache de '@nestjs/cache-manager'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import type { RedisClientType } from '@redis/client';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redisClient?: RedisClientType;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    const store = (cacheManager as any)?.store;
    this.redisClient = store?.client as RedisClientType | undefined;
  }

  /**
   * Obtém um valor do cache.
   * @param key Chave do item no cache.
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(
        `Erro ao obter do cache para a chave ${key}: ${error.message}`,
      );
      return undefined;
    }
  }

  /**
   * Define um valor no cache.
   * @param key Chave do item no cache.
   * @param value Valor a ser armazenado.
   * @param ttl Tempo de vida do item em segundos (opcional, usa o padrão do módulo se omitido).
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET for key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Erro ao definir no cache para a chave ${key}: ${error.message}`,
      );
    }
  }

  /**
   * Deleta um item do cache.
   * @param key Chave do item a ser deletado.
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL for key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Erro ao deletar do cache para a chave ${key}: ${error.message}`,
      );
    }
  }

  async setIfNotExists<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (this.redisClient?.isOpen) {
      try {
        const rawValue =
          typeof value === 'string'
            ? value
            : JSON.stringify(value === undefined ? true : value);
        const ttlMs = ttl !== undefined ? ttl * 1000 : undefined;
        const options: { NX: true; PX?: number } = { NX: true };
        if (ttlMs !== undefined) {
          options.PX = ttlMs;
        }
        const result = await this.redisClient.set(key, rawValue, options);
        return result === 'OK';
      } catch (error) {
        this.logger.error(
          `Erro ao tentar setIfNotExists para ${key}: ${
            (error as Error).message ?? error
          }`,
        );
      }
    }

    const existing = await this.get(key);
    if (existing !== undefined) {
      return false;
    }

    await this.set(key, value, ttl);
    return true;
  }

  /**
   * Limpa todo o cache.
   */
  async reset(): Promise<void> {
    try {
      // CORREÇÃO: Usar o método 'clear()' que existe na interface 'Cache'
      await this.cacheManager.clear();
      this.logger.warn('Cache RESET successfully.');
    } catch (error) {
      this.logger.error(`Erro ao resetar o cache: ${error.message}`);
    }
  }
}
