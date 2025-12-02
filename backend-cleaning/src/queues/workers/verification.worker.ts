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
import { VerificationStatus } from '../../shared/enums/verification-status.enum';
import { QueuesService } from '../queues.service';
import { NotificationsService } from '../../notifications/notifications.service'; // Importar NotificationsService
import { I18nService } from '../../common/i18n/i18n.service'; // Importar I18nService

@Injectable()
export class VerificationWorker extends WorkerHost {
  private readonly logger = new Logger(VerificationWorker.name);

  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly verificationService: VerificationService,
    private readonly providersService: ProvidersService,
    private readonly httpService: HttpService,
    private readonly queuesService: QueuesService, // Injetar QueuesService
    private readonly notificationsService: NotificationsService, // Injetar NotificationsService
    private readonly i18n: I18nService, // Injetar I18nService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { providerId, fileUrl, type, selfieUrl, documentFrontUrl } = job.data;
    this.logger.log(
      `[VerificationWorker] Processando job '${job.name}' para providerId: ${providerId}`,
    );

    let processingErrorReason: string | null = null; // Para capturar o motivo específico do erro
    let notificationMessageKey: string = 'verification.processingFailedGeneric'; // Chave padrão para i18n

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

        try {
          const ocrResult: any =
            await this.documentProcessingService.processDocumentOcr(ocrFile);
          this.logger.log(
            `[VerificationWorker] OCR do documento (${type}) concluído para providerId: ${providerId}.`,
          );
          await this.verificationService.updateProviderOcrResult(
            providerId,
            ocrResult,
            type,
          );
        } catch (ocrError: any) {
          processingErrorReason = `Falha no processamento de OCR: ${ocrError.message}`;
          notificationMessageKey = 'verification.ocrFailed'; // Chave específica para i18n
          this.logger.error(
            `[VerificationWorker] OCR process failed for providerId ${providerId}: ${ocrError.message}`,
          );
          throw ocrError; // Re-throw para ser capturado pelo catch externo para atualização de status
        }
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

        const documentFrontBuffer =
          await this.downloadFileFromUrl(documentFrontUrl);
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

        try {
          const livenessResult: any =
            await this.documentProcessingService.performLivenessCheck(
              selfieFile,
            );
          // Assumindo que compareFaces aceita URL ou buffer. O segundo argumento é buffer.toString()
          const faceComparisonResult: any =
            await this.documentProcessingService.compareFaces(
              selfieFile,
              documentFrontFile.buffer.toString(),
            );

          this.logger.log(
            `[VerificationWorker] Liveness check e Face comparison concluídos para providerId: ${providerId}.`,
          );
          await this.verificationService.updateProviderLivenessResult(
            providerId,
            livenessResult,
          );
          await this.verificationService.updateProviderFaceComparisonResult(
            providerId,
            faceComparisonResult,
          );
        } catch (livenessFaceError: any) {
          processingErrorReason = `Falha na verificação de vivacidade ou comparação facial: ${livenessFaceError.message}`;
          notificationMessageKey = 'verification.livenessFaceCheckFailed'; // Chave específica para i18n
          this.logger.error(
            `[VerificationWorker] Liveness/Face comparison failed for providerId ${providerId}: ${livenessFaceError.message}`,
          );
          throw livenessFaceError; // Re-throw para ser capturado pelo catch externo
        }
      }

      this.logger.log(
        `[VerificationWorker] Job '${job.name}' finalizado com sucesso.`,
      );
    } catch (error: any) {
      this.logger.error(
        `[VerificationWorker] Erro crítico no job '${job.name}' para providerId: ${providerId}. Erro: ${error.message}`,
      );

      // Obter detalhes do provedor para enviar notificação
      const provider = await this.providersService.findOne(providerId);
      if (provider) {
        // Atualizar status do provedor para PENDING_MANUAL_REVIEW com motivo de rejeição
        await this.verificationService.updateProviderVerificationStatusManually(
          providerId,
          VerificationStatus.PENDING_MANUAL_REVIEW,
          processingErrorReason ||
            `Erro durante o processamento automático de documentos: ${error.message}`,
        );

        // Traduzir a mensagem da notificação usando I18nService
        const translatedMessage = await this.i18n.translate(
          notificationMessageKey,
          'pt-BR', // Ou o locale do provedor se estiver disponível
          { reason: processingErrorReason || error.message },
        );

        // Enviar notificação para o provedor
        await this.queuesService.addNotificationJob('send-notification', {
          userId: provider.userId,
          type: 'VERIFICATION_PROCESSING_FAILED', // Manter o tipo para o frontend reagir
          message: translatedMessage, // Usar a mensagem traduzida
          targetUrl: '/profile/verification-status',
        });
        this.logger.log(
          `[VerificationWorker] Notificação de falha de processamento adicionada à fila para userId: ${provider.userId}.`,
        );
      } else {
        this.logger.warn(
          `[VerificationWorker] Provedor ${providerId} não encontrado ao tentar atualizar status após falha do worker.`,
        );
      }

      throw error; // Re-throw o erro para que o BullMQ marque o job como falho e lide com as retentativas.
    }
  }

  private async downloadFileFromUrl(url: string): Promise<Buffer> {
    this.logger.log(`[VerificationWorker] Baixando arquivo da URL: ${url}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        `[VerificationWorker] Erro ao baixar arquivo da URL ${url}: ${error.message}`,
      );
      throw new Error(
        `Erro ao baixar arquivo para processamento: ${error.message}`,
      );
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.log(
      `[VerificationWorker] Job '${job.name}' com ID '${job.id}' foi completado.`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(
      `[VerificationWorker] Job '${job.name}' com ID '${job.id}' falhou com erro: ${error.message}`,
    );
  }
}
