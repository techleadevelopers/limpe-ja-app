// src/verification/verification.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { File } from 'multer';
import axios from 'axios';
import FormData = require('form-data');
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProvidersService,
  ProviderWithCalculatedRating,
} from '../providers/providers.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { CacheService } from '../cache/cache.service';

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
    private readonly cacheService: CacheService,
  ) {}

  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(
      `[VerificationService] getPendingProviders: Buscando provedores pendentes.`,
    );
    const cacheKey = 'verification:pending-queue';
    const cached =
      await this.cacheService.get<ProviderWithCalculatedRating[]>(cacheKey);
    if (cached?.length) {
      this.logger.log(
        `[VerificationService] getPendingProviders: Retornando ${cached.length} itens do cache.`,
      );
      return cached;
    }
    const providers = await this.providersService.getPendingProviders();
    const normalized = providers || [];
    await this.cacheService.set(cacheKey, normalized, 10);
    return providers || [];
  }

  async uploadAvatar(
    providerId: string,
    file: File,
    options?: { premiumAvatar?: boolean },
  ): Promise<string> {
    this.logger.log(
      `[VerificationService] uploadAvatar: Iniciando para providerId: ${providerId}`,
    );
    if (options?.premiumAvatar) {
      this.logger.log(
        `[VerificationService] uploadAvatar: Pipeline premium solicitado para providerId: ${providerId}.`,
      );
    }

    const visionUrl = process.env.VISION_IA_URL;
    if (!visionUrl) {
      this.logger.error(
        '[VerificationService] uploadAvatar: VISION_IA_URL não configurada.',
      );
      throw new InternalServerErrorException('Visão IA ausente.');
    }

    const form = new FormData();
    const filename = file.originalname || `avatar-${Date.now()}.jpg`;
    form.append('file', file.buffer, {
      filename,
      contentType: file.mimetype || 'image/jpeg',
    } as any);

    let responseUrl: string | undefined;
    const visionStart = Date.now();
    try {
      const response = await axios.post(
        `${visionUrl}/vision/process-avatar`,
        form,
        {
          headers: form.getHeaders(),
        timeout: 60_000,
      },
    );
    responseUrl = response.data?.url;
    this.logger.log(
      `[VerificationService] uploadAvatar: Vision IA respondeu em ${
        Date.now() - visionStart
      } ms.`,
    );
  } catch (error: any) {
    this.logger.error(
      `[VerificationService] uploadAvatar: Falha ao chamar Vision IA: ${error?.message || error}`,
    );
    this.logger.log(
      `[VerificationService] uploadAvatar: Vision IA falhou após ${
        Date.now() - visionStart
      } ms.`,
    );
  }

    if (!responseUrl) {
      this.logger.warn(
        '[VerificationService] uploadAvatar: Vision IA não retornou URL, utilizando fallback.',
      );
      const fallbackPath = `provider-avatars/${providerId}/${filename}`;
      try {
        responseUrl = await this.documentProcessingService.uploadImage(
          file,
          fallbackPath,
          'avatar',
        );
        this.logger.log(
          `[VerificationService] uploadAvatar: Fallback completo com URL ${responseUrl}`,
        );
      } catch (fallbackError: any) {
        this.logger.error(
          `[VerificationService] uploadAvatar: Fallback falhou ao enviar avatar direto: ${(fallbackError as Error)?.message || fallbackError}`,
        );
        throw new InternalServerErrorException('Falha ao enviar avatar.');
      }
    }

    // Atualiza o banco com a foto TRATADA pela IA
    await this.prisma.provider.update({
      where: { id: providerId },
      data: { avatarUrl: responseUrl },
    });

    this.logger.log(`[VerificationService] Avatar processado com sucesso: ${responseUrl}`);

    // RETORNO ÚNICO: A URL da foto com fundo cinza
    return responseUrl;
  }

  async uploadDocumentPhoto(
    providerId: string,
    file: File,
    type: 'FRONT' | 'BACK',
  ): Promise<string> {
    // Alteração de Promise<void> para Promise<string>
    this.logger.log(
      `[VerificationService] uploadDocumentPhoto: Iniciando para providerId: ${providerId}, tipo: ${type}`,
    );
    const fileUrl = await this.handleDocumentUpload(
      providerId,
      file,
      'uploadDocumentPhoto',
      (extension) =>
        `provider-documents/${providerId}/${type.toLowerCase()}-${Date.now()}.${extension}`,
      (fileUrl) => ({
        ...(type === 'FRONT'
          ? { documentPhotoFrontUrl: fileUrl }
          : { documentPhotoBackUrl: fileUrl }),
      }),
      true,
    );
    this.logger.log(
      `[VerificationService] uploadDocumentPhoto: Imagem enviada para ${fileUrl}`,
    );
    this.logger.log(
      `[VerificationService] uploadDocumentPhoto: URL do documento (${type}) salva para provider ${providerId}.`,
    );
    return fileUrl; // Adicionando o retorno da URL aqui
  }

  async uploadSelfieWithDocument(
    providerId: string,
    file: File,
  ): Promise<string> {
    this.logger.log(
      `[VerificationService] uploadSelfieWithDocument: Iniciando para providerId: ${providerId}`,
    );
    const fileUrl = await this.handleDocumentUpload(
      providerId,
      file,
      'uploadSelfieWithDocument',
      (extension) =>
        `provider-documents/${providerId}/selfie-${Date.now()}.${extension}`,
      (fileUrl) => ({ selfieWithDocumentUrl: fileUrl }),
      true,
    );
    this.logger.log(
      `[VerificationService] uploadSelfieWithDocument: Selfie enviada para ${fileUrl}`,
    );
    this.logger.log(
      `[VerificationService] URL da selfie salva para provider ${providerId}.`,
    );
    return fileUrl;
  }

  private async handleDocumentUpload(
    providerId: string,
    file: File,
    actionName: string,
    destinationPathBuilder: (extension: string) => string,
    updateDataBuilder: (fileUrl: string) => Prisma.ProviderUpdateInput,
    shouldRefreshStatus = false,
  ): Promise<string> {
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(
        `[VerificationService] ${actionName}: Provedor ${providerId} não encontrado.`,
      );
      throw new NotFoundException('Provedor não encontrado.');
    }

    const fileExtension = file.originalname?.split('.').pop() || 'jpg';
    const destinationPath = destinationPathBuilder(fileExtension);

    const fileUrl = await this.documentProcessingService.uploadImage(
      file,
      destinationPath,
      undefined,
    );

    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateDataBuilder(fileUrl),
    });

    if (shouldRefreshStatus) {
      await this.updateStatusForManualReview(providerId);
    }

    return fileUrl;
  }

  /**
   * NOVO MÉTODO: Verifica se todos os documentos necessários foram enviados
   * e, em caso afirmativo, atualiza o status do provedor para PENDING_ADMIN_REVIEW.
   */
  private async updateStatusForManualReview(providerId: string): Promise<void> {
    this.logger.log(
      `[VerificationService] updateStatusForManualReview: Verificando documentos para provedor ${providerId}.`,
    );
    const provider = await this.providersService.findOne(providerId);

    if (!provider) {
      this.logger.warn(
        `[VerificationService] updateStatusForManualReview: Provedor ${providerId} não encontrado.`,
      );
      return;
    }

    const isDocumentFrontUploaded = !!provider.documentPhotoFrontUrl;
    const isDocumentBackUploaded = !!provider.documentPhotoBackUrl;
    const isSelfieUploaded = !!provider.selfieWithDocumentUrl;

    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded) {
      if (
        provider.verificationStatus !== VerificationStatus.PENDING_MANUAL_REVIEW
      ) {
        await this.prisma.provider.update({
          where: { id: providerId },
          data: {
            verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW,
          },
        });
        this.logger.log(
          `[VerificationService] Status do provedor ${providerId} atualizado para PENDING_MANUAL_REVIEW após upload completo.`,
        );
        // Aqui você pode adicionar uma notificação para o administrador, se desejar.
      }
    } else {
      // Se ainda faltam documentos, mantém o status atual ou define como PENDING_DOCUMENTS_UPLOAD
      if (
        provider.verificationStatus !==
        VerificationStatus.PENDING_DOCUMENTS_UPLOAD
      ) {
        await this.prisma.provider.update({
          where: { id: providerId },
          data: {
            verificationStatus: VerificationStatus.PENDING_DOCUMENTS_UPLOAD,
          },
        });
        this.logger.log(
          `[VerificationService] Status do provedor ${providerId} atualizado para PENDING_DOCUMENTS_UPLOAD (faltam documentos).`,
        );
      }
    }
  }

  async updateProviderVerificationStatusManually(
    providerId: string,
    newStatus: VerificationStatus,
    reason?: string,
  ): Promise<void> {
    this.logger.log(
      `[VerificationService] updateProviderVerificationStatusManually: Atualizando status para ${providerId} para ${newStatus}. Motivo: ${reason || 'N/A'}`,
    );
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(
        `[VerificationService] updateProviderVerificationStatusManually: Provedor ${providerId} n�o encontrado.`,
      );
      throw new NotFoundException('Provedor n�o encontrado.');
    }
    const previousStatus = provider.verificationStatus;

    if (newStatus === VerificationStatus.REJECTED && !reason) {
      throw new BadRequestException(
        'O motivo da rejei��o � obrigat�rio ao definir o status como REJECTED.',
      );
    }

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationStatus: newStatus,
        rejectionReason:
          newStatus === VerificationStatus.REJECTED ? reason : null,
      },
    });
    this.logger.log(
      `[VerificationService] updateProviderVerificationStatusManually: Status de verifica��o do provedor ${providerId} atualizado para ${newStatus}.`,
    );
    if (
      previousStatus !== newStatus &&
      (previousStatus === VerificationStatus.APPROVED ||
        newStatus === VerificationStatus.APPROVED)
    ) {
      void this.providersService.refreshDefaultSearchCache();
    }
  }

  // Métodos de atualização de resultado de OCR e Liveness agora não são usados no fluxo síncrono.
  // Eles podem ser mantidos para uma futura implementação assíncrona, mas o fluxo atual não os invoca.
  async updateProviderOcrResult(
    providerId: string,
    ocrResult: OcrResult,
    type: 'FRONT' | 'BACK',
  ): Promise<void> {
    const updateData: Prisma.ProviderUpdateInput = {
      ocrResult: ocrResult as unknown as Prisma.JsonObject,
    };
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(
      `[VerificationService] OCR result para ${type} do provedor ${providerId} atualizado.`,
    );
  }

  async updateProviderLivenessResult(
    providerId: string,
    livenessResult: LivenessResult,
  ): Promise<void> {
    const updateData: Prisma.ProviderUpdateInput = {
      livenessResult: livenessResult as unknown as Prisma.JsonObject,
    };
    await this.prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    this.logger.log(
      `[VerificationService] Liveness check result para provedor ${providerId} atualizado.`,
    );
  }

  async updateProviderFaceComparisonResult(
    providerId: string,
    faceComparisonResult: FaceComparisonResult,
  ): Promise<void> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (provider && provider.livenessResult) {
      const currentLiveness =
        provider.livenessResult as unknown as LivenessResult & {
          faceComparison?: FaceComparisonResult;
        };
      currentLiveness.faceComparison = faceComparisonResult;
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          livenessResult: currentLiveness as unknown as Prisma.JsonObject,
        },
      });
      this.logger.log(
        `[VerificationService] Face comparison result para provedor ${providerId} atualizado.`,
      );
    }
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    this.logger.log(
      `[VerificationService] rejectProvider: Rejeitando provedor ${providerId} com motivo: ${reason}`,
    );
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      throw new NotFoundException('Provedor n�o encontrado.');
    }
    const wasApproved =
      provider.verificationStatus === VerificationStatus.APPROVED;

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason,
      },
    });
    this.logger.log(
      `[VerificationService] rejectProvider: Provedor ${providerId} rejeitado.`,
    );
    if (wasApproved) {
      void this.providersService.refreshDefaultSearchCache();
    }
  }

  // NOVO MÉTODO: Avança o status de verificação.
  async advanceVerificationStatus(providerId: string): Promise<void> {
    this.logger.log(
      `[VerificationService] advanceVerificationStatus: Iniciando avanço de status para o provedor ${providerId}.`,
    );
    const provider = await this.providersService.findOne(providerId);
    if (!provider) {
      this.logger.warn(
        `[VerificationService] advanceVerificationStatus: Provedor ${providerId} não encontrado.`,
      );
      throw new NotFoundException('Provedor não encontrado.');
    }

    if (provider.verificationStatus !== VerificationStatus.PENDING_INITIAL_REVIEW) {
      this.logger.log(
        `[VerificationService] advanceVerificationStatus: Provedor ${providerId} já está em "${provider.verificationStatus}" — nada a fazer.`,
      );
      return;
    }

    // Altere o status para PENDING_DOCUMENTS_UPLOAD, permitindo o próximo passo no fluxo.
    await this.prisma.provider.update({
      where: { id: providerId },
      data: { verificationStatus: VerificationStatus.PENDING_DOCUMENTS_UPLOAD },
    });
    this.logger.log(
      `[VerificationService] Status do provedor ${providerId} atualizado para ${VerificationStatus.PENDING_DOCUMENTS_UPLOAD}.`,
    );
  }
}
