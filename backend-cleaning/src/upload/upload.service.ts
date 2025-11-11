import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UploadService {
  private readonly apiUrl = process.env.UPLOADTHING_URL || 'https://api.uploadthing.com/v1';
  private readonly apiKey = process.env.UPLOADTHING_SECRET as string;
  private readonly appId = process.env.UPLOADTHING_APP_ID as string;

  private ensureConfig() {
    if (!this.apiKey || !this.appId) {
      throw new HttpException('UploadThing não configurado (chaves ausentes)', 500);
    }
  }

  async uploadFile(buffer: Buffer, filename: string, contentType: string) {
    this.ensureConfig();
    try {
      // 1) Cria URL temporária
      const { data } = await axios.post(
        `${this.apiUrl}/upload/create`,
        {
          files: [
            {
              name: filename,
              size: buffer.length,
              type: contentType,
            },
          ],
          appId: this.appId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-uploadthing-api-key': this.apiKey,
          },
        },
      );

      const uploadUrl = data?.[0]?.url;
      const fileKey = data?.[0]?.key;
      if (!uploadUrl || !fileKey) throw new Error('Falha ao criar URL de upload');

      // 2) PUT do arquivo
      await axios.put(uploadUrl, buffer, { headers: { 'Content-Type': contentType } });

      // 3) URL pública final
      const publicUrl = `https://utfs.io/f/${fileKey}`;
      return { ok: true, url: publicUrl };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[UploadThing Error]', error?.response?.data || error?.message || error);
      throw new HttpException('Falha ao fazer upload no UploadThing', 500);
    }
  }
}

