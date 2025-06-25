import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService], // Exporta o serviço para ser utilizado em outros módulos
})
export class ServicesModule {}