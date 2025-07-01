// src/verification/verification.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriminalBackgroundCheckService } from './criminal-background-check.service';
import { DocumentProcessingService } from './document-processing.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service'; // <-- AGORA USAMOS ProviderWithCalculatedRating
import { Prisma } from '@prisma/client';
import { File } from 'multer';

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
  [key: string]: any;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly criminalBackgroundCheckService: CriminalBackgroundCheckService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly providersService: ProvidersService, // Mantido para uso interno do serviço
  ) {}

  async submitCpfForBackgroundCheck(providerId: string, cpf: string): Promise<void> {
    this.logger.log(`[VerificationService] submitCpfForBackgroundCheck: Iniciando para providerId: ${providerId}`);
    // findOne agora retorna ProviderWithCalculatedRating, que possui os campos de verificação
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(`[VerificationService] submitCpfForBackgroundCheck: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { cpf: cpf },
    });

    const backgroundCheckResult: BackgroundCheckResult = await this.criminalBackgroundCheckService.checkCpf(cpf);
    this.logger.log(`[VerificationService] submitCpfForBackgroundCheck: Resultado da verificação para ${providerId}: ${JSON.stringify(backgroundCheckResult)}`);

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        backgroundCheckResult: backgroundCheckResult as Prisma.JsonObject,
        verificationStatus: backgroundCheckResult.hasIssues
          ? VerificationStatus.PENDING_MANUAL_REVIEW
          : VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
      },
    });
    this.logger.log(`[VerificationService] submitCpfForBackgroundCheck: Status do provedor ${providerId} atualizado para ${backgroundCheckResult.hasIssues ? VerificationStatus.PENDING_MANUAL_REVIEW : VerificationStatus.PENDING_DOCUMENTS_UPLOAD}.`);
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

    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(`[VerificationService] uploadDocumentPhoto: URL do documento (${type}) salva para provider ${providerId}.`);

    await this.updateProviderVerificationStatus(providerId);
  }

  async uploadSelfieWithDocument(providerId: string, file: File): Promise<void> {
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

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { selfieWithDocumentUrl: fileUrl },
    });
    this.logger.log(`[VerificationService] uploadSelfieWithDocument: URL da selfie salva para provider ${providerId}.`);

    await this.updateProviderVerificationStatus(providerId);
  }

  async updateProviderVerificationStatus(providerId: string): Promise<void> {
    this.logger.log(`[VerificationService] updateProviderVerificationStatus: Verificando status para providerId: ${providerId}`);
    const provider = await this.providersService.findOne(providerId);

    if (!provider) {
      this.logger.warn(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} não encontrado.`);
      throw new NotFoundException('Provedor não encontrado.');
    }

    // Estas propriedades agora existem no tipo ProviderWithCalculatedRating
    const isCpfCheckedAndOk = provider.backgroundCheckResult && !(provider.backgroundCheckResult as any).hasIssues;
    const isDocumentFrontUploaded = provider.documentPhotoFrontUrl !== null && provider.documentPhotoFrontUrl !== undefined;
    const isDocumentBackUploaded = provider.documentPhotoBackUrl !== null && provider.documentPhotoBackUrl !== undefined;
    const isSelfieUploaded = provider.selfieWithDocumentUrl !== null && provider.selfieWithDocumentUrl !== undefined;

    let newStatus: VerificationStatus | undefined = undefined;

    if (isCpfCheckedAndOk && isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded) {
      if (provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW) {
        newStatus = VerificationStatus.APPROVED;
        this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} APROVADO.`);
      } else if (provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD) {
        newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
        this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} passou para PENDING_MANUAL_REVIEW.`);
      }
    } else if (isCpfCheckedAndOk && (isDocumentFrontUploaded || isDocumentBackUploaded || isSelfieUploaded)) {
      if (provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW &&
          provider.verificationStatus !== VerificationStatus.REJECTED &&
          provider.verificationStatus !== VerificationStatus.PENDING_BACKGROUND_CHECK) {
        newStatus = VerificationStatus.PENDING_DOCUMENTS_UPLOAD;
        this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} voltou para PENDING_DOCUMENTS_UPLOAD (faltam dados).`);
      }
    } else if (!isCpfCheckedAndOk && provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW && provider.verificationStatus !== VerificationStatus.REJECTED) {
      newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} tem problemas no CPF, requer revisão manual.`);
    }

    if (newStatus && newStatus !== provider.verificationStatus) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { verificationStatus: newStatus },
      });
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Status do provedor ${providerId} atualizado para ${newStatus}.`);
    } else if (!newStatus && provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD) {
        if (!(isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded)) {
            await this.prisma.provider.update({
                where: { id: providerId },
                data: { verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW },
            });
            this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} em PENDING_DOCUMENTS_UPLOAD, mas dados incompletos, movido para PENDING_MANUAL_REVIEW.`);
        }
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