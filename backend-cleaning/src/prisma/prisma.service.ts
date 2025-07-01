// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config'; // Importe ConfigService

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // ConfigService é uma propriedade de parâmetro do construtor,
  // que é OK para TypeScript.
  constructor(private configService: ConfigService) {
    // A chamada super() DEVE ser a primeira instrução
    // A lógica de construção da URL DEVE acontecer ANTES do super(),
    // ou dentro do objeto passado para super(), ou usando uma função auxiliar.

    // Obtenha as variáveis de ambiente necessárias ANTES de chamar super()
    const dbUsername = configService.get<string>('DB_USERNAME');
    const dbPassword = configService.get<string>('DB_PASSWORD'); // Vem do Secret Manager
    const dbDatabase = configService.get<string>('DB_DATABASE');
    const dbCloudSqlInstance = configService.get<string>('DB_CLOUD_SQL_INSTANCE');

    // Validação básica para garantir que as variáveis estão presentes
    if (!dbUsername || !dbPassword || !dbDatabase || !dbCloudSqlInstance) {
      console.error('ERRO: Variáveis de ambiente do banco de dados incompletas. Verifique DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_CLOUD_SQL_INSTANCE.');
      throw new Error('Configurações de banco de dados ausentes.');
    }

    // Construa a DATABASE_URL completa para o Prisma
    const databaseUrl = `postgresql://${dbUsername}:${dbPassword}@/${dbDatabase}?host=/cloudsql/${dbCloudSqlInstance}`;
    
    // Chame o construtor da classe pai (PrismaClient) COM A URL construída
    // Esta é a PRIMEIRA instrução que executa o constructor de PrismaClient.
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['warn', 'error'], // Manter logs para depuração
    });

    // TODO: Se você precisar usar 'this' para outras inicializações
    // elas devem vir AQUI, DEPOIS da chamada super().
  }

  async onModuleInit() {
    await this.$connect();
    console.log('PrismaService conectado ao banco de dados.'); // Log de sucesso
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('PrismaService desconectado do banco de dados.'); // Log de desconexão
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('SIGINT', async () => {
      console.log('Recebido SIGINT. Fechando aplicação NestJS...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Recebido SIGTERM. Fechando aplicação NestJS...');
      await app.close();
      process.exit(0);
    });
  }
}