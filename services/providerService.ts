// LimpeJaApp/src/services/providerService.ts
import axios, { AxiosError } from 'axios';
import { api } from './api'; // Importe a instância do Axios configurada

// --- Interfaces de Dados ---

// Para o Dashboard
interface DashboardSummary {
  upcomingServices: number;
  newRequests: number;
  weeklyEarnings: number; // Ou string se for formatado no backend
}

// Para Agendamentos (Agenda do Provedor)
interface ProviderAppointment {
  id: string;
  clientName: string;
  serviceType: string;
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  date: string; // YYYY-MM-DD
  status: 'Confirmado' | 'PendenteCliente' | 'ARealizar' | 'Concluído' | 'Cancelado';
  address?: string; // Endereço resumido
  clientId?: string; // ID do cliente para chat
}

// Para Disponibilidade
interface TimeSlot {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

interface DailyAvailability {
  dayName: string;
  dayIndex: number; // 0 (Dom) a 6 (Sab)
  isAvailable: boolean;
  slots: TimeSlot[];
}

// Para Serviços/Solicitações
interface ServiceRequest {
  id: string;
  clientName: string;
  serviceType: string;
  requestedDate?: string; // YYYY-MM-DD
  scheduledDate?: string; // YYYY-MM-DD
  date?: string; // YYYY-MM-DD (para unificar)
  time?: string; // HH:MM
  address?: string;
  notes?: string;
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Recusado' | 'Cancelado';
  clientId: string;
}

interface ServiceDetails extends ServiceRequest {
  // Pode ter mais detalhes específicos para a tela de detalhes
  price?: string;
}

// Para Ganhos
interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Valor numérico
  type: 'credit' | 'debit'; // Tipo de transação
}

interface EarningsSummary {
  totalBalance: number; // Valor numérico
  pendingWithdrawal: number; // Valor numérico
  lastPayout?: string; // Data do último saque ou descrição
  recentTransactions: Transaction[];
}

// Para Perfil do Provedor
interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  experiencia: string;
  servicosOferecidos: ServiceOffering[]; // Lista de objetos ServiceOffering
  estruturaPreco: string;
  areasAtendimento: string;
  anosExperiencia: number;
  // Outros campos de perfil (CPF, dataNascimento, endereço, etc.)
}

interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: string; // Ex: 'R$ 60/hora', 'R$ 200 fixo'
  priceValue?: number; // Opcional, se precisar do valor numérico
  duration?: string; // Ex: '2 horas', 'varia'
}

// Para Mensagens/Chat (similar ao cliente)
interface Conversation {
  id: string; // Chat ID
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
}

// --- Função auxiliar para tratamento de erros ---
function handleProviderServiceError(error: unknown, defaultMessage: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.response) {
      throw new Error(`Erro ${error.response.status}: ${error.response.statusText || 'Resposta inesperada do servidor.'}`);
    } else {
      throw new Error('Erro de conexão. Verifique sua internet ou tente mais tarde.');
    }
  }
  if (error instanceof Error) {
    throw new Error(error.message || defaultMessage);
  }
  throw new Error(defaultMessage);
}

// --- Funções de Serviço para o Provedor ---

// 1. Dashboard
export const getProviderDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    console.log('[providerService] Buscando resumo do dashboard.');
    const response = await api.get<DashboardSummary>('/provider/dashboard/summary');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar resumo do dashboard.');
  }
};

// 2. Agenda
export const getProviderSchedule = async (params: { month: number, year: number }): Promise<ProviderAppointment[]> => {
  try {
    console.log('[providerService] Buscando agenda para:', params.month, params.year);
    // Adapte o endpoint e os parâmetros conforme sua API de backend
    const response = await api.get<ProviderAppointment[]>('/provider/schedule', { params });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar agenda do provedor.');
  }
};

interface UpdateAvailabilityData {
  weeklyAvailability: DailyAvailability[];
  // Pode incluir blockedDates: string[];
}

export const updateProviderAvailability = async (availabilityData: UpdateAvailabilityData): Promise<{ message: string }> => {
  try {
    console.log('[providerService] Atualizando disponibilidade:', availabilityData);
    const response = await api.post<{ message: string }>('/provider/availability', availabilityData);
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao atualizar disponibilidade.');
  }
};

export const getProviderAvailability = async (): Promise<DailyAvailability[]> => {
  try {
    console.log('[providerService] Buscando disponibilidade atual.');
    const response = await api.get<DailyAvailability[]>('/provider/availability');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar disponibilidade atual.');
  }
};

// 3. Serviços (Solicitações e Agendamentos)
export const getProviderServicesOrRequests = async (params: { filter: 'requests' | 'upcoming' | 'completed' | 'cancelled' }): Promise<ServiceRequest[]> => {
  try {
    console.log('[providerService] Buscando serviços/solicitações com filtro:', params.filter);
    const response = await api.get<ServiceRequest[]>('/provider/services', { params });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar serviços/solicitações.');
  }
};

export const getProviderServiceDetails = async (serviceId: string): Promise<ServiceDetails> => {
  try {
    console.log('[providerService] Buscando detalhes para serviceId:', serviceId);
    const response = await api.get<ServiceDetails>(`/provider/services/${serviceId}`);
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar detalhes do serviço.');
  }
};

