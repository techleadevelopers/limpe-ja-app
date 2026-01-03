export type ProviderAppointmentStatus =
  | 'Confirmado'
  | 'PendenteCliente'
  | 'ARealizar'
  | 'Concluído'
  | 'Cancelado';

export interface ProviderAppointment {
  id: string;
  clientName: string;
  clientAvatarUrl?: string;
  serviceType: string;
  bookingId?: string;
  startTime: string;
  serviceId?: string;
  endTime?: string;
  date: string;
  status: ProviderAppointmentStatus;
  addressSummary?: string;
}

const ALL_PROVIDER_APPOINTMENTS: ProviderAppointment[] = [
  {
    id: 'servA1',
    clientName: 'Fernanda Lima',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    serviceType: 'Limpeza Padrão',
    startTime: '09:00',
    endTime: '12:00',
    date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    status: 'Confirmado',
    addressSummary: 'Rua das Flores, 100',
  },
  {
    id: 'servA2',
    clientName: 'Ricardo Alves',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    serviceType: 'Limpeza Pesada',
    startTime: '14:00',
    endTime: '18:00',
    date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    status: 'Confirmado',
    addressSummary: 'Av. Brasil, 500',
  },
  {
    id: 'servA3',
    clientName: 'Juliana Moreira',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    serviceType: 'Limpeza de Manutenção',
    startTime: '10:00',
    endTime: '13:00',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'ARealizar',
    addressSummary: 'Travessa da Paz, 45',
  },
  {
    id: 'servA4',
    clientName: 'Marcos Andrade',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
    serviceType: 'Limpeza de Vidros',
    startTime: '08:00',
    endTime: '10:00',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'Concluído',
    addressSummary: 'Rua do Sol, 20',
  },
  {
    id: 'servA5',
    clientName: 'Ana Paula',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
    serviceType: 'Limpeza Pós-Obra',
    startTime: '09:00',
    endTime: '17:00',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    status: 'PendenteCliente',
    addressSummary: 'Praça da Liberdade, 10',
  },
  {
    id: 'servA6',
    clientName: 'Pedro Costa',
    clientAvatarUrl: 'https://randomuser.me/api/portraits/men/6.jpg',
    serviceType: 'Limpeza Comercial',
    startTime: '13:00',
    endTime: '17:00',
    date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    status: 'ARealizar',
    addressSummary: 'Av. Central, 800',
  },
];

const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};

const delayWithAbort = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener?.('abort', onAbort);
      reject(createAbortError());
    };

    signal?.addEventListener?.('abort', onAbort);
  });

export const fetchProviderAppointments = async (
  _month?: string,
  _year?: string,
  signal?: AbortSignal
): Promise<ProviderAppointment[]> => {
  await delayWithAbort(800, signal);
  return ALL_PROVIDER_APPOINTMENTS;
};
