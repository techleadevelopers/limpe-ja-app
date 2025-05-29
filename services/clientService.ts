// LimpeJaApp/src/services/clientService.ts
import axios, { AxiosError } from 'axios';
import { api } from './api'; // Importe a instância do Axios configurada

// --- Interfaces de Dados (adapte conforme seus tipos reais em ../types/) ---

// Exemplo de tipo para um Usuário (cliente ou provedor)
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'client' | 'provider';
  phone?: string;
  avatarUrl?: string;
}

// Exemplo de tipo para um Prestador (Provider)
interface Provider {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoHora: string;
  imagemUrl: string;
  numeroAvaliacoes?: number;
  isVerificado?: boolean;
  descricaoCompleta?: string;
  servicosOferecidos?: Array<{ nome: string; preco?: string; descricao?: string }>;
  cidade?: string;
  anosExperiencia?: number;
  disponibilidadeObservacao?: string;
}

// Exemplo de tipo para um Agendamento (Booking)
interface Booking {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  date: string; // ISO String
  time: string; // HH:MM
  address: string;
  notes?: string;
  status: 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado';
  price?: string; // Preço final do agendamento
}

// Exemplo de tipo para Categoria de Serviço
interface ServiceCategory {
  id: string;
  nome: string;
  icone: string; // Nome do ícone da biblioteca
}

// --- Funções de Serviço para o Cliente ---

