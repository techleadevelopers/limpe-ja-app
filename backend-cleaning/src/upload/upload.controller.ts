import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Arquivo ausente no upload de avatar', 400);
    }

    this.logger.log(
      `[UploadController] uploadAvatar: recebendo ${file.originalname} (${file.mimetype})`,
    );

    return this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type?: string,
  ) {
    if (!file) {
      throw new HttpException('Arquivo ausente no upload de documento', 400);
    }

    this.logger.log(
      `[UploadController] uploadDocument: recebendo ${file.originalname} (type=${type || 'N/A'})`,
    );

    return this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Post('selfie')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSelfie(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Arquivo ausente no upload de selfie', 400);
    }

    this.logger.log(
      `[UploadController] uploadSelfie: recebendo ${file.originalname} (${file.mimetype})`,
    );

    return this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }
}
