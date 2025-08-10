// src/verification/verification.service.ts
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { File } from 'multer';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { QueuesService } from '../queues/queues.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { NotificationsService } from '../notifications/notifications.service'; // Importar NotificationsService

interface OcrResult {
  extractedText: string;
  confidence: number;
  rawResult?: any;
}

interface LivenessResult {
  isLive: boolean;
  score: number;
  details?: string;
}

interface FaceComparisonResult {
  match: boolean;
  score: number;
  details?: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly providersService: ProvidersService,
    private readonly queuesService: QueuesService,
    private readonly notificationsService: NotificationsService, // Adicionar ao construtor
  ) {}

  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[VerificationService] getPendingProviders: Buscando provedores pendentes.`);
    const providers = await this.providersService.getPendingProviders();
    return providers || [];
  }

  async uploadAvatar(providerId: string, file: File): Promise<string> {
    this.logger.log(`[VerificationService] uploadAvatar: Iniciando para providerId: ${providerId}`);
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(`[VerificationService] uploadAvatar: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileExtension = file.originalname?.split('.').pop() || 'jpg';
    const destinationPath = `provider-documents/${providerId}/avatar-${Date.now()}.${fileExtension}`;

    const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
    this.logger.log(`[VerificationService] uploadAvatar: Avatar enviado para ${fileUrl}`);

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { avatarUrl: fileUrl },
    });
    this.logger.log(`[VerificationService] URL do avatar salva para provider ${providerId}.`);

    return fileUrl;
  }

  async uploadDocumentPhoto(
    providerId: string,
    file: File,
    type: 'FRONT' | 'BACK',
  ): Promise<void> {
    this.logger.log(`[VerificationService] uploadDocumentPhoto: Iniciando para providerId: ${providerId}, tipo: ${type}`);
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(`[VerificationService] uploadDocumentPhoto: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileExtension = file.originalname?.split('.').pop() || 'jpg';
    const destinationPath = `provider-documents/${providerId}/${type.toLowerCase()}-${Date.now()}.${fileExtension}`;

    const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
    this.logger.log(`[VerificationService] uploadDocumentPhoto: Imagem enviada para ${fileUrl}`);

    const updateData: Prisma.ProviderUpdateInput = {};
    if (type === 'FRONT') {
      updateData.documentPhotoFrontUrl = fileUrl;
    } else {
      updateData.documentPhotoBackUrl = fileUrl;
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] URL do documento (${type}) salva para provider ${providerId}.`);

    await this.queuesService.addVerificationJob('process-document-ocr', {
      providerId,
      fileUrl,
      type,
    });

    await this.updateProviderVerificationStatus(providerId);
  }

  async uploadSelfieWithDocument(providerId: string, file: File): Promise<string> {
    this.logger.log(`[VerificationService] uploadSelfieWithDocument: Iniciando para providerId: ${providerId}`);
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(`[VerificationService] uploadSelfieWithDocument: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileExtension = file.originalname?.split('.').pop() || 'jpg';
    const destinationPath = `provider-documents/${providerId}/selfie-${Date.now()}.${fileExtension}`;

    const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
    this.logger.log(`[VerificationService] uploadSelfieWithDocument: Selfie enviada para ${fileUrl}`);

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { selfieWithDocumentUrl: fileUrl },
    });
    this.logger.log(`[VerificationService] URL da selfie salva para provider ${providerId}.`);

    await this.queuesService.addVerificationJob('perform-liveness-check', {
      providerId,
      selfieUrl: fileUrl,
      documentFrontUrl: provider.documentPhotoFrontUrl,
    });

    await this.updateProviderVerificationStatus(providerId);
    return fileUrl;
  }

  // NOVO MÉTODO PARA AVANÇAR O STATUS DE VERIFICAÇÃO
  async advanceVerificationStatus(providerId: string): Promise<void> {
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }
    if (provider.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          verificationStatus: VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
        },
      });
      this.logger.log(`[VerificationService] Status do provedor ${providerId} avançado para PENDING_DOCUMENTS_UPLOAD.`);
    } else {
      throw new BadRequestException('Não é possível avançar o status de verificação a partir do estado atual.');
    }
  }

  async updateProviderOcrResult(providerId: string, ocrResult: OcrResult, type: 'FRONT' | 'BACK'): Promise<void> {
    const updateData: Prisma.ProviderUpdateInput = {
      ocrResult: ocrResult as unknown as Prisma.JsonObject,
    };
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] OCR result para ${type} do provedor ${providerId} atualizado.`);
    await this.updateProviderVerificationStatus(providerId);
  }

  async updateProviderLivenessResult(providerId: string, livenessResult: LivenessResult): Promise<void> {
    const updateData: Prisma.ProviderUpdateInput = {
      livenessResult: livenessResult as unknown as Prisma.JsonObject,
    };
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] Liveness check result para provedor ${providerId} atualizado.`);
    await this.updateProviderVerificationStatus(providerId);
  }

  async updateProviderFaceComparisonResult(providerId: string, faceComparisonResult: FaceComparisonResult): Promise<void> {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (provider && provider.livenessResult) {
      const currentLiveness = provider.livenessResult as unknown as LivenessResult & { faceComparison?: FaceComparisonResult };
      currentLiveness.faceComparison = faceComparisonResult;
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { livenessResult: currentLiveness as unknown as Prisma.JsonObject },
      });
      this.logger.log(`[VerificationService] Face comparison result para provedor ${providerId} atualizado.`);
    }
    await this.updateProviderVerificationStatus(providerId);
  }

  async updateProviderVerificationStatusManually(providerId: string, newStatus: VerificationStatus, reason?: string): Promise<void> {
    this.logger.log(`[VerificationService] updateProviderVerificationStatusManually: Atualizando status para ${providerId} para ${newStatus}. Motivo: ${reason || 'N/A'}`);
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(`[VerificationService] updateProviderVerificationStatusManually: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    if (newStatus === VerificationStatus.REJECTED && !reason) {
      throw new BadRequestException('O motivo da rejeição é obrigatório ao definir o status como REJECTED.');
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationStatus: newStatus,
        rejectionReason: newStatus === VerificationStatus.REJECTED ? reason : null,
      },
    });
    this.logger.log(`[VerificationService] updateProviderVerificationStatusManually: Status de verificação do provedor ${providerId} atualizado para ${newStatus}.`);
  }

  async updateProviderVerificationStatus(providerId: string): Promise<void> {
    this.logger.log(`[VerificationService] updateProviderVerificationStatus: Verificando status para providerId: ${providerId}`);
    const provider = await this.providersService.findOne(providerId);

    if (!provider) {
      this.logger.warn(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    const isDocumentFrontUploaded = provider.documentPhotoFrontUrl !== null && provider.documentPhotoFrontUrl !== undefined;
    const isDocumentBackUploaded = provider.documentPhotoBackUrl !== null && provider.documentPhotoBackUrl !== undefined;
    const isSelfieUploaded = provider.selfieWithDocumentUrl !== null && provider.selfieWithDocumentUrl !== undefined;

    // Assumindo que OcrResult, LivenessResult, FaceComparisonResult estão estruturados corretamente como JSON
    const ocrResult = provider.ocrResult as unknown as OcrResult;
    const livenessResult = provider.livenessResult as unknown as LivenessResult;
    const faceComparisonResult = (provider.livenessResult as unknown as LivenessResult & { faceComparison?: FaceComparisonResult })?.faceComparison;

    const isOcrProcessedAndOk = ocrResult?.confidence > 0.7;
    const isLivenessCheckPassed = livenessResult?.isLive;
    const isFaceComparisonMatch = faceComparisonResult?.match;

    let newStatus: VerificationStatus | undefined = undefined;
    let notificationMessage: string = '';
    let notificationType: string = '';
    let rejectionReasonForManualReview: string | null = null;

    if (provider.verificationStatus === VerificationStatus.REJECTED || provider.verificationStatus === VerificationStatus.BLOCKED) {
      // Não alterar o status se já estiver rejeitado ou bloqueado.
      return;
    }

    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded && isOcrProcessedAndOk && isLivenessCheckPassed && isFaceComparisonMatch) {
      newStatus = VerificationStatus.APPROVED;
      notificationType = 'VERIFICATION_APPROVED';
      notificationMessage = 'Sua conta de provedor foi aprovada! Você já pode começar a receber serviços.';
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} APROVADO automaticamente.`);
    } else if (
      // Condições para revisão manual devido a falhas nas verificações automáticas
      (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded) && // Todos os documentos enviados
      (
        (ocrResult && !isOcrProcessedAndOk) || // OCR processado, mas não OK
        (livenessResult && !isLivenessCheckPassed) || // Liveness processado, mas falhou
        (livenessResult && faceComparisonResult && !isFaceComparisonMatch) // Comparação facial processada, mas falhou
      )
    ) {
      newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
      notificationType = 'VERIFICATION_MANUAL_REVIEW';
      notificationMessage = 'Seus documentos foram processados, mas requerem revisão manual. Você será notificado em breve sobre o resultado.';
      rejectionReasonForManualReview = 'Falha nas verificações automáticas (OCR, vivacidade ou comparação facial).'; // Motivo padrão para revisão manual
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} tem problemas em verificações automáticas (OCR/Liveness/Face Comparison), requer revisão manual.`);
    } else if (!isDocumentFrontUploaded || !isDocumentBackUploaded || !isSelfieUploaded) {
      newStatus = VerificationStatus.PENDING_DOCUMENTS_UPLOAD;
      notificationType = 'VERIFICATION_DOCUMENTS_PENDING';
      notificationMessage = 'Faltam documentos para completar sua verificação. Por favor, faça o upload da frente, verso do documento e sua selfie com o documento.';
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} passou para PENDING_DOCUMENTS_UPLOAD (faltam dados).`);
    } else if (provider.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW) {
      // Se nenhuma das condições acima for atendida, e ainda estiver em revisão inicial, mantém o status.
      newStatus = VerificationStatus.PENDING_INITIAL_REVIEW;
    }

    if (newStatus && newStatus !== provider.verificationStatus) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          verificationStatus: newStatus,
          // Definir rejectionReason apenas se estiver movendo para PENDING_MANUAL_REVIEW
          rejectionReason: newStatus === VerificationStatus.PENDING_MANUAL_REVIEW ? rejectionReasonForManualReview : null,
        },
      });
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Status do provedor ${providerId} atualizado para ${newStatus}.`);

      // Enviar notificação se o status mudou
      if (notificationType && notificationMessage) {
        await this.queuesService.addNotificationJob('send-notification', {
          userId: provider.userId, // Assumindo que o provedor tem userId
          type: notificationType,
          message: notificationMessage,
          targetUrl: '/profile/verification-status', // Exemplo de URL de destino
        });
        this.logger.log(`[VerificationService] Notificação de status '${notificationType}' adicionada à fila para userId: ${provider.userId}.`);
      }
    }
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    this.logger.log(`[VerificationService] rejectProvider: Rejeitando provedor ${providerId} com motivo: ${reason}`);
    const provider = await this.providersService.findOne(providerId); // Obter provedor para pegar userId para notificação
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason,
      },
    });
    this.logger.log(`[VerificationService] rejectProvider: Provedor ${providerId} rejeitado.`);

    // Enviar notificação sobre a rejeição
    await this.queuesService.addNotificationJob('send-notification', {
      userId: provider.userId,
      type: 'VERIFICATION_REJECTED',
      message: `Sua verificação de conta foi rejeitada. Motivo: ${reason}`,
      targetUrl: '/profile/verification-status',
    });
    this.logger.log(`[VerificationService] Notificação de rejeição adicionada à fila para userId: ${provider.userId}.`);
  }
}