// Função auxiliar para tratamento de erros
function handleClientServiceError(error: unknown, defaultMessage: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data && typeof error.response.data.message === 'string') {
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

// 1. Funções relacionadas a Prestadores (Providers)

export const getProviders = async (filters?: { category?: string; search?: string; location?: string }): Promise<Provider[]> => {
  try {
    console.log('[clientService] Buscando prestadores com filtros:', filters);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay

    const MOCK_PROVIDERS: Provider[] = [
      { id: 'provider1', nome: 'Ana Oliveira', especialidade: 'Limpeza Residencial', avaliacao: 4.8, precoHora: 'R$ 60,00/hora', imagemUrl: 'https://via.placeholder.com/100/ADD8E6/1E3A5F?text=Ana+O', numeroAvaliacoes: 125, isVerificado: true, descricaoCompleta: 'Profissional experiente e dedicada.', cidade: 'Campinas, SP', anosExperiencia: 5 },
      { id: 'provider2', nome: 'Carlos Silva', especialidade: 'Limpeza Comercial', avaliacao: 4.9, precoHora: 'R$ 75,00/hora', imagemUrl: 'https://via.placeholder.com/100/E0F7FA/00796B?text=Carlos+S', numeroAvaliacoes: 88, isVerificado: false, descricaoCompleta: 'Atendimento de alta qualidade para empresas.', cidade: 'Valinhos, SP', anosExperiencia: 8 },
      { id: 'provider3', nome: 'Mariana Costa', especialidade: 'Limpeza Pós-obra', avaliacao: 4.7, precoHora: 'R$ 90,00/hora', imagemUrl: 'https://via.placeholder.com/100/B3E5FC/01579B?text=Mariana+C', numeroAvaliacoes: 55, isVerificado: true, descricaoCompleta: 'Deixando tudo impecável após a sua obra.', cidade: 'Campinas, SP', anosExperiencia: 3 },
    ];

    let filteredProviders = MOCK_PROVIDERS;

    if (filters?.category) {
      // << CORREÇÃO: Atribuir a uma nova constante para garantir o tipo string >>
      const categoryFilter = filters.category;
      filteredProviders = filteredProviders.filter(p => p.especialidade.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    if (filters?.search) {
      // << CORREÇÃO: Atribuir a uma nova constante para garantir o tipo string >>
      const searchFilter = filters.search;
      filteredProviders = filteredProviders.filter(p =>
        p.nome.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.especialidade.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.descricaoCompleta && p.descricaoCompleta.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    }
    // Adicione lógica para 'location' se tiver dados de localização nos mocks

    return filteredProviders;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Provider[]>('/providers', { params: filters });
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar prestadores.');
  }
};

export const getProviderDetails = async (providerId: string): Promise<Provider> => {
  try {
    console.log('[clientService] Buscando detalhes do prestador:', providerId);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simula delay

    const ALL_PROVIDER_DETAILS: Provider[] = [
      { id: 'provider1', nome: 'Ana Oliveira', especialidade: 'Limpeza Residencial Especializada', avaliacao: 4.8, precoHora: 'R$ 60-80/h', imagemUrl: 'https://via.placeholder.com/150/ADD8E6/1E3A5F?text=Ana+O', numeroAvaliacoes: 125, isVerificado: true, descricaoCompleta: 'Com mais de 5 anos de experiência, ofereço uma limpeza residencial detalhada e personalizada, utilizando produtos de alta qualidade e ecológicos. Meu foco é transformar sua casa em um ambiente impecável, fresco e acolhedor, cuidando de cada canto com atenção e profissionalismo. Sua satisfação é minha prioridade!', servicosOferecidos: [{nome: 'Limpeza Padrão Completa', descricao: 'Pisos, móveis, banheiros, cozinha.'}, {nome: 'Limpeza Pesada Detalhada', preco: 'Sob consulta', descricao: 'Pós-festa, pré-mudança, faxina geral.'}, {nome: 'Organização de Armários', preco: 'R$ 70/h'}], cidade: 'Campinas, SP', anosExperiencia: 5, disponibilidadeObservacao: 'Agenda aberta para próxima semana' },
      { id: 'provider2', nome: 'Carlos Silva', especialidade: 'Higienização Comercial e Escritórios', avaliacao: 4.9, precoHora: 'R$ 75/h', imagemUrl: 'https://via.placeholder.com/150/E0F7FA/006400?text=Carlos+S', numeroAvaliacoes: 88, isVerificado: false, descricaoCompleta: 'Serviços de limpeza e higienização para ambientes comerciais, escritórios e lojas. Equipe treinada, discrição e eficiência para manter seu local de trabalho sempre apresentável e saudável. Horários flexíveis para não atrapalhar sua rotina.', servicosOferecidos: [{nome: 'Limpeza de Manutenção (Escritório)'}, {nome: 'Higienização Profunda (Comercial)'}], cidade: 'Valinhos, SP', anosExperiencia: 8, disponibilidadeObservacao: 'Disponível para contratos mensais' },
      { id: 'provider3', nome: 'Mariana Costa', especialidade: 'Expert em Limpeza Pós-Obra', avaliacao: 4.7, precoHora: 'A partir de R$ 90/h', imagemUrl: 'https://via.placeholder.com/150/B3E5FC/01579B?text=Mariana+C', numeroAvaliacoes: 55, isVerificado: true, descricaoCompleta: 'Especializada na remoção de sujeira pesada, respingos de tinta, cimento e outros resíduos de construção e reforma. Deixo seu imóvel novo ou recém-reformado impecável e pronto para uso, com equipamento e produtos específicos para cada tipo de material.', servicosOferecidos: [{nome: 'Limpeza Pós-Reforma (Residencial)'}, {nome: 'Limpeza Pós-Construção (Comercial)'}], cidade: 'Campinas, SP', anosExperiencia: 3 },
    ];

    const provider = ALL_PROVIDER_DETAILS.find(p => p.id === providerId);
    if (!provider) {
      const errorSimulado: any = new Error('Prestador não encontrado (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Prestador não encontrado.' }, status: 404 };
      throw errorSimulado;
    }
    return provider;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Provider>(`/providers/${providerId}`);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar detalhes do prestador.');
  }
};

// 2. Funções relacionadas a Categorias de Serviço

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  try {
    console.log('[clientService] Buscando categorias de serviço.');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay

    const MOCK_CATEGORIES: ServiceCategory[] = [
      { id: '1', nome: 'Residencial', icone: 'home-outline' },
      { id: '2', nome: 'Comercial', icone: 'office-building-outline' },
      { id: '3', nome: 'Pós-obra', icone: 'broom' },
      { id: '4', nome: 'Vidros', icone: 'window-closed-variant' },
      { id: '5', nome: 'Jardim', icone: 'flower-tulip-outline' },
    ];
    return MOCK_CATEGORIES;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<ServiceCategory[]>('/service-categories');
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar categorias de serviço.');
  }
};

// 3. Funções relacionadas a Agendamentos (Bookings)

interface CreateBookingData {
  providerId: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  address: string;
  notes?: string;
  // Outros campos como price, paymentMethod, etc., seriam adicionados aqui
}

export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  try {
    console.log('[clientService] Criando agendamento:', bookingData);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay

    // Simulação de validação/falha
    if (bookingData.providerId === 'provider2' && bookingData.date === '2025-07-15') {
      const errorSimulado: any = new Error('Provedor não disponível nesta data (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Horário indisponível para este provedor.' }, status: 400 };
      throw errorSimulado;
    }

    // Retorna um objeto Booking simulado
    return {
      id: `booking-${Date.now()}`,
      serviceName: bookingData.serviceType,
      providerId: bookingData.providerId,
      providerName: 'Simulado Provedor', // Em um cenário real, o backend retornaria o nome
      date: bookingData.date,
      time: bookingData.time,
      address: bookingData.address,
      notes: bookingData.notes,
      status: 'Pendente', // Status inicial, aguardando pagamento/confirmação
      price: 'R$ 150,00', // Preço simulado
    };
    // --- Código real (descomente e adapte) ---
    // const response = await api.post<Booking>('/bookings', bookingData);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao criar agendamento.');
  }
};

