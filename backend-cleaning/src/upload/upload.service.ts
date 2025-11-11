import { Injectable, HttpException, Logger } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Usa o token v7+ (eyJ...)
  private readonly serverToken = process.env.UPLOADTHING_TOKEN;

  private readonly utapi = new UTApi({
    token: this.serverToken,
  });

  private ensureConfig() {
    if (!this.serverToken) {
      throw new HttpException(
        'UploadThing não configurado (UPLOADTHING_TOKEN ausente)',
        500,
      );
    }
  }

  async uploadFile(buffer: Buffer, filename: string, contentType: string) {
    this.ensureConfig();

    try {
      const ct = contentType || 'application/octet-stream';
      const tokenPreview = this.serverToken?.slice(0, 12) || 'none';
      this.logger.log(
        `[UploadThing] Enviando upload via UTApi (filename=${filename}, contentType=${ct}, token~=${tokenPreview}...)`,
      );

      // ✅ Cria um Blob real e adiciona propriedades exigidas pelo tipo FileEsque
      const blob = new Blob([new Uint8Array(buffer)], { type: ct }) as Blob & {
        name: string;
        lastModified: number;
      };
      blob.name = filename;
      blob.lastModified = Date.now();

      // ✅ Agora o tipo corresponde exatamente a FileEsque
      const result = await this.utapi.uploadFiles(blob);

      if ((result as any)?.error) {
        throw new Error((result as any).error?.message || 'UploadThing error');
      }

      const data: any = (result as any)?.data;
      const file = Array.isArray(data) ? data[0] : data;
      const url =
        file?.url || (file?.key ? `https://utfs.io/f/${file.key}` : undefined);

      if (!url) {
        throw new Error('UploadThing não retornou URL pública válida.');
      }

      this.logger.log(`[UploadThing] Upload concluído: ${url}`);
      return { ok: true, url };
    } catch (error: any) {
      this.logger.error('[UploadThing Error]', error);
      throw new HttpException('Falha ao fazer upload no UploadThing', 500);
    }
  }
}
