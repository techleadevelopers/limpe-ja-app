// LimpeJaApp/app/services/supportService.ts
import axios from 'axios';
import { SupportTicket, CreateTicketPayload, AddMessagePayload, SupportMessage } from '../types/backend/support';

// Replace with your actual API base URL. It's recommended to use environment variables.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'; 

export const supportService = {
    /**
     * Creates a new support ticket.
     * @param {CreateTicketPayload} payload - The subject and initial message for the new ticket.
     * @returns {Promise<SupportTicket>} A promise that resolves to the newly created ticket.
     */
    async createTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
        try {
            const response = await axios.post(`${API_BASE_URL}/v1/support/tickets`, payload);
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
            const response = await axios.get(`${API_BASE_URL}/v1/support/tickets`);
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
            const response = await axios.get(`${API_BASE_URL}/v1/support/tickets/${ticketId}`);
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
            const response = await axios.post(`${API_BASE_URL}/v1/support/tickets/${ticketId}/messages`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error adding message to ticket ${ticketId}:`, error);
            throw error;
        }
    },

    /**
     * Updates the status of a support ticket.
     * @param {string} ticketId - The ID of the ticket to update.
     * @param {'open' | 'pending' | 'closed'} status - The new status for the ticket.
     * @returns {Promise<SupportTicket>} A promise that resolves to the updated ticket information.
     */
    async updateTicketStatus(ticketId: string, status: 'open' | 'pending' | 'closed'): Promise<SupportTicket> {
        try {
            const response = await axios.patch(`${API_BASE_URL}/v1/support/tickets/${ticketId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating ticket status for ${ticketId}:`, error);
            throw error;
        }
    },
};