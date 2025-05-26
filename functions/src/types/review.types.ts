// LimpeJaApp/functions/src/types/review.types.ts
import * as admin from "firebase-admin";
import { UserRole } from "./user.types"; // Importe UserRole se for usar

export interface Review {
  id?: string;
  bookingId: string;
  serviceId?: string;
  reviewerId: string;
  reviewerRole: UserRole; // Ou "client" | "provider"
  reviewerName?: string; // Denormalizado
  reviewerAvatarUrl?: string; // Denormalizado
  revieweeId: string;
  revieweeRole: UserRole; // Ou "client" | "provider"
  rating: number;
  comment?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue; // <<<--- ADICIONADO AQUI (opcional)
  isAnonymous?: boolean;
}