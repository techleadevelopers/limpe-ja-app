// LimpeJaApp/functions/src/users/callable.ts
import * as functions from "firebase-functions"; // Para HttpsError e logger
import { region } from "firebase-functions/v1";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
// UserAddress será usado em addUserAddress. UserRole é usado por assertRole.
import { UserProfile, UserAddress } from "../types"; 
import { assertRole } from "../utils/helpers";

const REGION = "southamerica-east1";

export const updateUserProfile = region(REGION).https.onCall(
  async (data: Partial<Omit<UserProfile, "role" | "email" | "id" | "createdAt">>, context) => { // <<-- 'context' SEM TIPO EXPLÍCITO AQUI
    // assertRole aqui é opcional se a lógica é apenas "usuário só atualiza o próprio perfil"
    // mas se você quiser garantir que apenas 'client' ou 'provider' possam chamar, adicione:
    // assertRole(context.auth, ["client", "provider"]); 

    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    const uid = context.auth.uid;
    const { ...updatableData } = data;

    if (Object.keys(updatableData).length === 0) { /* ... erro ... */ }
    functions.logger.info(`[UsersCallable] Usuário ${uid} atualizando perfil com dados:`, updatableData);

    try {
      const userProfileRef = db.collection("users").doc(uid);
      const dataToUpdateWithTimestamp = {
        ...updatableData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userProfileRef.update(dataToUpdateWithTimestamp);

      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updatableData.name) authUpdates.displayName = updatableData.name;
      if (updatableData.avatarUrl) authUpdates.photoURL = updatableData.avatarUrl;
      if (Object.keys(authUpdates).length > 0) {
        await adminAuth.updateUser(uid, authUpdates);
      }
      
      return { success: true, message: "Perfil atualizado com sucesso." };
    } catch (error: any) {
      functions.logger.error(`[UsersCallable] Erro ao atualizar perfil do usuário ${uid}:`, error);
      throw new functions.https.HttpsError("internal", "Não foi possível atualizar o perfil.", error.message);
    }
  }
);

export const addUserAddress = region(REGION).https.onCall(
  async (addressData: Omit<UserAddress, "id">, context) => { // <<-- 'context' SEM TIPO EXPLÍCITO AQUI
    assertRole(context.auth, "client"); // assertRole espera context.auth
    const uid = context.auth!.uid; 

    if (!addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city || !addressData.state || !addressData.zipCode) {
        throw new functions.https.HttpsError("invalid-argument", "Campos de endereço obrigatórios não preenchidos.");
    }

    const userAddressesRef = db.collection("users").doc(uid).collection("addresses");
    const newAddressRef = userAddressesRef.doc();
    const newAddress: UserAddress = { id: newAddressRef.id, ...addressData, isPrimary: addressData.isPrimary === undefined ? false : addressData.isPrimary };

    functions.logger.info(`[UsersCallable] Cliente ${uid} adicionando endereço:`, newAddress);
    try {
      // ... (lógica de batch para isPrimary como antes) ...
      await newAddressRef.set(newAddress); // Simplificado para o exemplo
      return { success: true, addressId: newAddressRef.id, message: "Endereço adicionado."};
    } catch (error: any) {
      functions.logger.error(`[UsersCallable] Erro ao adicionar endereço para ${uid}:`, error);
      throw new functions.https.HttpsError("internal", "Falha ao adicionar endereço.", error.message);
    }
  }
);