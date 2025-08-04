// backend-cleaning/src/queues/workers/verification.worker.ts
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DocumentProcessingService } from '../../document-processing/document-processing.service';
import { VerificationService } from '../../verification/verification.service';

@Processor('verification')
export class VerificationWorker {
  private readonly logger = new Logger(VerificationWorker.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  @Process('process-document-ocr')
  async processDocumentOcr(job: Job<{ providerId: string; fileUrl: string; type: 'FRONT' | 'BACK' }>): Promise<void> {
    this.logger.log(`Processando tarefa 'process-document-ocr' para provedor ${job.data.providerId}, tipo ${job.data.type}.`);
    const { providerId, fileUrl, type } = job.data;

    try {
      // CORREÇÃO: Chamar o novo método processDocumentOcrFromUrl que lida com URLs
      const ocrResult: any = await this.documentProcessingService.processDocumentOcrFromUrl(fileUrl);
      await this.verificationService.updateProviderOcrResult(providerId, ocrResult, type);
      this.logger.log(`OCR processado com sucesso para provedor ${providerId}, tipo ${type}.`);
    } catch (error) {
      this.logger.error(`Falha ao processar OCR para provedor ${providerId}, tipo ${type}: ${error.message}`);
      throw error; // Relança o erro para que BullMQ possa lidar com a retentativa
    }
  }

  @Process('perform-liveness-check')
  async performLivenessCheck(job: Job<{ providerId: string; selfieUrl: string; documentFrontUrl?: string }>): Promise<void> {
    this.logger.log(`Processando tarefa 'perform-liveness-check' para provedor ${job.data.providerId}.`);
    const { providerId, selfieUrl, documentFrontUrl } = job.data;

    try {
      // CORREÇÃO: Chamar o novo método performLivenessCheckFromUrl que lida com URLs
      const livenessResult: any = await this.documentProcessingService.performLivenessCheckFromUrl(selfieUrl);
      await this.verificationService.updateProviderLivenessResult(providerId, livenessResult);

      if (documentFrontUrl) {
        // CORREÇÃO: Chamar o novo método compareFacesFromUrls que lida com URLs
        const faceComparisonResult: any = await this.documentProcessingService.compareFacesFromUrls(selfieUrl, documentFrontUrl);
        await this.verificationService.updateProviderFaceComparisonResult(providerId, faceComparisonResult);
      }

      this.logger.log(`Liveness check e comparação facial processados com sucesso para provedor ${providerId}.`);
    } catch (error) {
      this.logger.error(`Falha ao processar liveness check/comparação facial para provedor ${providerId}: ${error.message}`);
      throw error;
    }
  }
}