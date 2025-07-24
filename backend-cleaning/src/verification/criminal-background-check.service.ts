// src/verification/criminal-background-check.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Para acessar variáveis de ambiente

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
}

@Injectable()
export class CriminalBackgroundCheckService {
  private readonly logger = new Logger(CriminalBackgroundCheckService.name);

  constructor(private configService: ConfigService) {}

  async checkCpf(cpf: string): Promise<BackgroundCheckResult> {
    this.logger.log(`Iniciando verificação de antecedentes para CPF: ${cpf}`);

    const thirdPartyApiUrl = this.configService.get<string>('thirdPartyBackgroundCheck.apiUrl');
    const apiKey = this.configService.get<string>('thirdPartyBackgroundCheck.apiKey');

    if (!thirdPartyApiUrl || !apiKey) {
      this.logger.error('Variáveis de ambiente para API de background check não configuradas. Não é possível realizar a verificação real.');
      throw new InternalServerErrorException('Configuração da API de verificação de antecedentes ausente.');
    }

    try {
      // Exemplo conceitual de como seria a integração real com 'fetch'
      // Você provavelmente usaria uma biblioteca HTTP mais robusta como 'axios'
      // e um SDK específico do provedor de serviço, se disponível.
      this.logger.log(`Chamando API de background check em: ${thirdPartyApiUrl}`);
      const response = await fetch(`${thirdPartyApiUrl}/check-cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`, // Ou outro esquema de autenticação
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`API de background check retornou erro: ${response.status} - ${errorData.message}`);
        throw new InternalServerErrorException(`API de background check retornou erro: ${errorData.message || 'Erro desconhecido'}`);
      }

      const result = await response.json();
      this.logger.log(`Resposta da API de background check para CPF ${cpf}: ${JSON.stringify(result)}`);

      // Mapear o resultado da API externa para BackgroundCheckResult
      // Adapte esta lógica de mapeamento para o formato exato da resposta da API de terceiros
      return {
        status: result.success ? 'SUCCESS' : 'FAILED',
        hasIssues: result.hasNegativeRecords, // Exemplo: campo 'hasNegativeRecords'
        details: result.details,
        reportId: result.reportId,
      };
    } catch (error) {
      this.logger.error('Erro ao chamar a API de background check:', error.message, error.stack);
      throw new InternalServerErrorException('Falha ao realizar a verificação de antecedentes. Verifique logs para detalhes.');
    }
  }
}