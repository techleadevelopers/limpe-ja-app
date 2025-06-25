// src/verification/verification.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriminalBackgroundCheckService } from './criminal-background-check.service';
import { DocumentProcessingService } from './document-processing.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { ProvidersService } from '../providers/providers.service';
import { Prisma } from '@prisma/client';
import { File } from 'multer'; // <-- ADICIONADO: Importar File diretamente de 'multer'

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
  [key: string]: any;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly criminalBackgroundCheckService: CriminalBackgroundCheckService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly providersService: ProvidersService,
  ) {}

  async submitCpfForBackgroundCheck(providerId: string, cpf: string): Promise<void> {
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { cpf: cpf },
    });

    const backgroundCheckResult: BackgroundCheckResult = await this.criminalBackgroundCheckService.checkCpf(cpf);

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        backgroundCheckResult: backgroundCheckResult as Prisma.JsonObject,
        verificationStatus: backgroundCheckResult.hasIssues
          ? VerificationStatus.PENDING_MANUAL_REVIEW
          : VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
      },
    });
  }

  async uploadDocumentPhoto(
    providerId: string,
    file: File, // <-- ATUALIZADO: Usar File do multer
    type: 'FRONT' | 'BACK',
  ): Promise<void> {
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileUrl = await this.documentProcessingService.uploadImage(file, `documents/${providerId}/${type.toLowerCase()}_${file.originalname}`);

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

    const updatedProvider = await this.providersService.findOne(providerId);
    if (updatedProvider?.documentPhotoFrontUrl && updatedProvider?.documentPhotoBackUrl && updatedProvider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW },
      });
    }
  }

  async uploadSelfieWithDocument(providerId: string, file: File): Promise<void> { // <-- ATUALIZADO: Usar File do multer
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileUrl = await this.documentProcessingService.uploadImage(file, `selfies/${providerId}/selfie_${file.originalname}`);

    await this.prisma.provider.update({
      where: { id: providerId },
      data: { selfieWithDocumentUrl: fileUrl },
    });

    await this.updateProviderVerificationStatus(providerId);
  }

  async updateProviderVerificationStatus(providerId: string): Promise<void> {
    const provider = await this.providersService.findOne(providerId);

    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    const isCpfChecked = provider.backgroundCheckResult !== null && !(provider.backgroundCheckResult as any).hasIssues;
    const isDocumentFrontUploaded = provider.documentPhotoFrontUrl !== null;
    const isSelfieUploaded = provider.selfieWithDocumentUrl !== null;

    if (isCpfChecked && isDocumentFrontUploaded && isSelfieUploaded && provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW) {
      await this.prisma.provider.update({
        where: { id: providerId },
        data: { verificationStatus: VerificationStatus.APPROVED },
      });
      console.log(`Provedor ${providerId} APROVADO.`);
    } else if (
        (isCpfChecked && isDocumentFrontUploaded && isSelfieUploaded) &&
        (provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW)
    ) {
        console.log(`Provedor ${providerId} aguardando revisão manual.`);
    }
    else {
        if (provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW && provider.verificationStatus !== VerificationStatus.REJECTED) {
            await this.prisma.provider.update({
                where: { id: providerId },
                data: { verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW },
            });
            console.log(`Provedor ${providerId} precisa de revisão manual.`);
        }
    }
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason,
      },
    });
  }
}