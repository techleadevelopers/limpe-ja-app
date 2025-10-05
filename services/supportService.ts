// LimpeJaApp/app/services/supportService.ts
import { SupportTicket, CreateTicketPayload, AddMessagePayload, SupportMessage, TicketCategory, TicketSeverity } from '../types/backend/support';
import { api } from './api'; // Instância centralizada do Axios


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
     * Fetches support metadata (categories and severities) from backend.
     */
    async getMeta(): Promise<{ categories: TicketCategory[]; severities: TicketSeverity[] }> {
        try {
            const response = await api.get(`/v1/support/meta`);
            return response.data;
        } catch (error) {
            return { categories: ['PAYMENT','QUALITY','APP','OTHER'], severities: ['LOW','MEDIUM','HIGH'] } as any;
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
