// src/verification/verification.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentProcessingService } from './document-processing.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { Prisma } from '@prisma/client';
import { File } from 'multer';

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

    try {
      const ocrResult: OcrResult = await this.documentProcessingService.processDocumentOcr(file);
      updateData.ocrResult = ocrResult as unknown as Prisma.JsonObject;
      this.logger.log(`[VerificationService] OCR processado para ${type} do provedor ${providerId}.`);
    } catch (ocrError: any) {
      this.logger.error(`[VerificationService] Erro ao processar OCR para ${type} do provedor ${providerId}: ${ocrError.message}`);
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] URL do documento (${type}) e resultados de OCR salvos para provider ${providerId}.`);

    await this.updateProviderVerificationStatus(providerId);
  }

  // MODIFICAÇÃO AQUI: Retorna a URL do arquivo
  async uploadSelfieWithDocument(providerId: string, file: File): Promise<string> { // <-- Tipo de retorno alterado
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

    const updateData: Prisma.ProviderUpdateInput = { selfieWithDocumentUrl: fileUrl };

    if (provider.documentPhotoFrontUrl) {
      try {
        const faceComparisonResult: FaceComparisonResult = await this.documentProcessingService.compareFaces(file, provider.documentPhotoFrontUrl);
        updateData.livenessResult = faceComparisonResult as unknown as Prisma.JsonObject;
        this.logger.log(`[VerificationService] Comparação facial processada para provedor ${providerId}.`);
      } catch (fcError: any) {
        this.logger.error(`[VerificationService] Erro ao processar comparação facial para provedor ${providerId}: ${fcError.message}`);
      }
    } else {
      this.logger.warn(`[VerificationService] Não foi possível realizar comparação facial para ${providerId}: foto do documento frontal ausente.`);
    }

    try {
      const livenessResult: LivenessResult = await this.documentProcessingService.performLivenessCheck(file);
      updateData.livenessResult = livenessResult as unknown as Prisma.JsonObject;
      this.logger.log(`[VerificationService] Liveness check processado para provedor ${providerId}.`);
    } catch (livenessError: any) {
      this.logger.error(`[VerificationService] Erro ao processar liveness check para provedor ${providerId}: ${livenessError.message}`);
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] URL da selfie e resultados de liveness/comparação facial salvos para provider ${providerId}.`);

    await this.updateProviderVerificationStatus(providerId);
    return fileUrl; // <-- Retorna a URL para o controller
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

    const isOcrProcessedAndOk = provider.ocrResult && (provider.ocrResult as unknown as OcrResult).confidence > 0.7;
    const isLivenessCheckPassed = provider.livenessResult && (provider.livenessResult as unknown as LivenessResult).isLive;

    let newStatus: VerificationStatus | undefined = undefined;

    if (provider.verificationStatus === VerificationStatus.REJECTED || provider.verificationStatus === VerificationStatus.BLOCKED) {
      return;
    }

    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded && isOcrProcessedAndOk && isLivenessCheckPassed) {
      newStatus = VerificationStatus.APPROVED;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} APROVADO automaticamente.`);
    } else if (
      (provider.ocrResult && !(provider.ocrResult as unknown as OcrResult).extractedText) ||
      (provider.livenessResult && !(provider.livenessResult as unknown as LivenessResult).isLive)
    ) {
      newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} tem problemas em verificações automáticas (OCR/Liveness), requer revisão manual.`);
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