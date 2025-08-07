// LimpeJaApp/services/safetyService.ts
import api from './api'; // Assuming you have an api.ts for Axios instance
import {
  ReportPanicDto,
  MessageResponse,
  IncidentReportDto, // Certifique-se de que IncidentReportDto inclui involvedUsers e attachments
  Incident,
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

// You might also need a service for getting location, but expo-location is used directly in the component.
// This file focuses on API calls.