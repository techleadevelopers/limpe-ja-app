// src/verification/verification.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitCpfDto } from './dto/submit-cpf.dto';
import { UploadDocumentDto, DocumentPhotoType } from './dto/upload-document.dto';
import { UploadSelfieDto } from './dto/upload-selfie.dto';
import { VerificationService } from './verification.service';
import { File } from 'multer'; // <-- ADICIONADO: Importar File diretamente de 'multer'

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('cpf')
  async submitCpf(@Request() req, @Body() submitCpfDto: SubmitCpfDto) {
    const providerId = req.user.id;
    await this.verificationService.submitCpfForBackgroundCheck(providerId, submitCpfDto.cpf);
    return { message: 'CPF enviado para verificação de antecedentes com sucesso.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('documents/identity')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentPhoto(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: File, // <-- ATUALIZADO: Usar File do multer
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem enviado.');
    }
    const providerId = req.user.id;
    const documentType = uploadDocumentDto.type || DocumentPhotoType.FRONT;
    await this.verificationService.uploadDocumentPhoto(providerId, file, documentType);
    return { message: `Foto do documento (${documentType}) enviada com sucesso.` };
  }

  @UseGuards(JwtAuthGuard)
  @Post('documents/selfie')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSelfie(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: File, // <-- ATUALIZADO: Usar File do multer
    @Body() uploadSelfieDto: UploadSelfieDto,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem enviado.');
    }
    const providerId = req.user.id;
    await this.verificationService.uploadSelfieWithDocument(providerId, file);
    return { message: 'Selfie com documento enviada com sucesso.' };
  }
}