// LimpeJaApp/src/types/backend/dashboard.ts

import { BookingDetails, BookingStatus } from './bookings';
// CORREÇÃO: Importar 'ProviderReview' que é a interface correta para reviews de provedor
import { ProviderReview } from './providers';

// Este tipo representa a resposta completa do endpoint GET /providers/me/dashboard
export interface ProviderDashboard {
    fullName: string;
    upcomingBookings: BookingDetails[];
    totalEarnings: number;
    pendingWithdrawals: number;
    // CORREÇÃO: Usar ProviderReview para o array de avaliações
    reviews: ProviderReview[];
    fiveStarReviewCount: number;
    monthlyBookingsCount: number;
}