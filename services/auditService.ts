import { api } from './api'; // Sua instância do Axios configurada com o JWT

export interface AuditLog {
  id: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
}

export const auditService = {
  /**
   * Busca os logs de atividade do sistema
   * @param limit Quantidade de registros
   */
  getActivities: async (limit = 50): Promise<AuditLog[]> => {
    const { data } = await api.get<AuditLog[]>(`/admin/activities`, {
      params: { limit }
    });
    return data;
  }
};
