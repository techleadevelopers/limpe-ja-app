import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CacheModule } from '../cache/cache.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [CacheModule, ConfigModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

