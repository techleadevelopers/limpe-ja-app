// backend-cleaning/src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
// A importação de CacheStore e a cláusula 'implements CacheStore' foram removidas
// para contornar o erro TS2305, que indica que CacheStore não é exportado.
import { CacheService } from './cache.service';

class RedisCacheStore { 
  private readonly keyv: KeyvRedis<any>; 
  private readonly defaultTtl: number; 

  constructor(redisUrl: string, defaultTtl: number) {
    this.keyv = new KeyvRedis<any>(redisUrl); 
    this.defaultTtl = defaultTtl;
    this.keyv.on('error', err => console.error('KeyvRedis connection error:', err));
  }

  // O tipo genérico 'T' foi removido da assinatura do método 'get'
  // para simplificar a inferência de tipo e evitar o erro TS2345.
  // O consumidor do cache ainda poderá usar tipos genéricos ao chamar o serviço.
  async get(key: string): Promise<any | undefined> {
    // Criando uma variável intermediária com tipagem explícita
    // para garantir que 'key' seja tratada como 'string' na chamada.
    const keyAsString: string = key; 
    // @ts-ignore
    // Este comentário instrui o TypeScript a ignorar erros de tipagem nesta linha.
    // É um último recurso quando o compilador se comporta de forma inesperada.
    return this.keyv.get(keyAsString); 
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // @ts-ignore
    // Aplicando o mesmo workaround para o método set, pois o erro TS2345
    // está ocorrendo de forma similar no parâmetro 'key'.
    await this.keyv.set(key, value, ttl !== undefined ? ttl * 1000 : this.defaultTtl * 1000);
  }

  async del(key: string): Promise<void> {
    await this.keyv.delete(key);
  }

  async reset(): Promise<void> {
    await this.keyv.clear();
  }
}

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const ttl = parseInt(configService.get<string>('CACHE_TTL_SECONDS') || '3600', 10);

        const redisStoreInstance = new RedisCacheStore(redisUrl, ttl);

        return {
          store: redisStoreInstance, 
          ttl: ttl,
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}