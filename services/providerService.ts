// LimpeJaApp/src/services/providerService.ts
import { api } from './api';
// Importe seus tipos relevantes

export const getProviderDashboardSummary = async () => {
  console.log('providerService: fetching dashboard summary');
  // const response = await api.get('/provider/dashboard');
  // return response.data;
  return Promise.resolve({ upcomingServices: 2, newRequests: 1, weeklyEarnings: 300 }); // Mock
};

export const getProviderSchedule = async (params: { dateFrom: string, dateTo: string }) => {
  console.log('providerService: fetching schedule with params:', params);
  // const response = await api.get('/provider/schedule', { params });
  // return response.data; // Ex: Booking[]
  return Promise.resolve([
    { id: 'provBook1', clientName: 'Cliente A', date: new Date().toISOString(), time: '10:00', serviceType: 'Limpeza Padrão' }
  ]); // Mock
};

export const updateProviderAvailability = async (availabilityData: any) => {
  console.log('providerService: updating availability:', availabilityData);
  // const response = await api.post('/provider/availability', availabilityData);
  // return response.data;
  return Promise.resolve({ message: 'Disponibilidade atualizada.' }); // Mock
};

export const getProviderServicesOrRequests = async (params: { filter: 'requests' | 'upcoming' | 'completed' }) => {
  console.log('providerService: fetching services/requests with filter:', params.filter);
  // const response = await api.get('/provider/services', { params });
  // return response.data;
  if (params.filter === 'requests') {
    return Promise.resolve([{ id: 'req1', clientName: 'Cliente Solicitante', serviceType: 'Limpeza Urgente' }]);
  }
  return Promise.resolve([]); // Mock
};

export const getProviderServiceDetails = async (serviceId: string) => {
  console.log('providerService: fetching details for serviceId:', serviceId);
  // const response = await api.get(`/provider/services/${serviceId}`);
  // return response.data;
  return Promise.resolve({ id: serviceId, clientName: 'Cliente Detalhe', serviceType: 'Limpeza Completa', notes: 'N/A' }); // Mock
};

export const updateServiceStatusByProvider = async (serviceId: string, status: 'accepted' | 'declined' | 'completed' | 'started') => {
  console.log('providerService: updating status for serviceId:', serviceId, 'to', status);
  // const response = await api.patch(`/provider/services/${serviceId}/status`, { status });
  // return response.data;
  return Promise.resolve({ message: `Serviço ${status} com sucesso.` }); // Mock
};

export const getProviderEarnings = async () => {
  console.log('providerService: fetching earnings');
  // const response = await api.get('/provider/earnings');
  // return response.data;
  return Promise.resolve({ totalBalance: 1200, recentTransactions: [] }); // Mock
};

export const updateProviderProfileAndServices = async (profileData: any) => {
  console.log('providerService: updating provider profile/services:', profileData);
  // const response = await api.put('/provider/profile-services', profileData);
  // return response.data;
  return Promise.resolve({ message: 'Perfil e serviços atualizados.' }); // Mock
};

// Adicione mais funções conforme necessário