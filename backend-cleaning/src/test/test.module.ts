import { Module } from '@nestjs/common';
import { TestController } from './test.controller'; // Importa o TestController que está na mesma pasta
import { PrismaService } from '../prisma/prisma.service'; // Assumindo que você tem um PrismaService

@Module({
  controllers: [TestController],
  providers: [PrismaService], // Ou qualquer outro serviço que o TestController precise
})
export class TestModule {}