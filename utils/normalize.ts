// utils/normalize.ts

import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { ProviderDisplayInfo } from '../types/backend/providers';
import { UserProfile } from '../types/backend/users';

/**
 * Normaliza um objeto de BookingDetails, garantindo que campos essenciais tenham valores padrão.
 * Isso ajuda a prevenir crashes se o backend retornar dados incompletos ou inesperados.
 * @param raw O objeto BookingDetails bruto recebido do backend.
 * @returns Um objeto BookingDetails normalizado.
 */
export function normalizeBooking(raw: any): BookingDetails {
  const normalizeStatus = (value: any): BookingStatus => {
    const s = String(value || '').toUpperCase();
    const map: Record<string, BookingStatus> = {
      STARTED: BookingStatus.IN_PROGRESS,
      IN_PROGRESS: BookingStatus.IN_PROGRESS,
      ARRIVED: BookingStatus.IN_PROGRESS,
      ON_THE_WAY: BookingStatus.IN_PROGRESS,
      CONFIRMED: BookingStatus.CONFIRMED,
      PENDING: BookingStatus.PENDING,
      PENDING_PROVIDER_CONFIRMATION: BookingStatus.PENDING_PROVIDER_CONFIRMATION,
      FINISHED: BookingStatus.COMPLETED,
      COMPLETED: BookingStatus.COMPLETED,
      CANCELLED: BookingStatus.CANCELLED,
      CANCELED: BookingStatus.CANCELLED,
      REJECTED: BookingStatus.REJECTED,
      RESCHEDULED: BookingStatus.RESCHEDULED,
      NO_SHOW: BookingStatus.NO_SHOW,
    };
    return map[s] || BookingStatus.PENDING;
  };

  return {
    id: raw?.id || 'unknown-booking-id',

    // ✅ troque userId -> clientId (seguindo a tipagem)
    clientId: raw?.clientId || 'unknown-client-id',
    clientFullName: raw?.clientFullName || 'Cliente Desconhecido',
    clientEmail: raw?.clientEmail || 'cliente@desconhecido.com',
    clientAvatarUrl: raw?.clientAvatarUrl || null,

    providerId: raw?.providerId || 'unknown-provider-id',
    providerFullName: raw?.providerFullName || 'Prestador(a) Desconhecido(a)',
    providerEmail: raw?.providerEmail || 'prestador@desconhecido.com',
    providerAvatarUrl: raw?.providerAvatarUrl || null,

    providerServiceId: raw?.providerServiceId || 'unknown-service-id',
    serviceId: raw?.serviceId || 'unknown-service-id',
    serviceName: raw?.serviceName || 'Serviço Desconhecido',
    serviceDescription: raw?.serviceDescription || null,
    servicePrice: Number(raw?.servicePrice) || 0,
    serviceDurationMinutes: Number(raw?.serviceDurationMinutes) || 60,

    scheduledDate: raw?.scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: raw?.scheduledTime || '00:00',
    scheduledEndTime: raw?.scheduledEndTime || undefined,

    totalPrice: Number(raw?.totalPrice) || 0,
    status: normalizeStatus(raw?.status),
    notes: raw?.notes || null,

    address: {
      street: raw?.address?.street || 'Rua Desconhecida',
      number: raw?.address?.number || 'S/N',
      complement: raw?.address?.complement || null,
      neighborhood: raw?.address?.neighborhood || 'Bairro Desconhecido',
      city: raw?.address?.city || 'Cidade Desconhecida',
      state: raw?.address?.state || 'UF',
      cep: raw?.address?.cep || '00000-000',
      latitude: Number(raw?.address?.latitude) || 0,
      longitude: Number(raw?.address?.longitude) || 0,
    },

    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString(),

    reviewId: raw?.reviewId || null,
    reviewRating: Number(raw?.reviewRating) || null,
    reviewComment: raw?.reviewComment || null,
    isReviewed: raw?.isReviewed || false,

    subscriptionId: raw?.subscriptionId || null,
    incidents: raw?.incidents || [],
    guaranteeClaims: raw?.guaranteeClaims || [],
    couponId: raw?.couponId || null,
    discountAmount: raw?.discountAmount || null,
    insurance: raw?.insurance ?? null,
    proofs: raw?.proofs || [],
    allowedActions: raw?.allowedActions || [],
  };
}

