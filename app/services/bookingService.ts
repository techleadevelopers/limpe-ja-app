// LimpeJaApp/app/services/bookingService.ts
import api from './api';
import axios, { AxiosResponse } from 'axios';

// IMPORTAR DTOs E TIPAGENS DO ARQUIVO CENTRALIZADO
import { CreateBookingDto, BookingDetails, UpdateBookingStatusDto, BookingStatus } from '../types/backend/bookings';

/**
 * @function createBooking
 * Cria um novo agendamento.
 * Corresponde a `POST /bookings`.
 * @param data DTO com os detalhes para criar o agendamento.
 * @returns Promessa com o objeto BookingDetails criado.
 */
export const createBooking = async (data: CreateBookingDto): Promise<BookingDetails> => {
    try {
        const response: AxiosResponse<BookingDetails> = await api.post<BookingDetails>('/bookings', data);
        return response.data;
    } catch (error: any) {
        console.error('Erro ao criar agendamento:', error.response?.data || error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Erro ao criar agendamento.');
        }
        throw new Error('Erro de rede ou servidor ao criar agendamento.');
    }
};

/**
 * @function getBookingsForUser
 * Obtém a lista de agendamentos do usuário logado (cliente ou provedor).
 * Corresponde a `GET /bookings/me`.
 * Pode aceitar filtros de status (ex: 'PENDING', 'CONFIRMED').
 * @param status Opcional: status para filtrar os agendamentos.
 * @returns Promessa com um array de objetos BookingDetails.
 */
export async function getBookingsForUser(status?: BookingStatus): Promise<BookingDetails[]> {
    try {
        const params = status ? { status } : {};
        const response: AxiosResponse<BookingDetails[]> = await api.get<BookingDetails[]>('/bookings/me', { params });
        return response.data;
    } catch (error: any) {
        console.error('Erro ao buscar agendamentos do usuário:', error.response?.data || error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Erro ao buscar agendamentos.');
        }
        throw new Error('Erro de rede ou servidor ao buscar agendamentos.');
    }
}

/**
 * @function getBookingDetails
 * Obtém os detalhes de um agendamento específico por ID.
 * Corresponde a `GET /bookings/:id`.
 * @param bookingId O ID do agendamento.
 * @returns Promessa com o objeto BookingDetails.
 */
// ESTA FUNÇÃO JÁ ESTÁ CORRETA E PRONTA PARA USO!
export async function getBookingDetails(bookingId: string): Promise<BookingDetails> {
    try {
        const response: AxiosResponse<BookingDetails> = await api.get<BookingDetails>(`/bookings/${bookingId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Erro ao buscar detalhes do agendamento ${bookingId}:`, error.response?.data || error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || `Erro ao buscar detalhes do agendamento ${bookingId}.`);
        }
        throw new Error(`Erro de rede ou servidor ao buscar detalhes do agendamento ${bookingId}.`);
    }
}

/**
 * @function updateBookingStatus
 * Atualiza o status de um agendamento específico.
 * Corresponde a `PATCH /bookings/:id/status`.
 * @param bookingId O ID do agendamento.
 * @param data DTO com o novo status e outros campos de atualização.
 * @returns Promessa com o objeto BookingDetails atualizado.
 */
export async function updateBookingStatus(bookingId: string, data: UpdateBookingStatusDto): Promise<BookingDetails> {
    try {
        const response: AxiosResponse<BookingDetails> = await api.patch<BookingDetails>(`/bookings/${bookingId}/status`, data);
        return response.data;
    } catch (error: any) {
        console.error(`Erro ao atualizar status do agendamento ${bookingId}:`, error.response?.data || error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || `Erro ao atualizar status do agendamento ${bookingId}.`);
        }
        throw new Error(`Erro de rede ou servidor ao atualizar status do agendamento ${bookingId}.`);
    }
}

/**
 * @function cancelBooking
 * Cancela um agendamento específico.
 * Corresponde a `PATCH /bookings/:id/cancel`.
 * @param bookingId O ID do agendamento a ser cancelado.
 * @returns Promessa com o objeto BookingDetails atualizado (com status CANCELED).
 */
export async function cancelBooking(bookingId: string): Promise<BookingDetails> {
    try {
        const response: AxiosResponse<BookingDetails> = await api.patch<BookingDetails>(`/bookings/${bookingId}/cancel`);
        return response.data;
    } catch (error: any) {
        console.error(`Erro ao cancelar agendamento ${bookingId}:`, error.response?.data || error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || `Erro ao cancelar agendamento ${bookingId}.`);
        }
        throw new Error(`Erro de rede ou servidor ao cancelar agendamento ${bookingId}.`);
    }
}