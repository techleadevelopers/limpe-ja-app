// LimpeJaApp/functions/src/types/user.types.ts
import * as admin from "firebase-admin";

// Modifique UserRole para incluir 'admin'
export type UserRole = "client" | "provider" | "admin"; // <<<--- ADICIONADO "admin"

export interface AuthUserRecord {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
}

export interface UserProfile {
  id: string; 
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
  isProviderVerified?: boolean; // Exemplo se quiser espelhar no UserProfile
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