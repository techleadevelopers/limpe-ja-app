// LimpeJaApp/services/safetyService.ts
import { api } from './api'; // Assuming you have an api.ts for Axios instance
import {
  ReportPanicDto,
  MessageResponse,
  IncidentReportDto, // Certifique-se de que IncidentReportDto inclui involvedUsers e attachments
  Incident,
  PanicEvent, // NOVO: Importar PanicEvent
  IncidentReport, // NOVO: Importar IncidentReport
} from '../types/backend/safety'; // Certifique-se de que estes tipos estão corretos

export const reportPanic = async (data: ReportPanicDto): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/safety/panic', data);
  return response.data;
};

export const reportIncident = async (data: IncidentReportDto): Promise<Incident> => {
  // data deve incluir type, description, bookingId, involvedUsers, attachments
  const response = await api.post<Incident>('/safety/incident', data);
  return response.data;
};

export const getIncidentsForUser = async (): Promise<Incident[]> => {
  const response = await api.get<Incident[]>('/safety/me/incidents');
  return response.data;
};

/**
 * NOVO: Inicia um evento de pânico.
 * Corresponde a POST /safety/panic/trigger.
 * @param payload Dados do alerta de pânico (latitude, longitude, precisão, fonte).
 * @returns Promessa com o objeto PanicEvent.
 */
export const triggerPanic = async (payload: ReportPanicDto): Promise<PanicEvent> => {
  try {
    const response = await api.post<PanicEvent>('/safety/panic/trigger', payload);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao acionar pânico:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * NOVO: Atualiza a localização de um evento de pânico ativo.
 * Corresponde a PATCH /safety/panic/:panicId/update-location.
 * @param panicId O ID do evento de pânico.
 * @param coords Coordenadas atualizadas (latitude, longitude, precisão).
 * @returns Promessa vazia.
 */
export const updatePanicLocation = async (panicId: string, coords: { latitude: number; longitude: number; accuracy?: number }): Promise<void> => {
  try {
    await api.patch(`/safety/panic/${panicId}/update-location`, coords);
  } catch (error: any) {
    console.error(`Erro ao atualizar localização do pânico ${panicId}:`, error.response?.data || error.message);
    // Não relançar erro para não interromper o watchLocation em caso de falha temporária
  }
};

/**
 * NOVO: Encerra um evento de pânico ativo.
 * Corresponde a PATCH /safety/panic/:panicId/end.
 * @param panicId O ID do evento de pânico a ser encerrado.
 * @returns Promessa vazia.
 */
export const endPanic = async (panicId: string): Promise<void> => {
  try {
    await api.patch(`/safety/panic/${panicId}/end`);
  } catch (error: any) {
    console.error(`Erro ao encerrar pânico ${panicId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * NOVO: Cria um relatório de incidente associado a um evento de pânico.
 * Corresponde a POST /safety/panic/:panicId/incident.
 * @param panicId O ID do evento de pânico.
 * @param data Dados do relatório de incidente (descrição, anexos).
 * @returns Promessa com o objeto IncidentReport.
 */
export const createIncidentReport = async (panicId: string, data: { description: string; attachments?: string[] }): Promise<IncidentReport> => {
  try {
    const response = await api.post<IncidentReport>(`/safety/panic/${panicId}/incident`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao criar relatório de incidente para pânico ${panicId}:`, error.response?.data || error.message);
    throw error;
  }
};