/**
 * Normaliza um objeto de ProviderDisplayInfo, garantindo que campos essenciais tenham valores padrão.
 * @param raw O objeto ProviderDisplayInfo bruto recebido do backend.
 * @returns Um objeto ProviderDisplayInfo normalizado.
 */
export function normalizeProvider(raw: any): ProviderDisplayInfo {
  return {
    id: raw?.id || 'unknown-provider-id',
    userId: raw?.userId || 'unknown-user-id', // Adicionado userId conforme BookingDetails
    fullName: raw?.fullName || 'Prestador(a) Desconhecido(a)',
    avatarUrl: raw?.avatarUrl || null,
    // CORREÇÃO: averageRating deve ser um número, não pode ser null.
    averageRating: Number(raw?.averageRating) || 0,
    reviewCount: Number(raw?.reviewCount) || 0, // Adicionado valor padrão para reviewCount
    email: raw?.email || 'email@desconhecido.com', // Adicionado valor padrão para email
    verificationStatus: raw?.verificationStatus || 'PENDING', // Adicionado valor padrão
    createdAt: raw?.createdAt || new Date().toISOString(), // Adicionado valor padrão
    updatedAt: raw?.updatedAt || new Date().toISOString(), // Adicionado valor padrão
    badges: raw?.badges || [], // Adicionado valor padrão
    user: { // Adicionado user com valores padrão
      email: raw?.user?.email || 'email@desconhecido.com',
      role: raw?.user?.role || 'CLIENT',
      isVerified: raw?.user?.isVerified || false,
    },
    // Adicione outros campos de ProviderDisplayInfo com valores padrão se necessário
  };
}

/**
 * Normaliza um objeto de UserProfile, garantindo que campos essenciais tenham valores padrão.
 * @param raw O objeto UserProfile bruto.
 * @returns Um objeto UserProfile normalizado.
 */
export function normalizeUser(raw: any): UserProfile {
  return {
    id: raw?.id || 'unknown-user-id',
    email: raw?.email || 'email@desconhecido.com',
    fullName: raw?.fullName || 'Usuário Desconhecido',
    role: raw?.role || 'CLIENT', // Assumindo 'CLIENT' como padrão
    clientDetails: raw?.clientDetails ? {
      ...raw.clientDetails,
      address: raw.clientDetails.address ? {
        street: raw.clientDetails.address.street || '',
        number: raw.clientDetails.address.number || '',
        complement: raw.clientDetails.address.complement || null,
        neighborhood: raw.clientDetails.address.neighborhood || '',
        city: raw.clientDetails.address.city || '',
        state: raw.clientDetails.address.state || '',
        cep: raw.clientDetails.address.cep || '',
        latitude: Number(raw.clientDetails.address.latitude) || 0,
        longitude: Number(raw.clientDetails.address.longitude) || 0,
      } : undefined,
      totalBookings: Number(raw.clientDetails.totalBookings) || 0,
    } : undefined,
    providerDetails: raw?.providerDetails ? {
      ...raw.providerDetails,
      address: raw.providerDetails.address ? {
        street: raw.providerDetails.address.street || '',
        number: raw.providerDetails.address.number || '',
        complement: raw.providerDetails.address.complement || null,
        neighborhood: raw.providerDetails.address.neighborhood || '',
        city: raw.providerDetails.address.city || '',
        state: raw.providerDetails.address.state || '',
        cep: raw.providerDetails.address.cep || '',
        latitude: Number(raw.providerDetails.address.latitude) || 0,
        longitude: Number(raw.providerDetails.address.longitude) || 0,
      } : undefined,
    } : undefined,
    // ... outros campos de UserProfile
  };
}
