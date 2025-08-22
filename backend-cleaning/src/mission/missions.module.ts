import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service'; // ajuste o path se seu PrismaService estiver em outro lugar

@Module({
  controllers: [MissionsController],
  providers: [
    PrismaService,
    MissionsService,
    MissionProgressService,
  ],
  exports: [
    MissionsService,
    MissionProgressService,
  ],
})
export class MissionsModule {}
