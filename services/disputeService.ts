// services/disputeService.ts

import { api } from './api'; // Assumindo que você tem um arquivo api.ts para suas requisições HTTP
import { createLocalConsole } from './logging';
const console = createLocalConsole();
import { ReportDisputeDto, Dispute, DisputeResponse, DisputeMessage } from '../types/backend/disputes'; // Ajuste o caminho conforme a sua estrutura de pastas
import axios from 'axios'; // <-- Adicione esta linha para importar a biblioteca axios
import * as NotificationService from '../services/notificationService'; // NEW: Import NotificationService for error handling
import * as Sentry from '@sentry/react-native'; // NEW: Import Sentry (conceptual, requires setup)


const BASE_URL = '/bookings'; // Disputas são aninhadas sob bookings no backend

export const disputeService = {
  /**
   * Reporta uma disputa para um agendamento específico.
   * @param bookingId O ID do agendamento ao qual a disputa está relacionada.
   * @param data DTO com os detalhes da disputa.
   * @param idempotencyKey Opcional: Chave de idempotência para a requisição.
   * @returns A disputa criada.
   */
  reportDispute: async (
    bookingId: string,
    data: ReportDisputeDto,
    idempotencyKey?: string, // NEW: Added idempotencyKey
  ): Promise<Dispute> => {
    try {
      const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
      const response = await api.post<DisputeResponse>(
        `${BASE_URL}/${bookingId}/dispute`,
        data,
        { headers } // NEW: Pass headers
      );
      return response.data.dispute;
    } catch (error: any) {
      // NEW: Centralized error handling
      Sentry.captureException(error);
      (NotificationService as any).notifyError('Erro ao reportar disputa. Tente novamente mais tarde.');
      console.error(`Erro ao reportar disputa para o agendamento ${bookingId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtém os detalhes da disputa para um agendamento específico.
   * @param bookingId O ID do agendamento.
   * @returns Os detalhes da disputa, se existir.
   */
  getDisputeByBookingId: async (bookingId: string): Promise<Dispute | null> => {
    try {
      const response = await api.get<DisputeResponse>(
        `${BASE_URL}/${bookingId}/dispute`,
      );
      return response.data.dispute;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return null;
      }
      // NEW: Centralized error handling
      Sentry.captureException(error);
      (NotificationService as any).notifyError('Erro ao buscar detalhes da disputa. Tente novamente.');
      console.error(`Erro ao buscar disputa para o agendamento ${bookingId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Envia uma mensagem relacionada a uma disputa já existente.
   */
  addMessage: async (disputeId: string, content: string): Promise<DisputeMessage> => {
    const trimmed = content?.trim();
    if (!trimmed) {
      throw new Error('O conteúdo da mensagem não pode ficar em branco.');
    }

    try {
      const response = await api.post<DisputeMessage>(`/disputes/${disputeId}/message`, {
        content: trimmed,
      });
      return response.data;
    } catch (error: any) {
      Sentry.captureException(error);
      (NotificationService as any).notifyError(
        'Erro ao enviar mensagem da disputa. Tente novamente mais tarde.',
      );
      console.error(`Erro ao adicionar mensagem à disputa ${disputeId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Adicione outros métodos conforme a necessidade (ex: atualizar status da disputa, se permitido ao cliente/provedor)
};
