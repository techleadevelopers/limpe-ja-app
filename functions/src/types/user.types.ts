// LimpeJaApp/functions/src/types/user.types.ts
import * as admin from "firebase-admin";

export type UserRole = "client" | "provider" | "admin";

export interface AuthUserRecord {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
}

export interface UserProfile {
  id: string; // O UID do usuário
  email: string;
  role: UserRole;
  name?: string;
  cpf?: string;
  dateOfBirth?: string;
  phone?: string;
  avatarUrl?: string;
  addresses?: UserAddress[];
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  // Campos específicos para administradores ou estados gerenciados pelo admin
  isDisabledByAdmin?: boolean;
  disabledReason?: string | null;
  isProviderVerified?: boolean; // Espelha o status de verificação do prestador no UserProfile
  fcmTokens?: string[]; // <<< ADICIONADO: Array de tokens FCM para notificações
  isProvider?: boolean; // Indica se este UserProfile também tem um ProviderProfile associado
}

export interface UserAddress {
  id: string;
  alias?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
}