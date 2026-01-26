import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZapiService } from './zapi.service';

@Module({
  imports: [ConfigModule],
  providers: [ZapiService],
  exports: [ZapiService],
})
export class ZapiModule {}
