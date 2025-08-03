// LimpeJaApp/src/types/backend/dashboard.ts

import { BookingDetails, BookingStatus } from './bookings';
// CORREÇÃO: Importar 'ReviewEntity' que é a interface correta no arquivo reviews.ts
import { ReviewEntity } from './reviews';

// Este tipo representa a resposta completa do endpoint GET /providers/me/dashboard
export interface ProviderDashboard {
    fullName: string;
    upcomingBookings: BookingDetails[];
    totalEarnings: number;
    pendingWithdrawals: number;
    // CORREÇÃO: Usar ReviewEntity para o array de avaliações
    reviews: ReviewEntity[];
    fiveStarReviewCount: number;
    monthlyBookingsCount: number;
}