export const getClientBookings = async (statusFilter?: 'upcoming' | 'past' | 'cancelled'): Promise<Booking[]> => {
  try {
    console.log('[clientService] Buscando agendamentos do cliente com filtro:', statusFilter);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay

    const MOCK_CLIENT_BOOKINGS: Booking[] = [
      { id: 'book1', serviceName: 'Limpeza Padrão Semanal', providerName: 'Ana Oliveira', providerId: 'provider1', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], time: '10:00', address: 'Rua A, 123', status: 'Confirmado', price: 'R$120,00' },
      { id: 'book2', serviceName: 'Limpeza Pesada Quinzenal', providerName: 'Carlos Silva', providerId: 'provider2', date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], time: '14:00', address: 'Av B, 456', status: 'Pendente', price: 'R$250,00' },
      { id: 'book3', serviceName: 'Limpeza Pós-Obra', providerName: 'Mariana Costa', providerId: 'provider3', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], time: '09:00', address: 'Rua C, 789', status: 'Concluído', price: 'R$300,00' },
      { id: 'book4', serviceName: 'Faxina Express', providerName: 'Ana Oliveira', providerId: 'provider1', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], time: '11:00', address: 'Rua A, 123', status: 'Cancelado', price: 'R$100,00' },
    ];

    let filteredBookings = MOCK_CLIENT_BOOKINGS;
    if (statusFilter === 'upcoming') {
      filteredBookings = MOCK_CLIENT_BOOKINGS.filter(b => b.status === 'Confirmado' || b.status === 'Pendente'); // Ajuste conforme seus status
    } else if (statusFilter === 'past') {
      filteredBookings = MOCK_CLIENT_BOOKINGS.filter(b => b.status === 'Concluído');
    } else if (statusFilter === 'cancelled') {
      filteredBookings = MOCK_CLIENT_BOOKINGS.filter(b => b.status === 'Cancelado');
    }

    return filteredBookings;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Booking[]>('/client/bookings', { params: { status: statusFilter } });
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar agendamentos do cliente.');
  }
};

export const getBookingDetails = async (bookingId: string): Promise<Booking> => {
  try {
    console.log('[clientService] Buscando detalhes do agendamento:', bookingId);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simula delay

    const MOCK_BOOKING_DETAILS: Booking = {
      id: bookingId,
      serviceName: 'Limpeza Residencial Completa',
      providerName: 'Ana Oliveira',
      providerId: 'provider1',
      date: '2025-07-15', // YYYY-MM-DD
      time: '14:00', // HH:MM
      address: 'Rua das Palmeiras, 450, Apt 101, Bairro Sol Nascente, Campinas-SP',
      notes: 'Foco especial nos vidros da varanda e limpeza do forno. Tenho um gato persa muito tranquilo.',
      status: 'Confirmado',
      price: 'R$ 180,00',
    };

    if (bookingId === 'nonExistent') {
      const errorSimulado: any = new Error('Agendamento não encontrado (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Agendamento não encontrado.' }, status: 404 };
      throw errorSimulado;
    }
    return MOCK_BOOKING_DETAILS;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Booking>(`/bookings/${bookingId}`);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar detalhes do agendamento.');
  }
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    console.log('[clientService] Cancelando agendamento:', bookingId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay

    // Simulação de sucesso
    return;
    // --- Código real (descomente e adapte) ---
    // await api.put(`/bookings/${bookingId}/cancel`); // Ou DELETE, dependendo da sua API
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao cancelar agendamento.');
  }
};

// 4. Funções relacionadas a Mensagens/Chat (se o cliente for o iniciador ou participante)

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
}

