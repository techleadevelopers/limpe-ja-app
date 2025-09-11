import { Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
// Importe a função main do seu seed.ts
// Certifique-se de que o seed.ts exporta a função main, ex: "export async function main() { ... }"
import { main as seedDatabase } from '../../prisma/seed/seed'; // Ajuste o caminho conforme necessário

@Controller('test') // Isso define o prefixo da rota como /test
export class TestController {
  constructor(
    // Se precisar de algum serviço no seed, injete aqui. Ex:
    // private readonly prisma: PrismaService
  ) {}

  @Post('seed') // Isso define o endpoint completo como /test/seed
  async seed(@Res() res: Response) {
    // Guard-rail para garantir que não roda em produção
    if (process.env.NODE_ENV === 'production') {
      return res.status(HttpStatus.FORBIDDEN).send('Seed operations are forbidden in production.');
    }

    try {
      console.log('Recebida requisição para seed do banco de dados...');
      await seedDatabase(); // Chama a função main importada do seu seed.ts
      console.log('Seed do banco de dados concluído via API.');
      return res.status(HttpStatus.OK).send('Database seeded successfully!');
    } catch (error) {
      console.error('Erro ao seedar o banco de dados via API:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to seed database.');
    }
  }
}