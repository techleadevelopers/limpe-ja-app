import { db } from "../config/firebaseAdmin";

// Coleção de usuários
export const usersCollection = db.collection("users");
// Coleção de perfis de prestadores
export const providerProfilesCollection = db.collection("providerProfiles");
// Coleção de agendamentos
export const bookingsCollection = db.collection("bookings");
// Coleção de avaliações
export const reviewsCollection = db.collection("reviews");
// Coleção de notificações (para persistir um histórico se desejado)
export const notificationsCollection = db.collection("userNotifications");


// Exemplo de função helper para buscar um perfil de usuário
export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`[FirestoreService] Perfil de usuário não encontrado para ID: ${userId}`);
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() } as import("../types").UserProfile;
  } catch (error) {
    console.error(`[FirestoreService] Erro ao buscar perfil do usuário ${userId}:`, error);
    throw error; // Propaga o erro para ser tratado pela function chamadora
  }
};

// TODO: Adicionar mais helpers genéricos para interagir com o Firestore
// ex: createDocument, updateDocument, getProviderProfile, etc.