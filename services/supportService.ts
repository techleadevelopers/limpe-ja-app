// LimpeJaApp/app/services/supportService.ts
import axios from 'axios';
import { SupportTicket, CreateTicketPayload, AddMessagePayload, SupportMessage } from '../types/backend/support';
import api from './api'; // Importa a instância centralizada do Axios
import Constants from 'expo-constants'; // Importar Constants para API_BASE_URL consistente

// A API_BASE_URL deve ser carregada de Constants para consistência em produção
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Validação para garantir que API_BASE_URL está definida
if (!API_BASE_URL) {
  console.error('[supportService] Erro crítico: backendApiUrl não está definido!');
  // Em um ambiente de produção, você pode querer lançar um erro ou ter um fallback mais robusto
}


export const supportService = {
    /**
     * Creates a new support ticket.
     * @param {CreateTicketPayload} payload - The subject and initial message (description) for the new ticket.
     * @returns {Promise<SupportTicket>} A promise that resolves to the newly created ticket.
     */
    async createTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.post(`/v1/support/tickets`, payload);
            return response.data;
        } catch (error) {
            console.error('Error creating support ticket:', error);
            throw error;
        }
    },

    /**
     * Fetches all support tickets for the authenticated user.
     * @returns {Promise<SupportTicket[]>} A promise that resolves to an array of support tickets.
     */
    async getTickets(): Promise<SupportTicket[]> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.get(`/v1/support/tickets`, { params: { mine: true } }); // Adicionado params.mine=true
            return response.data;
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            throw error;
        }
    },

    /**
     * Fetches details for a specific support ticket, including its messages.
     * @param {string} ticketId - The ID of the ticket to fetch.
     * @returns {Promise<SupportTicket>} A promise that resolves to the detailed ticket information.
     */
    async getTicketDetails(ticketId: string): Promise<SupportTicket> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.get(`/v1/support/tickets/${ticketId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ticket details for ${ticketId}:`, error);
            throw error;
        }
    },

    /**
     * Adds a new message to an existing support ticket.
     * @param {string} ticketId - The ID of the ticket to add the message to.
     * @param {AddMessagePayload} payload - The content of the message.
     * @returns {Promise<SupportMessage>} A promise that resolves to the newly added message.
     */
    async addMessageToTicket(ticketId: string, payload: AddMessagePayload): Promise<SupportMessage> {
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.post(`/v1/support/tickets/${ticketId}/messages`, { body: payload.content });
            return response.data;
        } catch (error) {
            console.error(`Error adding message to ticket ${ticketId}:`, error);
            throw error;
        }
    },

    /**
     * Updates the status of a support ticket.
     * @param {string} ticketId - The ID of the ticket to update.
     * @param {string} status - The new status for the ticket.
     * @returns {Promise<SupportTicket>} A promise that resolves to the updated ticket information.
     */
    async updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> { // Status agora é string para flexibilidade
        try {
            // Usa a instância 'api' centralizada para todas as requisições
            const response = await api.patch(`/v1/support/tickets/${ticketId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating ticket status for ${ticketId}:`, error);
            throw error;
        }
    },
};