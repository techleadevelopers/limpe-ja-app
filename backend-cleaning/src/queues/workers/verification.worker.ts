// src/queues/workers/verification.worker.ts
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentProcessingService } from '../../document-processing/document-processing.service';
import { ProvidersService } from '../../providers/providers.service';
import { VerificationService } from '../../verification/verification.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { File } from 'multer';

@Injectable()
export class VerificationWorker extends WorkerHost {
  private readonly logger = new Logger(VerificationWorker.name);

  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly verificationService: VerificationService,
    private readonly providersService: ProvidersService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { providerId, fileUrl, type, selfieUrl, documentFrontUrl } = job.data;
    this.logger.log(`[VerificationWorker] Processando job '${job.name}' para providerId: ${providerId}`);

    try {
      if (job.name === 'process-document-ocr') {
        const fileBuffer = await this.downloadFileFromUrl(fileUrl);
        const ocrFile: File = {
          fieldname: 'file',
          originalname: 'document.jpeg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: fileBuffer,
          size: fileBuffer.length,
          stream: null,
          destination: null,
          filename: null,
          path: null,
        };

        const ocrResult: any = await this.documentProcessingService.processDocumentOcr(ocrFile);
        this.logger.log(`[VerificationWorker] OCR do documento (${type}) concluído para providerId: ${providerId}.`);
        await this.verificationService.updateProviderOcrResult(providerId, ocrResult, type);
      } else if (job.name === 'perform-liveness-check') {
        const selfieBuffer = await this.downloadFileFromUrl(selfieUrl);
        const selfieFile: File = {
          fieldname: 'file',
          originalname: 'selfie.jpeg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: selfieBuffer,
          size: selfieBuffer.length,
          stream: null,
          destination: null,
          filename: null,
          path: null,
        };
        const livenessResult: any = await this.documentProcessingService.performLivenessCheck(selfieFile);

        const documentFrontBuffer = await this.downloadFileFromUrl(documentFrontUrl);
        const documentFrontFile: File = {
          fieldname: 'file',
          originalname: 'documentFront.jpeg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: documentFrontBuffer,
          size: documentFrontBuffer.length,
          stream: null,
          destination: null,
          filename: null,
          path: null,
        };
        const faceComparisonResult: any = await this.documentProcessingService.compareFaces(selfieFile, documentFrontFile.buffer.toString());

        this.logger.log(`[VerificationWorker] Liveness check e Face comparison concluídos para providerId: ${providerId}.`);
        await this.verificationService.updateProviderLivenessResult(providerId, livenessResult);
        await this.verificationService.updateProviderFaceComparisonResult(providerId, faceComparisonResult);
      }

      this.logger.log(`[VerificationWorker] Job '${job.name}' finalizado com sucesso.`);
    } catch (error) {
      this.logger.error(`[VerificationWorker] Erro no job '${job.name}' para providerId: ${providerId}. Erro: ${error.message}`);
      // Lógica de tratamento de erro e atualização de status
      throw error;
    }
  }

  private async downloadFileFromUrl(url: string): Promise<Buffer> {
    this.logger.log(`[VerificationWorker] Baixando arquivo da URL: ${url}`);
    try {
      const response = await firstValueFrom(this.httpService.get(url, { responseType: 'arraybuffer' }));
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`[VerificationWorker] Erro ao baixar arquivo da URL ${url}: ${error.message}`);
      throw new Error(`Erro ao baixar arquivo para processamento: ${error.message}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.log(`[VerificationWorker] Job '${job.name}' com ID '${job.id}' foi completado.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(`[VerificationWorker] Job '${job.name}' com ID '${job.id}' falhou com erro: ${error.message}`);
  }
}