import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { ConnectService } from './connect.service';
import { ConnectController } from './connect.controller';

@Module({
  imports: [ConfigModule, CacheModule],
  controllers: [ConnectController],
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}
