import  api from './api';

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
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }

  static async getLegalRequirements(): Promise<LegalRequirement[]> {
    try {
      const response = await api.get('/compliance/requirements');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar requisitos legais:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
  }

  static async uploadComplianceDocument(
    type: string,
    file: any // O tipo 'file' pode ser mais específico dependendo da sua implementação (e.g., File, Blob)
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
    try {
      const response = await api.get('/compliance/privacy-info'); // Assumindo um endpoint real para privacidade
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar informações de privacidade de dados:', error);
      // Em um ambiente de produção "premium", não devemos retornar dados mockados em caso de erro.
      // O erro deve ser propagado para que a UI possa lidar com ele (ex: exibir uma mensagem de erro).
      throw error;
    }
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