interface Conversation {
  id: string; // Chat ID
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export const getClientConversations = async (): Promise<Conversation[]> => {
  try {
    console.log('[clientService] Buscando conversas do cliente.');
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simula delay

    const MOCK_CONVERSATIONS: Conversation[] = [
      { id: 'chat1_provider1', otherUserId: 'provider1', otherUserName: 'Ana Oliveira', otherUserAvatarUrl: 'https://via.placeholder.com/80/ADD8E6/000000?text=Ana+O', lastMessage: 'Olá! Confirmado para amanhã às 10h. Ansiosa!', lastMessageTimestamp: new Date(Date.now() - 360000).toISOString() , unreadCount: 1 },
      { id: 'chat2_provider2', otherUserId: 'provider2', otherUserName: 'Carlos Silva', otherUserAvatarUrl: 'https://via.placeholder.com/80/E0F7FA/000000?text=Carlos+S', lastMessage: 'Tudo certo, muito obrigado pelo excelente serviço!', lastMessageTimestamp: new Date(Date.now() - 86400000 * 1).toISOString(), unreadCount: 0 },
      { id: 'chat3_provider3', otherUserId: 'provider3', otherUserName: 'Mariana Costa', otherUserAvatarUrl: 'https://via.placeholder.com/80/B3E5FC/000000?text=Mariana+C', lastMessage: 'Você poderia me passar o orçamento para a limpeza pós-obra?', lastMessageTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(), unreadCount: 3 },
    ];
    return MOCK_CONVERSATIONS;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Conversation[]>('/client/conversations');
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar conversas.');
  }
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    console.log('[clientService] Buscando mensagens para chat:', chatId);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simula delay

    // Simula mensagens para um chat existente
    if (!chatId.startsWith('new_')) {
      return [
        { id: 'msg1', text: 'Olá! Gostaria de confirmar nosso agendamento.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString() },
        { id: 'msg2', text: 'Sim, confirmo para amanhã às 10h.', senderId: 'currentUser', timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString() },
        { id: 'msg3', text: 'Perfeito! Estarei aguardando.', senderId: 'otherUser', timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString() },
      ];
    }
    return []; // Para novos chats, retorna vazio
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<Message[]>(`/chats/${chatId}/messages`);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar mensagens do chat.');
  }
};

export const sendChatMessage = async (chatId: string, messageText: string, senderId: string): Promise<Message> => {
  try {
    console.log('[clientService] Enviando mensagem para chat:', chatId, 'Texto:', messageText);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simula delay

    // Em um cenário real, o backend criaria o chat se for 'new_' e retornaria o ID real
    return {
      id: `msg-${Date.now()}`,
      text: messageText,
      timestamp: new Date().toISOString(),
      senderId: senderId,
    };
    // --- Código real (descomente e adapte) ---
    // const response = await api.post<Message>(`/chats/${chatId}/messages`, { text: messageText, senderId });
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao enviar mensagem.');
  }
};

// 5. Funções relacionadas a Ofertas

export const getOfferDetails = async (offerId: string): Promise<any> => { // Usando 'any' temporariamente para OfferDetails
  try {
    console.log('[clientService] Buscando detalhes da oferta:', offerId);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simula delay

    const MOCK_OFFERS: any[] = [ // Adapte para seu tipo OfferDetails real
      {
        id: 'primeiraLimpeza30off',
        title: '30% OFF na Primeira Limpeza!',
        description: 'Aproveite um super desconto para experimentar nossos serviços de limpeza residencial de alta qualidade. Deixe sua casa brilhando!',
        imageUrl: 'https://via.placeholder.com/600x300/87CEEB/1E3A5F?text=Super+Oferta+LimpeJ%C3%A1',
        terms: 'Válido apenas para novos clientes. Não acumulativo com outras promoções. Agendamento sujeito à disponibilidade.',
        discountPercentage: 30,
        validUntil: '2025-12-31',
      },
      {
        id: 'limpezaEscritorioTop',
        title: 'Pacote Limpeza Escritório Top',
        description: 'Mantenha seu ambiente de trabalho impecável com nosso pacote especial para escritórios.',
        imageUrl: 'https://via.placeholder.com/600x300/90EE90/006400?text=Limpeza+Escrit%C3%B3rio',
        terms: 'Contratos mensais ou quinzenais. Consulte condições.',
      },
    ];

    const offer = MOCK_OFFERS.find(o => o.id === offerId);
    if (!offer) {
      const errorSimulado: any = new Error('Oferta não encontrada (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Oferta não encontrada.' }, status: 404 };
      throw errorSimulado;
    }
    return offer;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<any>(`/offers/${offerId}`);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar detalhes da oferta.');
  }
};

