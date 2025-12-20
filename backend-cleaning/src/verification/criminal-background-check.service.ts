// src/verification/criminal-background-check.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
}

type BackgroundCheckApiResponse = {
  success?: boolean;
  hasNegativeRecords?: boolean;
  details?: string;
  reportId?: string;
};

@Injectable()
export class CriminalBackgroundCheckService {
  private readonly logger = new Logger(CriminalBackgroundCheckService.name);

  constructor(private configService: ConfigService) {}

  private toMessage(data: unknown): string {
    if (typeof data === 'string') return data;
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
    ) {
      return (data as Record<string, unknown>).message as string;
    }
    return 'Erro desconhecido';
  }

  async checkCpf(cpf: string): Promise<BackgroundCheckResult> {
    this.logger.log(`Iniciando verificação de antecedentes para CPF: ${cpf}`);

    const thirdPartyApiUrl = this.configService.get<string>(
      'thirdPartyBackgroundCheck.apiUrl',
    );
    const apiKey = this.configService.get<string>(
      'thirdPartyBackgroundCheck.apiKey',
    );

    if (!thirdPartyApiUrl || !apiKey) {
      this.logger.error(
        'Variáveis de ambiente para API de background check não configuradas. Não é possível realizar a verificação real.',
      );
      throw new InternalServerErrorException(
        'Configuração da API de verificação de antecedentes ausente.',
      );
    }

    try {
      this.logger.log(
        `Chamando API de background check em: ${thirdPartyApiUrl}`,
      );
      const response = await fetch(`${thirdPartyApiUrl}/check-cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json();
        const message = this.toMessage(errorData);
        this.logger.error(
          `API de background check retornou erro: ${response.status} - ${message}`,
        );
        throw new InternalServerErrorException(
          `API de background check retornou erro: ${message}`,
        );
      }

      const result = (await response.json()) as BackgroundCheckApiResponse;
      this.logger.log(
        `Resposta da API de background check para CPF ${cpf}: ${JSON.stringify(result)}`,
      );

      return {
        status: result.success ? 'SUCCESS' : 'FAILED',
        hasIssues: result.hasNegativeRecords ?? false,
        details:
          typeof result.details === 'string' ? result.details : undefined,
        reportId:
          typeof result.reportId === 'string' ? result.reportId : undefined,
      };
    } catch (error: unknown) {
      const message = this.toMessage(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        'Erro ao chamar a API de background check:',
        message,
        stack,
      );
      throw new InternalServerErrorException(
        'Falha ao realizar a verificação de antecedentes. Verifique logs para detalhes.',
      );
    }
  }
}
