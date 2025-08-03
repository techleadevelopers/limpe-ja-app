import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Importe CriminalBackgroundCheckService foi removido
import { DocumentProcessingService } from './document-processing.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { ProvidersService, ProviderWithIncludes, ProviderWithCalculatedRating } from '../providers/providers.service';
import { Prisma } from '@prisma/client';
import { File } from 'multer';

// A interface BackgroundCheckResult não é mais necessária se o serviço for removido
/*
interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
  [key: string]: any;
}
*/

// Interfaces para resultados de OCR e Liveness (mantidas)
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
    // criminalBackgroundCheckService foi removido do construtor
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly providersService: ProvidersService,
  ) {}

  /**
   * Obtém a lista de provedores pendentes de verificação.
   * Delega a chamada para ProvidersService.
   * @returns Uma lista de provedores pendentes de verificação.
   */
  async getPendingProviders(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log(`[VerificationService] getPendingProviders: Buscando provedores pendentes.`);
    
    const providers = await this.providersService.getPendingProviders(); // Chama o método ajustado no ProvidersService
    return providers || []; // Garante que um array seja retornado
  }


  // O método submitCpfForBackgroundCheck foi removido, pois não há mais verificação de antecedentes criminais
  /*
  async submitCpfForBackgroundCheck(providerId: string, cpf: string): Promise<void> {
    this.logger.log(`[VerificationService] submitCpfForBackgroundCheck: Iniciando para providerId: ${providerId}`);
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
        backgroundCheckResult: backgroundCheckResult as unknown as Prisma.JsonObject,
        verificationStatus: backgroundCheckResult.hasIssues
          ? VerificationStatus.PENDING_MANUAL_REVIEW
          : VerificationStatus.PENDING_DOCUMENTS_UPLOAD, // Ajustado para ir para upload de documentos
      },
    });
    this.logger.log(`[VerificationService] submitCpfForBackgroundCheck: Status do provedor ${providerId} atualizado para ${backgroundCheckResult.hasIssues ? VerificationStatus.PENDING_MANUAL_REVIEW : VerificationStatus.PENDING_DOCUMENTS_UPLOAD}.`);
  }
  */

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

    // Processar OCR no documento enviado
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

    const updateData: Prisma.ProviderUpdateInput = { selfieWithDocumentUrl: fileUrl };

    // Realizar Face Comparison e Liveness Check
    if (provider.documentPhotoFrontUrl) {
      try {
        // O resultado de FaceComparisonResult e LivenessResult serão armazenados no mesmo campo livenessResult
        const faceComparisonResult: FaceComparisonResult = await this.documentProcessingService.compareFaces(file, provider.documentPhotoFrontUrl);
        // É importante que o livenessResult do provedor no banco de dados possa armazenar ambos os resultados ou que você decida qual priorizar.
        // Por simplicidade, estou sobrescrevendo aqui, mas em um cenário real, você pode querer um campo separado ou um objeto JSON mais complexo.
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
      // Se você já atribuiu faceComparisonResult a updateData.livenessResult, considere como combinar os resultados
      // Por agora, estou sobrescrevendo, o que significa que o resultado do liveness check terá precedência se ambos forem chamados.
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
  }

  // Método para aprovação/rejeição manual por um ADMIN
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

    // `isCpfCheckedAndOk` e `provider.backgroundCheckResult` foram removidos da lógica,
    // pois a verificação de antecedentes criminais não será mais um passo automático.
    // O campo `backgroundCheckResult` ainda pode existir no modelo Prisma, mas não será usado aqui para transição automática.

    const isDocumentFrontUploaded = provider.documentPhotoFrontUrl !== null && provider.documentPhotoFrontUrl !== undefined;
    const isDocumentBackUploaded = provider.documentPhotoBackUrl !== null && provider.documentPhotoBackUrl !== undefined;
    const isSelfieUploaded = provider.selfieWithDocumentUrl !== null && provider.selfieWithDocumentUrl !== undefined;

    // Verificar resultados de OCR e Liveness
    const isOcrProcessedAndOk = provider.ocrResult && (provider.ocrResult as unknown as OcrResult).confidence > 0.7;
    const isLivenessCheckPassed = provider.livenessResult && (provider.livenessResult as unknown as LivenessResult).isLive;

    let newStatus: VerificationStatus | undefined = undefined;

    // Se o provedor já foi rejeitado ou bloqueado manualmente, não altere o status automaticamente.
    if (provider.verificationStatus === VerificationStatus.REJECTED || provider.verificationStatus === VerificationStatus.BLOCKED) {
      return;
    }

    // Lógica de transição de status sem a verificação de antecedentes criminais como um passo
    if (isDocumentFrontUploaded && isDocumentBackUploaded && isSelfieUploaded && isOcrProcessedAndOk && isLivenessCheckPassed) {
      // Se todos os documentos e verificações faciais estão OK, aprova automaticamente
      newStatus = VerificationStatus.APPROVED;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} APROVADO automaticamente.`);
    } else if (
      // Se há problemas com OCR ou Liveness, requer revisão manual
      (provider.ocrResult && !(provider.ocrResult as unknown as OcrResult).extractedText) || // OCR falhou em extrair texto
      (provider.livenessResult && !(provider.livenessResult as unknown as LivenessResult).isLive) // Liveness check falhou
    ) {
      newStatus = VerificationStatus.PENDING_MANUAL_REVIEW;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} tem problemas em verificações automáticas (OCR/Liveness), requer revisão manual.`);
    } else if (!isDocumentFrontUploaded || !isDocumentBackUploaded || !isSelfieUploaded) {
      // Se faltam documentos ou selfie, o status é PENDING_DOCUMENTS_UPLOAD
      newStatus = VerificationStatus.PENDING_DOCUMENTS_UPLOAD;
      this.logger.log(`[VerificationService] updateProviderVerificationStatus: Provedor ${providerId} passou para PENDING_DOCUMENTS_UPLOAD (faltam dados).`);
    } else if (provider.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW) {
      // Se ainda está na revisão inicial e nenhum dos critérios acima foi atendido, mantém o status
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