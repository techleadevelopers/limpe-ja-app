import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MissionsProgressService } from './progress.service';

@Injectable()
export class MissionEventCleanupJob {
  private readonly logger = new Logger(MissionEventCleanupJob.name);

  constructor(private readonly missionsProgressService: MissionsProgressService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    try {
      const cleaned = await this.missionsProgressService.cleanupStaleMissionEvents({
        olderThanHours: 24,
        limit: 300,
      });
      if (cleaned > 0) {
        this.logger.log(
          `[MissionEventCleanupJob] Removidos ${cleaned} eventos antigos de missão.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[MissionEventCleanupJob] Falha ao limpar MissionEvents: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }
  }
}
