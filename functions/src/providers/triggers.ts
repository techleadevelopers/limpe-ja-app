
import { region } from "firebase-functions/v1";
// import { db } from "../config/firebaseAdmin";
// import { ProviderProfile } from "../types";

const REGION = "southamerica-east1";

// Exemplo: Trigger para quando um perfil de provedor é atualizado
export const onProviderProfileWrite = region(REGION)
  .firestore.document("providerProfiles/{providerId}")
  .onWrite(async (change, context) => {
    const providerId = context.params.providerId;
    
    if (!change.after.exists) {
      console.log(`[ProvidersTrigger] Perfil do provedor ${providerId} foi deletado.`);
      // TODO: Lógica de limpeza se necessário (ex: desativar serviços associados)
      return null;
    }

    const newData = change.after.data() as import("../types").ProviderProfile; // Cast para seu tipo
    
    if (!change.before.exists) {
        console.log(`[ProvidersTrigger] Novo perfil de provedor criado para ${providerId}: ${newData.name}`);
        // TODO: Lógica para quando um novo provedor é efetivamente criado/aprovado
        // Enviar email de boas-vindas, etc.
    } else {
        const oldData = change.before.data() as import("../types").ProviderProfile;
        console.log(`[ProvidersTrigger] Perfil do provedor ${providerId} atualizado.`);
        // TODO: Lógica para atualizações, ex: se 'isVerified' mudou, enviar notificação.
        if (newData.isVerified !== oldData.isVerified && newData.isVerified) {
            console.log(`[ProvidersTrigger] Provedor ${providerId} foi verificado!`);
            // Enviar notificação para o provedor
        }
    }
    return null;
  });