import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZapiService {
  private readonly logger = new Logger(ZapiService.name);
  private readonly client: AxiosInstance | null;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('zapi.baseUrl');
    const token = this.configService.get<string>('zapi.token');

    if (!baseUrl || !token?.trim()) {
      this.logger.warn(
        '[ZapiService] Z-API não configurada corretamente; chamadas serão ignoradas.',
      );
      this.client = null;
      return;
    }

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
        'client-token': token.trim(),
      },
    });
  }

  async notificarFotoIrregular(phone: string, name: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        '[ZapiService] Cliente HTTP indisponível; não executar notificação.',
      );
      return;
    }

    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      this.logger.warn(
        '[ZapiService] Número inválido para notificar foto irregular; operação ignorada.',
      );
      return;
    }

    const receiverName = name?.trim() || 'prestador';
    const message = `Olá ${receiverName}! 🚀 Aqui é o Zé do LimpeJá. Sua foto de perfil precisa de um ajuste para a Vitrine Premium: blusa PRETA lisa e um pouco mais afastada (estilo 3x4). Pode nos enviar uma nova?`;

    try {
      const response = await this.client.post('/send-text', {
        phone: normalizedPhone,
        message,
      });
      this.logger.log(
        `[ZapiService] Notificação de foto irregular enviada para ${normalizedPhone} (status ${response.status}).`,
      );
    } catch (error: unknown) {
      const detail = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error;
      this.logger.error(
        `[ZapiService] Falha ao notificar ${normalizedPhone}: ${detail}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private normalizePhone(phone: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
}
