// src/verification/verification.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  Get, // <-- ADICIONADO
  ForbiddenException, // <-- ADICIONADO
  NotFoundException, // <-- ADICIONADO
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { SubmitCpfDto } from './dto/submit-cpf.dto';
import { UploadDocumentDto, DocumentPhotoType } from './dto/upload-document.dto';
import { UploadSelfieDto } from './dto/upload-selfie.dto';
import { VerificationService } from './verification.service';
import { ProviderWithCalculatedRating } from '../providers/providers.service'; // <-- AGORA USAMOS ProviderWithCalculatedRating
import { VerificationStatus } from '../shared/enums/verification-status.enum'; // <-- ADICIONADO

import { Multer } from 'multer'; // <-- ADICIONADO: Importar Multer para tipagem correta

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly verificationService: VerificationService,
    // ProvidersService não é mais necessário aqui, pois VerificationService já lida com a busca do provedor
    // private readonly providersService: ProvidersService,
  ) {}

  @Post('submit-cpf')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submeter CPF para verificação de antecedentes' })
  @ApiResponse({ status: 200, description: 'CPF submetido com sucesso para verificação.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async submitCpf(@Req() req: Request, @Body() submitCpfDto: SubmitCpfDto) {
    const providerId = req.user['providerId'];
    this.logger.log(`[VerificationController] submitCpf: Recebido CPF para providerId: ${providerId}`);
    await this.verificationService.submitCpfForBackgroundCheck(providerId, submitCpfDto.cpf);
    return { message: 'CPF submetido com sucesso para verificação de antecedentes.' };
  }

  @Post('upload-document/:type')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload da foto do documento (frente ou verso)',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload da foto do documento (frente ou verso)' })
  @ApiResponse({ status: 200, description: 'Documento enviado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou tipo de documento desconhecido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: Request,
    @Param('type') type: DocumentPhotoType,
    @UploadedFile() file: Multer.File, // <-- CORREÇÃO AQUI
  ) {
    const providerId = req.user['providerId'];
    this.logger.log(`[VerificationController] uploadDocument: Recebido arquivo para providerId: ${providerId}, tipo: ${type}`);

    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    if (!Object.values(DocumentPhotoType).includes(type)) {
      throw new BadRequestException('Tipo de documento inválido. Use FRONT ou BACK.');
    }

    await this.verificationService.uploadDocumentPhoto(providerId, file, type);
    return { message: `Documento (${type}) enviado com sucesso.` };
  }

  @Post('upload-selfie')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload da selfie com documento',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload da selfie com documento' })
  @ApiResponse({ status: 200, description: 'Selfie enviada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSelfie(
    @Req() req: Request,
    @UploadedFile() file: Multer.File, // <-- CORREÇÃO AQUI
  ) {
    const providerId = req.user['providerId'];
    this.logger.log(`[VerificationController] uploadSelfie: Recebido arquivo para providerId: ${providerId}`);

    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    await this.verificationService.uploadSelfieWithDocument(providerId, file);
    return { message: 'Selfie com documento enviada com sucesso.' };
  }

  @Post('reject/:providerId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeitar um provedor e fornecer um motivo' })
  @ApiResponse({ status: 200, description: 'Provedor rejeitado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async rejectProvider(
    @Param('providerId') providerId: string,
    @Body('reason') reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException('O motivo da rejeição é obrigatório.');
    }
    this.logger.log(`[VerificationController] rejectProvider: Rejeitando provedor ${providerId} com motivo: ${reason}`);
    await this.verificationService.rejectProvider(providerId, reason);
    return { message: `Provedor ${providerId} rejeitado com sucesso.` };
  }

  @Get('status/:providerId') // <-- CORREÇÃO: Adicionado Get
  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter o status de verificação de um provedor' })
  @ApiResponse({ status: 200, description: 'Status de verificação do provedor.', schema: {
    type: 'object',
    properties: {
      verificationStatus: { type: 'string', enum: Object.values(VerificationStatus) },
      isCpfCheckedAndOk: { type: 'boolean' },
      isDocumentFrontUploaded: { type: 'boolean' },
      isDocumentBackUploaded: { type: 'boolean' },
      isSelfieUploaded: { type: 'boolean' },
      rejectionReason: { type: 'string', nullable: true },
    }
  }})
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async getVerificationStatus(@Req() req: Request, @Param('providerId') paramProviderId: string) {
    const requestingUserId = req.user['userId'];
    const requestingUserRole = req.user['role'];

    let providerIdToFetch = paramProviderId;

    if (requestingUserRole === UserRole.PROVIDER) {
      // Usar findByUserId para obter o provedor do usuário logado
      const providerByUser = await this.verificationService['providersService'].findByUserId(requestingUserId); // Acesso direto ao providersService via VerificationService
      if (!providerByUser || providerByUser.id !== paramProviderId) {
        throw new ForbiddenException('Você não tem permissão para ver o status de verificação deste provedor.');
      }
      providerIdToFetch = providerByUser.id;
    }

    // Usar findOne do VerificationService que já retorna ProviderWithCalculatedRating
    const provider = await this.verificationService['providersService'].findOne(providerIdToFetch); // Acesso direto ao providersService via VerificationService
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    const isCpfCheckedAndOk = provider.backgroundCheckResult && !(provider.backgroundCheckResult as any).hasIssues;
    const isDocumentFrontUploaded = provider.documentPhotoFrontUrl !== null && provider.documentPhotoFrontUrl !== undefined;
    const isDocumentBackUploaded = provider.documentPhotoBackUrl !== null && provider.documentPhotoBackUrl !== undefined;
    const isSelfieUploaded = provider.selfieWithDocumentUrl !== null && provider.selfieWithDocumentUrl !== undefined;

    return {
      verificationStatus: provider.verificationStatus,
      isCpfCheckedAndOk,
      isDocumentFrontUploaded,
      isDocumentBackUploaded,
      isSelfieUploaded,
      rejectionReason: provider.rejectionReason,
    };
  }
}