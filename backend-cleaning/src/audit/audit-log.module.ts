import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Global() // Global para facilitar o uso em outros serviços sem importar o módulo sempre
@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}