import axios, { AxiosResponse, AxiosError } from 'axios';
import api from './api';

// IMPORTAR DTOs E TIPAGENS DO ARQUIVO CENTRALIZADO
import { BookingDetails, BookingStatus, CreateBookingDto, UpdateBookingStatusDto } from '../types/backend/bookings'; // Certifique-se de que CreateBookingDto e BookingDetails estão atualizados

/**
 * @function createBooking
 * Cria um novo agendamento.
 * Corresponde a `POST /bookings`.
 * @param data DTO com os detalhes para criar o agendamento.
 *             Deve incluir `couponCode` e `address` com `latitude` e `longitude`.
 * @returns Promessa com o objeto BookingDetails criado.
 */
export const createBooking = async (data: CreateBookingDto): Promise<BookingDetails> => {
    try {
        const response: AxiosResponse<BookingDetails> = await api.post<BookingDetails>('/bookings', data);
        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.warn('Erro ao criar agendamento (dev only):', error.response?.data || error.message);
        }
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
        if (__DEV__) {
            console.warn('Erro ao buscar agendamentos do usuário (dev only):', error.response?.data || error.message);
        }
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
export async function getBookingDetails(bookingId: string): Promise<BookingDetails> {
    try {
        const response: AxiosResponse<BookingDetails> = await api.get<BookingDetails>(`/bookings/${bookingId}`);
        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.warn(`Erro ao buscar detalhes do agendamento ${bookingId} (dev only):`, error.response?.data || error.message);
        }
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
        if (__DEV__) {
            console.warn(`Erro ao atualizar status do agendamento ${bookingId} (dev only):`, error.response?.data || error.message);
        }
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
        if (__DEV__) {
            console.warn(`Erro ao cancelar agendamento ${bookingId} (dev only):`, error.response?.data || error.message);
        }
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || `Erro ao cancelar agendamento ${bookingId}.`);
        }
        throw new Error(`Erro de rede ou servidor ao cancelar agendamento ${bookingId}.`);
    }
}

/**
 * @function checkActiveChatBooking
 * Verifica se existe um agendamento ATIVO (CONFIRMED ou IN_PROGRESS) entre um cliente e um provedor.
 * Usado para controlar o acesso ao chat (botão de iniciar chat).
 * @param clientId O ID do cliente.
 * @param providerId O ID do provedor.
 * @returns Promessa que resolve para um objeto contendo `canChat: boolean` e, opcionalmente, `bookingId: string`.
 * @remarks Este método assume que o backend terá um endpoint correspondente, por exemplo:
 *          GET /bookings/check-active-chat/:clientId/:providerId
 *          que retorna { canChat: boolean, bookingId?: string }.
 *          Se o endpoint não existir (404), retorna { canChat: false } silenciosamente.
 *          IMPLEMENTE NO BACKEND: Query DB por bookings ativos entre os IDs.
 */
export const checkActiveChatBooking = async (clientId: string, providerId: string): Promise<{ canChat: boolean; bookingId?: string }> => {
    try {
        const response: AxiosResponse<{ canChat: boolean; bookingId?: string }> = await api.get(`/bookings/check-active-chat/${clientId}/${providerId}`);
        // Validação extra: Se response.data inválido, fallback para false
        return {
            canChat: response.data?.canChat ?? false,
            bookingId: response.data?.bookingId,
        };
    } catch (error: any) {
        // MELHORIA: Log silencioso só em dev; não mostra nada ao usuário
        if (__DEV__) {
            if (axios.isAxiosError(error)) {
                console.warn(
                    `Erro ao verificar agendamento ativo para chat (dev only):`,
                    error.response?.status === 404 ? 'Endpoint não implementado (404)' : (error.response?.data || error.message)
                );
            } else {
                console.warn(`Erro não-Axios no check chat (dev only):`, error);
            }
        }
        // SEMPRE RETORNA FALSE EM ERRO: UX premium, chat desabilitado silenciosamente
        return { canChat: false };
    }
};

// Mantido para compatibilidade, mas `checkActiveChatBooking` é mais específico para o contexto do chat.
// Se `checkConfirmedBookingBetweenUsers` for usado em outros lugares, mantenha-o.
// Caso contrário, considere removê-lo e usar apenas `checkActiveChatBooking`.
export const checkConfirmedBookingBetweenUsers = async (clientId: string, providerId: string): Promise<boolean> => {
    try {
        const response: AxiosResponse<{ hasConfirmedBooking: boolean }> = await api.get(`/bookings/check-confirmed/${clientId}/${providerId}`);
        return response.data.hasConfirmedBooking ?? false;
    } catch (error: any) {
        if (__DEV__) {
            console.warn(`Erro ao verificar agendamento confirmado (dev only):`, error.response?.data || error.message);
        }
        return false; // Fallback silencioso
    }
};