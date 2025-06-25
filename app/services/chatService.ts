// LimpeJaApp/app/services/chatService.ts
import api from './api';
import axios, { AxiosResponse } from 'axios';

// Importar DTOs e tipos de chat
import { Message, ChatDetails, SendMessageDto, GetMessagesQuery } from '../types/backend/chat'; // CORREÇÃO: Importar GetMessagesQuery

/**
 * @function findOrCreateChat
 * Encontra um chat existente ou cria um novo entre um provedor e um cliente.
 * Corresponde a `GET /chat/find-or-create/provider/:providerId/client/:clientId`.
 * @param providerId ID do provedor.
 * @param clientId ID do cliente.
 * @returns Promessa com os detalhes do chat (ChatDetails).
 */
export const findOrCreateChat = async (providerId: string, clientId: string): Promise<ChatDetails> => {
  try {
    const response: AxiosResponse<ChatDetails> = await api.get(`/chat/find-or-create/provider/${providerId}/client/${clientId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao encontrar ou criar chat entre provedor ${providerId} e cliente ${clientId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao encontrar ou criar chat.`);
    }
    throw new Error('Erro de rede ou servidor ao encontrar ou criar chat.');
  }
};

/**
 * @function getChatMessages
 * Busca o histórico de mensagens para um chat específico.
 * Corresponde a `GET /chat/:chatId/messages`.
 * @param chatId ID do chat.
 * @param query Parâmetros de query para paginação (offset, limit).
 * @returns Promessa com um array de mensagens.
 */
export const getChatMessages = async (chatId: string, query?: GetMessagesQuery): Promise<Message[]> => { // CORREÇÃO: Aceitar GetMessagesQuery
  try {
    const response: AxiosResponse<Message[]> = await api.get<Message[]>(`/chat/${chatId}/messages`, { params: query }); // CORREÇÃO: Passar query diretamente
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao buscar mensagens do chat ${chatId}:`, error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar mensagens do chat ${chatId}.`);
    }
    throw new Error('Erro de rede ou servidor ao buscar mensagens do chat.');
  }
};

/**
 * @function sendMessage
 * Envia uma nova mensagem para um chat.
 * Corresponde a `POST /chat/:chatId/messages`.
 * @param messageData DTO com os dados da mensagem a ser enviada.
 * @returns Promessa com a mensagem enviada.
 */
export const sendMessage = async (messageData: SendMessageDto): Promise<Message> => { // CORREÇÃO: Aceitar SendMessageDto
  try {
    // O backend espera { receiverId, content, senderId, chatId } no corpo da requisição
    // Se o chatId já está na URL, ele não precisa estar no corpo.
    // Se o senderId é inferido pelo JWT, não precisa estar no corpo.
    // Adapte o `data` conforme o seu backend espera.
    // Para este exemplo, assumimos que o backend espera receiverId e content no corpo,
    // e chatId e senderId podem ser inferidos ou passados de outra forma.
    // Se o seu backend espera o SendMessageDto completo no corpo, use messageData diretamente.
    const { chatId, ...dataToSend } = messageData; // Se chatId vai na URL, remova-o do corpo
    const response: AxiosResponse<Message> = await api.post<Message>(`/chat/${chatId}/messages`, dataToSend); // CORREÇÃO: Usar messageData.chatId e dataToSend
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao enviar mensagem para o chat ${messageData.chatId}:`, error.response?.data || error.message); // CORREÇÃO: Acessar chatId de messageData
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao enviar mensagem.');
    }
    throw new Error('Erro de rede ou servidor ao enviar mensagem.');
  }
};

// Em um ambiente de chat real, você também precisaria de funções para:
// - getChatList(): Promise<ChatSummary[]> para a tela de lista de conversas
// - createChat(): Promise<Chat> para iniciar uma nova conversa (se não for via findOrCreateChat)