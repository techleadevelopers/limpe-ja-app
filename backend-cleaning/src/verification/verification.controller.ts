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
  Get,
  ForbiddenException,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Request } from 'express';
import { SubmitCpfDto } from './dto/submit-cpf.dto';
import { DocumentPhotoType } from './dto/upload-document.dto';
import { UploadSelfieDto } from './dto/upload-selfie.dto';
import { VerificationService } from './verification.service';
import { ProviderWithCalculatedRating } from '../providers/providers.service';
import { VerificationStatus } from '../shared/enums/verification-status.enum';
import { Multer, memoryStorage } from 'multer';

export class UpdateVerificationStatusDto {
  @ApiProperty({ enum: VerificationStatus, description: 'Novo status de verificação' })
  @IsEnum(VerificationStatus, { message: 'O status de verificação é inválido.' })
  status: VerificationStatus;

  @ApiPropertyOptional({ description: 'Motivo da rejeição (obrigatório se status for REJECTED)' })
  @IsOptional()
  @IsString({ message: 'O motivo da rejeição deve ser uma string.' })
  reason?: string;
}

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly verificationService: VerificationService,
  ) { }

  @Get('pending-queue')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter a fila de provedores pendentes de verificação (ADMIN apenas)' })
  @ApiResponse({ status: 200, description: 'Lista de provedores pendentes de verificação.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido (requer função de ADMIN).' })
  async getPendingVerificationQueue(): Promise<ProviderWithCalculatedRating[]> {
    this.logger.log('[VerificationController] getPendingVerificationQueue: Recebido solicitação para a fila de verificação.');
    return this.verificationService.getPendingProviders();
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
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @Req() req: Request,
    @Param('type') type: DocumentPhotoType,
    @UploadedFile() file: Multer.File,
  ) {
    const providerId = req.user['providerId'];
    this.logger.log(`[VerificationController] uploadDocument: Recebido arquivo para providerId: ${providerId}, tipo: ${type}`);
    if (!file || !file.originalname || !file.buffer || !file.mimetype) {
      this.logger.error(`[VerificationController] uploadDocument: Arquivo inválido ou malformado recebido.`);
      throw new BadRequestException('Nenhum arquivo enviado ou o arquivo é inválido.');
    }
    if (!Object.values(DocumentPhotoType).includes(type)) {
      throw new BadRequestException('Tipo de documento inválido. Use FRONT ou BACK.');
    }
    await this.verificationService.uploadDocumentPhoto(providerId, file, type);
    return { message: `Documento (${type}) enviado com sucesso e enviado para revisão manual.` };
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
  @ApiResponse({ status: 200, description: 'Selfie enviada com sucesso.', schema: { type: 'object', properties: { message: { type: 'string' }, url: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Arquivo inválido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSelfie(
    @Req() req: Request,
    @UploadedFile() file: Multer.File,
  ) {
    const providerId = req.user['providerId'];
    this.logger.log(`[VerificationController] uploadSelfie: Recebido arquivo para providerId: ${providerId}`);
    if (!file || !file.originalname || !file.buffer || !file.mimetype) {
      this.logger.error(`[VerificationController] uploadSelfie: Arquivo inválido ou malformado recebido.`);
      throw new BadRequestException('Nenhum arquivo enviado ou o arquivo é inválido.');
    }
    const uploadedUrl = await this.verificationService.uploadSelfieWithDocument(providerId, file);
    return { message: 'Selfie com documento enviada com sucesso.', url: uploadedUrl };
  }

  @Post('upload-avatar')
  @Roles(UserRole.PROVIDER, UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload da foto de perfil (avatar)',
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
  @ApiOperation({ summary: 'Upload da foto de perfil (avatar)' })
  @ApiResponse({ status: 200, description: 'Avatar enviado com sucesso.', schema: { type: 'object', properties: { message: { type: 'string' }, url: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Arquivo inválido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário/Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Multer.File,
  ) {
    const providerId = req.user['providerId'];

    if (!providerId) {
      throw new BadRequestException('ID do provedor não encontrado no token. Este endpoint é para provedores.');
    }

    this.logger.log(`[VerificationController] uploadAvatar: Recebido arquivo para providerId: ${providerId}`);
    if (!file || !file.originalname || !file.buffer || !file.mimetype) {
      this.logger.error(`[VerificationController] uploadAvatar: Arquivo inválido ou malformado recebido.`);
      throw new BadRequestException('Nenhum arquivo enviado ou o arquivo é inválido.');
    }
    const uploadedUrl = await this.verificationService.uploadAvatar(providerId, file);
    return { message: 'Avatar enviado com sucesso.', url: uploadedUrl };
  }

  @Patch(':providerId/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o status de verificação de um provedor (ADMIN apenas)' })
  @ApiBody({ type: UpdateVerificationStatusDto })
  @ApiResponse({ status: 200, description: 'Status de verificação atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido (requer função de ADMIN).' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async updateVerificationStatus(
    @Param('providerId') providerId: string,
    @Body() updateDto: UpdateVerificationStatusDto,
  ) {
    this.logger.log(`[VerificationController] updateVerificationStatus: Recebido solicitação para ${providerId}, novo status: ${updateDto.status}. Motivo: ${updateDto.reason || 'N/A'}`);
    if (updateDto.status === VerificationStatus.REJECTED && !updateDto.reason) {
      throw new BadRequestException('O motivo da rejeição é obrigatório ao rejeitar um provedor.');
    }
    await this.verificationService.updateProviderVerificationStatusManually(providerId, updateDto.status, updateDto.reason);
    return { message: `Status de verificação para provedor ${providerId} atualizado para ${updateDto.status}.` };
  }

  @Post('reject/:providerId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { reason: { type: 'string', description: 'Motivo da rejeição' } } }})
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

  @Get('status/:providerId')
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
      const providerByUser = await this.verificationService['providersService'].findByUserId(requestingUserId);
      if (!providerByUser || providerByUser.id !== paramProviderId) {
        throw new ForbiddenException('Você não tem permissão para ver o status de verificação deste provedor.');
      }
      providerIdToFetch = providerByUser.id;
    }
    const provider = await this.verificationService['providersService'].findOne(providerIdToFetch);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }
    const isCpfCheckedAndOk = false;
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