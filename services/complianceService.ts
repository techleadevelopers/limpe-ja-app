
import { api } from './api';

interface ComplianceStatus {
  documentsValid: boolean;
  backgroundCheckPassed: boolean;
  insuranceActive: boolean;
  taxStatusRegular: boolean;
  lastUpdate: string;
  expirationDates: Record<string, string>;
}

interface LegalRequirement {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'pending' | 'expired' | 'not_applicable';
  dueDate?: string;
  actions: string[];
}

export class ComplianceService {
  static async getComplianceStatus(providerId: string): Promise<ComplianceStatus> {
    try {
      const response = await api.get(`/compliance/status/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status de compliance:', error);
      
      return {
        documentsValid: true,
        backgroundCheckPassed: true,
        insuranceActive: false,
        taxStatusRegular: true,
        lastUpdate: new Date().toISOString(),
        expirationDates: {
          'background_check': '2025-12-15',
          'insurance': '2024-03-30',
          'tax_certificate': '2025-06-30'
        }
      };
    }
  }

  static async getLegalRequirements(): Promise<LegalRequirement[]> {
    try {
      const response = await api.get('/compliance/requirements');
      return response.data;
    } catch (error) {
      return [
        {
          id: '1',
          title: 'Seguro de Responsabilidade Civil',
          description: 'Obrigatório para prestadores de serviços de limpeza',
          status: 'expired',
          dueDate: '2024-03-30',
          actions: [
            'Renovar seguro',
            'Enviar comprovante atualizado',
            'Verificar cobertura adequada'
          ]
        },
        {
          id: '2',
          title: 'Certidão de Antecedentes Criminais',
          description: 'Renovação anual obrigatória',
          status: 'compliant',
          dueDate: '2025-12-15',
          actions: []
        },
        {
          id: '3',
          title: 'Declaração de MEI',
          description: 'Manter situação fiscal regular',
          status: 'compliant',
          actions: ['Verificar DAS em dia']
        }
      ];
    }
  }

  static async uploadComplianceDocument(
    type: string,
    file: any
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);

      await api.post('/compliance/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar documento de compliance:', error);
      throw error;
    }
  }

  static async getDataPrivacyInfo(): Promise<any> {
    return {
      dataCollection: [
        'Informações pessoais básicas (nome, CPF, telefone)',
        'Dados de localização para prestação de serviços',
        'Histórico de serviços e avaliações',
        'Dados de pagamento (criptografados)'
      ],
      dataUsage: [
        'Facilitar conexão entre clientes e prestadores',
        'Melhorar qualidade dos serviços',
        'Garantir segurança e confiabilidade',
        'Cumprir obrigações legais e fiscais'
      ],
      rights: [
        'Acessar seus dados pessoais',
        'Corrigir informações incorretas',
        'Solicitar exclusão de dados',
        'Portabilidade de dados',
        'Retirar consentimento'
      ],
      contact: {
        email: 'privacidade@limpeja.com.br',
        phone: '(11) 1234-5678'
      }
    };
  }

  static async requestDataExport(): Promise<void> {
    try {
      await api.post('/compliance/export-data');
    } catch (error) {
      console.error('Erro ao solicitar exportação de dados:', error);
      throw error;
    }
  }

  static async requestAccountDeletion(reason: string): Promise<void> {
    try {
      await api.post('/compliance/delete-account', { reason });
    } catch (error) {
      console.error('Erro ao solicitar exclusão de conta:', error);
      throw error;
    }
  }
}
