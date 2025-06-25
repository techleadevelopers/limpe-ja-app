// src/verification/criminal-background-check.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Para acessar variáveis de ambiente

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
}

@Injectable()
export class CriminalBackgroundCheckService {
  constructor(private configService: ConfigService) {}

  async checkCpf(cpf: string): Promise<BackgroundCheckResult> {
    console.log(`Simulando verificação de antecedentes para CPF: ${cpf}`);

    // TODO: Substituir por uma chamada real à API de um serviço de background check (ex: ClearSale, Serasa)
    // const thirdPartyApiUrl = this.configService.get<string>('THIRD_PARTY_BACKGROUND_CHECK_API_URL');
    // const apiKey = this.configService.get<string>('THIRD_PARTY_BACKGROUND_CHECK_API_KEY');

    try {
      // Simulação de delay da API externa
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Lógica de simulação:
      // CPF 111.111.111-11 sempre falha (para testes)
      if (cpf === '11111111111') {
        return {
          status: 'SUCCESS',
          hasIssues: true,
          details: 'Pendências criminais detectadas. Requer revisão manual.',
          reportId: 'REPORT-XYZ-123',
        };
      }

      // Outros CPFs passam na simulação
      return {
        status: 'SUCCESS',
        hasIssues: false,
        details: 'Nenhum problema encontrado nos antecedentes criminais.',
        reportId: 'REPORT-ABC-456',
      };
    } catch (error) {
      console.error('Erro ao chamar a API de background check:', error);
      throw new InternalServerErrorException('Falha ao realizar a verificação de antecedentes.');
    }
  }
}