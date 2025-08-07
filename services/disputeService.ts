// services/disputeService.ts

import api from './api'; // Assumindo que você tem um arquivo api.ts para suas requisições HTTP
import { ReportDisputeDto, Dispute, DisputeResponse } from '../types/backend/disputes'; // Ajuste o caminho conforme a sua estrutura de pastas
import axios from 'axios'; // <-- Adicione esta linha para importar a biblioteca axios

const BASE_URL = '/bookings'; // Disputas são aninhadas sob bookings no backend

export const disputeService = {
  /**
   * Reporta uma disputa para um agendamento específico.
   * @param bookingId O ID do agendamento ao qual a disputa está relacionada.
   * @param data DTO com os detalhes da disputa.
   * @returns A disputa criada.
   */
  reportDispute: async (
    bookingId: string,
    data: ReportDisputeDto,
  ): Promise<Dispute> => {
    try {
      // O backend retorna DisputeResponse que contém a disputa
      const response = await api.post<DisputeResponse>(
        `${BASE_URL}/${bookingId}/dispute`,
        data,
      );
      return response.data.dispute;
    } catch (error) {
      console.error(`Erro ao reportar disputa para o agendamento ${bookingId}:`, error);
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
      // O backend retorna DisputeResponse que contém a disputa
      const response = await api.get<DisputeResponse>(
        `${BASE_URL}/${bookingId}/dispute`,
      );
      return response.data.dispute;
    } catch (error: any) {
      // Se o backend retornar 404 para disputa não encontrada, retorne null
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return null;
      }
      console.error(`Erro ao buscar disputa para o agendamento ${bookingId}:`, error);
      throw error;
    }
  },

  // Adicione outros métodos conforme a necessidade (ex: atualizar status da disputa, se permitido ao cliente/provedor)
};