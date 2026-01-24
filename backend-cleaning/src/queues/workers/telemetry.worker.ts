import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TelemetryService } from '../../telemetry/telemetry.service';

@Processor('telemetry')
export class TelemetryWorker {
  private readonly logger = new Logger(TelemetryWorker.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  @Process('record-request')
  async recordRequest(
    job: Job<{ userId?: string; path?: string }>,
  ): Promise<void> {
    const { userId, path } = job.data;
    if (!path) {
      this.logger.warn(
        `Job 'record-request' recebeu dados incompletos e será descartado.`,
      );
      return;
    }

    this.logger.debug(
      `Processando job 'record-request' para userId=${userId} path=${path}.`,
    );

    try {
      await this.telemetryService.recordRequest(userId, path);
    } catch (error) {
      this.logger.error(
        `Falha ao registrar telemetria para userId=${userId} path=${path}: ${
          (error as Error).message
        }`,
      );
      throw error;
    }
  }
}
