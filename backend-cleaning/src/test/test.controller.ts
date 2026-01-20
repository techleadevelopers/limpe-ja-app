import { Controller, Post, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { main as seedDatabase } from '../../prisma/seed/seed'; // Ajuste o caminho conforme necessário

@Controller('test') // Isso define o prefixo da rota como /test
export class TestController {
  constructor() {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('seed') // Isso define o endpoint completo como /test/seed
  async seed(@Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res
        .status(HttpStatus.FORBIDDEN)
        .send('Seed operations are forbidden in production.');
    }

    try {
      console.log('Recebida requisição para seed do banco de dados...');
      await seedDatabase();
      console.log('Seed do banco de dados concluído via API.');
      return res.status(HttpStatus.OK).send('Database seeded successfully!');
    } catch (error) {
      console.error('Erro ao seedar o banco de dados via API:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to seed database.');
    }
  }
}
