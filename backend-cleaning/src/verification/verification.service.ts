// src/verification/verification.service.ts
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { File } from 'multer';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service';
import { QueuesService } from '../queues/queues.service'; // Importar QueuesService
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
    private readonly queuesService: QueuesService, // Injetar QueuesService
  ) {}

  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[VerificationService] getPendingProviders: Buscando provedores pendentes.`);
    const providers = await this.providersService.getPendingProviders();
    return providers || [];
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

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const destinationPath = `provider-documents/${providerId}/${type.toLowerCase()}-${Date.now()}.${fileExtension}`;

    const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
    this.logger.log(`[VerificationService] uploadDocumentPhoto: Imagem enviada para ${fileUrl}`);

    const updateData: Prisma.ProviderUpdateInput = {};
    if (type === 'FRONT') {
      updateData.documentPhotoFrontUrl = fileUrl;
    } else {
      updateData.documentPhotoBackUrl = fileUrl;
    }

    // Atualiza o provedor com a URL do documento
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] URL do documento (${type}) salva para provider ${providerId}.`);

    // Adiciona tarefa para processamento de OCR na fila
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

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const destinationPath = `provider-documents/${providerId}/selfie-${Date.now()}.${fileExtension}`;

    const fileUrl = await this.documentProcessingService.uploadImage(file, destinationPath);
    this.logger.log(`[VerificationService] uploadSelfieWithDocument: Selfie enviada para ${fileUrl}`);

    // Atualiza o provedor com a URL da selfie
    await this.prisma.provider.update({
      where: { id: providerId },
      data: { selfieWithDocumentUrl: fileUrl },
    });
    this.logger.log(`[VerificationService] URL da selfie salva para provider ${providerId}.`);

    // Adiciona tarefa para liveness check e comparação facial na fila
    await this.queuesService.addVerificationJob('perform-liveness-check', {
      providerId,
      selfieUrl: fileUrl,
      documentFrontUrl: provider.documentPhotoFrontUrl, // Passa a URL do documento frontal se existir
    });

    await this.updateProviderVerificationStatus(providerId);
    return fileUrl;
  }

  // Novos métodos para atualizar resultados de processamento assíncrono
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
    // Aqui você pode decidir como armazenar o resultado da comparação facial.
    // Pode ser parte do livenessResult ou um campo separado.
    // Por simplicidade, vamos atualizar o livenessResult com a informação da comparação também,
    // ou criar um campo específico se a granularidade for necessária.
    // Para este exemplo, vamos atualizar o livenessResult.
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

    // A validação de OCR e Liveness agora depende dos resultados que vêm do worker
    const isOcrProcessedAndOk = provider.ocrResult && (provider.ocrResult as unknown as OcrResult).confidence > 0.7;
    const isLivenessCheckPassed = provider.livenessResult && (provider.livenessResult as unknown as LivenessResult).isLive;
    const isFaceComparisonMatch = provider.livenessResult && (provider.livenessResult as unknown as LivenessResult & { faceComparison?: FaceComparisonResult }).faceComparison?.match;


    let newStatus: VerificationStatus | undefined = undefined;

    if (provider.verificationStatus === VerificationStatus.REJECTED || provider.verificationStatus === VerificationStatus.BLOCKED) {
      return;
    }

    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded && isOcrProcessedAndOk && isLivenessCheckPassed && isFaceComparisonMatch) {
      newStatus = VerificationStatus.APPROVED;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} APROVADO automaticamente.`);
    } else if (
      (provider.ocrResult && !(provider.ocrResult as unknown as OcrResult).extractedText) ||
      (provider.livenessResult && !(provider.livenessResult as unknown as LivenessResult).isLive) ||
      (provider.livenessResult && !(provider.livenessResult as unknown as LivenessResult & { faceComparison?: FaceComparisonResult }).faceComparison?.match)
    ) {
      newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} tem problemas em verificações automáticas (OCR/Liveness/Face Comparison), requer revisão manual.`);
    } else if (!isDocumentFrontUploaded || !isDocumentBackUploaded || !isSelfieUploaded) {
      newStatus = VerificationStatus.PENDING_DOCUMENTS_UPLOAD;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} passou para PENDING_DOCUMENTS_UPLOAD (faltam dados).`);
    } else if (provider.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW) {
      newStatus = VerificationStatus.PENDING_INITIAL_REVIEW;
    }

    if (newStatus && newStatus !== provider.verificationStatus) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { verificationStatus: newStatus },
      });
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Status do provedor ${providerId} atualizado para ${newStatus}.`);
    }
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    this.logger.log(`[VerificationService] rejectProvider: Rejeitando provedor ${providerId} com motivo: ${reason}`);
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