export const updateServiceStatusByProvider = async (serviceId: string, status: 'accepted' | 'declined' | 'completed' | 'started' | 'cancelled'): Promise<{ message: string }> => {
  try {
    console.log('[providerService] Atualizando status para serviceId:', serviceId, 'para', status);
    const response = await api.patch<{ message: string }>(`/provider/services/${serviceId}/status`, { status });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, `Erro ao atualizar status do serviço para ${status}.`);
  }
};

// 4. Ganhos
export const getProviderEarnings = async (): Promise<EarningsSummary> => {
  try {
    console.log('[providerService] Buscando ganhos.');
    const response = await api.get<EarningsSummary>('/provider/earnings');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar ganhos do provedor.');
  }
};

export const requestPayout = async (amount?: number): Promise<{ message: string }> => {
  try {
    console.log('[providerService] Solicitando saque de:', amount || 'saldo total');
    // Se 'amount' não for especificado, o backend pode sacar o saldo total disponível
    const response = await api.post<{ message: string }>('/provider/earnings/request-payout', { amount });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao solicitar saque.');
  }
};

// 5. Perfil do Provedor
export const getProviderProfile = async (): Promise<ProviderProfile> => {
  try {
    console.log('[providerService] Buscando perfil do provedor.');
    const response = await api.get<ProviderProfile>('/provider/profile');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar perfil do provedor.');
  }
};

export const updateProviderProfile = async (profileData: Partial<ProviderProfile>): Promise<ProviderProfile> => {
  try {
    console.log('[providerService] Atualizando perfil do provedor:', profileData);
    const response = await api.put<ProviderProfile>('/provider/profile', profileData);
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao atualizar perfil do provedor.');
  }
};

export const getProviderOfferedServices = async (): Promise<ServiceOffering[]> => {
  try {
    console.log('[providerService] Buscando serviços oferecidos pelo provedor.');
    const response = await api.get<ServiceOffering[]>('/provider/profile/offered-services');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar serviços oferecidos.');
  }
};

export const updateProviderOfferedServices = async (services: ServiceOffering[]): Promise<{ message: string }> => {
  try {
    console.log('[providerService] Atualizando serviços oferecidos:', services);
    const response = await api.put<{ message: string }>('/provider/profile/offered-services', { services });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao atualizar serviços oferecidos.');
  }
};

// 6. Mensagens/Chat (similar ao clientService, mas com endpoints do provedor)
export const getProviderConversations = async (): Promise<Conversation[]> => {
  try {
    console.log('[providerService] Buscando conversas do provedor.');
    const response = await api.get<Conversation[]>('/provider/conversations');
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar conversas do provedor.');
  }
};

// Reutiliza a interface Message do clientService ou defina aqui se preferir
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    console.log('[providerService] Buscando mensagens para chat:', chatId);
    const response = await api.get<Message[]>(`/provider/chats/${chatId}/messages`);
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao buscar mensagens do chat.');
  }
};

export const sendChatMessage = async (chatId: string, messageText: string, senderId: string): Promise<Message> => {
  try {
    console.log('[providerService] Enviando mensagem para chat:', chatId, 'Texto:', messageText);
    const response = await api.post<Message>(`/provider/chats/${chatId}/messages`, { text: messageText, senderId });
    return response.data;
  } catch (error: unknown) {
    return handleProviderServiceError(error, 'Erro ao enviar mensagem.');
  }
};

// --- Funções relacionadas a Ganhos para o LimpeJá (Monetização) ---
// Estas funções seriam chamadas pelo backend (Cloud Functions) e não diretamente pelo frontend do provedor.
// Elas representam a lógica de negócio que o LimpeJá implementaria para gerenciar a comissão.

/*
// Exemplo de como o backend (Cloud Functions) poderia interagir com a lógica de ganhos
// Não seriam chamadas diretamente pelo frontend do provedor, mas sim por triggers ou callable functions no backend.

interface ProcessPaymentResult {
  commissionAmount: number;
  providerNetEarnings: number;
}

export const processServicePaymentAndCalculateEarnings = async (bookingId: string, totalAmountPaid: number): Promise<ProcessPaymentResult> => {
  // Esta função seria chamada por um webhook de pagamento ou um trigger de Firestore no backend.
  // Não é uma função de frontend.
  console.log(`[Backend Logic] Processando pagamento para ${bookingId} no valor de ${totalAmountPaid}`);
  const commissionRate = 0.15; // 15% de comissão para o LimpeJá
  const commission = totalAmountPaid * commissionRate;
  const providerNet = totalAmountPaid - commission;

  // Aqui o backend atualizaria o saldo do provedor no Firestore
  // E registraria a comissão do LimpeJá

  return {
    commissionAmount: commission,
    providerNetEarnings: providerNet,
  };
};

export const initiateProviderPayout = async (providerId: string, amount: number, pixKey: string): Promise<{ success: boolean; transactionId: string }> => {
  // Esta função seria chamada por um processo de backend (ex: após requestPayout do provedor)
  // para realizar a transferência real para a conta do provedor via API do PSP.
  console.log(`[Backend Logic] Iniciando repasse de ${amount} para ${providerId} via PIX.`);
  // Chamar API do PSP (Stripe, Mercado Pago, Pagar.me, etc.)
  return { success: true, transactionId: `pix_tx_${Date.now()}` };
};
*/