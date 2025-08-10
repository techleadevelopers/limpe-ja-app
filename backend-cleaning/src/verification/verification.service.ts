// src/verification/verification.service.ts
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { File } from 'multer';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';

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

    // Após o upload, checar e atualizar o status para revisão manual.
    await this.updateStatusForManualReview(providerId);
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

    // Após o upload, checar e atualizar o status para revisão manual.
    await this.updateStatusForManualReview(providerId);
    return fileUrl;
  }

  /**
   * NOVO MÉTODO: Verifica se todos os documentos necessários foram enviados
   * e, em caso afirmativo, atualiza o status do provedor para PENDING_ADMIN_REVIEW.
   */
  private async updateStatusForManualReview(providerId: string): Promise<void> {
    this.logger.log(`[VerificationService] updateStatusForManualReview: Verificando documentos para provedor ${providerId}.`);
    const provider = await this.providersService.findOne(providerId);

    if (!provider) {
      this.logger.warn(`[VerificationService] updateStatusForManualReview: Provedor ${providerId} não encontrado.`);
      return;
    }

    const isDocumentFrontUploaded = !!provider.documentPhotoFrontUrl;
    const isDocumentBackUploaded = !!provider.documentPhotoBackUrl;
    const isSelfieUploaded = !!provider.selfieWithDocumentUrl;

    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded) {
      if (provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW) {
        await this.prisma.provider.update({
          where: { id: providerId },
          data: { verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW },
        });
        this.logger.log(`[VerificationService] Status do provedor ${providerId} atualizado para PENDING_MANUAL_REVIEW após upload completo.`);
        // Aqui você pode adicionar uma notificação para o administrador, se desejar.
      }
    } else {
      // Se ainda faltam documentos, mantém o status atual ou define como PENDING_DOCUMENTS_UPLOAD
      if (provider.verificationStatus !== VerificationStatus.PENDING_DOCUMENTS_UPLOAD) {
        await this.prisma.provider.update({
          where: { id: providerId },
          data: { verificationStatus: VerificationStatus.PENDING_DOCUMENTS_UPLOAD },
        });
        this.logger.log(`[VerificationService] Status do provedor ${providerId} atualizado para PENDING_DOCUMENTS_UPLOAD (faltam documentos).`);
      }
    }
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

  // Métodos de atualização de resultado de OCR e Liveness agora não são usados no fluxo síncrono.
  // Eles podem ser mantidos para uma futura implementação assíncrona, mas o fluxo atual não os invoca.
  async updateProviderOcrResult(providerId: string, ocrResult: OcrResult, type: 'FRONT' | 'BACK'): Promise<void> {
    const updateData: Prisma.ProviderUpdateInput = {
      ocrResult: ocrResult as unknown as Prisma.JsonObject,
    };
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] OCR result para ${type} do provedor ${providerId} atualizado.`);
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
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    this.logger.log(`[VerificationService] rejectProvider: Rejeitando provedor ${providerId} com motivo: ${reason}`);
    const provider = await this.providersService.findOne(providerId);
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
  }
}