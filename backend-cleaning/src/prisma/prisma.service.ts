// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // A configuração 'log' é fundamental para a inferência de tipos do '$on'
    super({
      log: ['warn', 'error'], // Tente com 'warn' e 'error' juntos.
      // Você pode tentar também: log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    // Adicionando este log para depurar a DATABASE_URL
    console.log('DATABASE_URL que o Prisma está vendo:', process.env.DATABASE_URL);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Método para habilitar os hooks de desligamento.
  // Se o erro 'beforeExit' persistir, vamos tentar uma alternativa.
  async enableShutdownHooks(app: INestApplication) {
    // Primeira tentativa: Usar o hook 'beforeExit' do Prisma
    // Se o erro TS2345 ainda estiver aqui, o problema é na inferência de tipos do PrismaClient.
    // this.$on('beforeExit', async () => { // Linha que está dando erro
    //   await app.close();
    // });

    // Segunda tentativa (Alternativa): Usar um hook de processo do Node.js
    // Esta é uma forma mais genérica de lidar com o desligamento da aplicação.
    // É importante notar que 'beforeExit' do Node.js é diferente do 'beforeExit' do Prisma.
    // O do Node.js é chamado quando o event loop está vazio, o que pode não ser ideal para
    // garantir que todas as operações assíncronas do NestJS sejam finalizadas.
    // Para desligamentos mais robustos, 'SIGINT' (Ctrl+C) ou 'SIGTERM' são melhores.

    // Usaremos 'SIGINT' (para Ctrl+C) e 'SIGTERM' (para comandos de encerramento de processos)
    // para garantir um desligamento gracioso.
    process.on('SIGINT', async () => {
      await app.close();
      process.exit(0); // Garante que o processo Node.js saia
    });

    process.on('SIGTERM', async () => {
      await app.close();
      process.exit(0); // Garante que o processo Node.js saia
    });

    // Se você realmente precisa do 'beforeExit' do Prisma, e o erro persiste,
    // podemos tentar um 'type assertion' (mas isso é um último recurso, pois ignora o erro de tipo).
    // (this as any).$on('beforeExit', async () => {
    //   await app.close();
    // });
  }
}