// 6. Funções relacionadas ao Perfil do Cliente

interface UpdateClientProfileData {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export const updateClientProfile = async (profileData: UpdateClientProfileData): Promise<User> => {
  try {
    console.log('[clientService] Atualizando perfil do cliente:', profileData);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay

    // Simulação de sucesso
    return {
      id: 'current-user-id', // ID do usuário logado
      email: 'usuario@limpeja.com',
      name: profileData.name || 'Nome Atualizado',
      role: 'client',
      phone: profileData.phone || '11999990000',
      avatarUrl: profileData.avatarUrl || 'https://via.placeholder.com/100/CCCCCC/FFFFFF?text=User',
    };
    // --- Código real (descomente e adapte) ---
    // const response = await api.put<User>('/client/profile', profileData);
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao atualizar perfil do cliente.');
  }
};

// 7. Funções relacionadas a Feedback

interface SubmitFeedbackData {
  targetId: string;
  type: 'service' | 'provider_profile' | 'app_feedback';
  rating?: number;
  comment: string;
  serviceName?: string;
  providerName?: string;
}

export const submitFeedback = async (feedbackData: SubmitFeedbackData): Promise<void> => {
  try {
    console.log('[clientService] Enviando feedback:', feedbackData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay

    // Simulação de sucesso
    return;
    // --- Código real (descomente e adapte) ---
    // await api.post('/feedback', feedbackData);
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao enviar feedback.');
  }
};

// 8. Funções relacionadas a Notificações (se o cliente for o principal receptor)

interface NotificationItem {
  id: string;
  type: 'agendamento' | 'mensagem' | 'pagamento' | 'geral';
  title: string;
  body: string;
  timestamp: string; // ISO String
  isRead: boolean;
  navigateTo?: string;
  relatedId?: string;
}

export const getClientNotifications = async (): Promise<NotificationItem[]> => {
  try {
    console.log('[clientService] Buscando notificações do cliente.');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay

    const MOCK_NOTIFICATIONS: NotificationItem[] = [
      { id: '1', type: 'agendamento', title: 'Agendamento Confirmado!', body: 'Sua limpeza com Ana Oliveira foi confirmada para Terça, 28 de Mai às 10:00.', timestamp: new Date(Date.now() - 300000).toISOString(), isRead: false, navigateTo: '/(client)/bookings/book1', relatedId: 'book1' },
      { id: '2', type: 'mensagem', title: 'Nova Mensagem de Carlos Silva', body: 'Carlos: "Chegarei em 10 minutos para o serviço."', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isRead: false, navigateTo: '/(client)/messages/chat_carlos_silva', relatedId: 'chat_carlos_silva' },
      { id: '3', type: 'pagamento', title: 'Pagamento Recebido', body: 'Recebemos o pagamento de R$180,00 pelo serviço de Limpeza Completa.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), isRead: true },
      { id: '4', type: 'agendamento', title: 'Lembrete de Agendamento', body: 'Não se esqueça do seu serviço de jardinagem amanhã às 09:00.', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), isRead: true, navigateTo: '/(client)/bookings/bookUpcoming', relatedId: 'bookUpcoming' },
      { id: '5', type: 'geral', title: 'Bem-vindo ao LimpeJá!', body: 'Explore nossos serviços e encontre os melhores profissionais.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), isRead: true },
    ];
    return MOCK_NOTIFICATIONS;
    // --- Código real (descomente e adapte) ---
    // const response = await api.get<NotificationItem[]>('/client/notifications');
    // return response.data;
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao buscar notificações.');
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    console.log('[clientService] Marcando notificação como lida:', notificationId);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay

    // Simulação de sucesso
    return;
    // --- Código real (descomente e adapte) ---
    // await api.put(`/notifications/${notificationId}/read`);
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao marcar notificação como lida.');
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    console.log('[clientService] Marcando todas as notificações como lidas.');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay

    // Simulação de sucesso
    return;
    // --- Código real (descomente e adapte) ---
    // await api.put('/notifications/mark-all-read');
  } catch (error: unknown) {
    return handleClientServiceError(error, 'Erro ao marcar todas as notificações como lidas.');
  }
};