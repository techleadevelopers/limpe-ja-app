import { region } from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { db, auth } from "../config/firebaseAdmin";
// Corrected import: Changed 'Service' to 'OfferedService'
import { ProviderProfile, UserProfile, NotificationPayload, NotificationType, OfferedService } from "../types";
import { sendPushNotification } from "../services/notification.service";

// --- Conceptual Services (to be implemented elsewhere, e.g., in ../services/) ---

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

const emailService = {
  sendEmail: async (options: EmailOptions): Promise<void> => {
    console.log(`[EmailService] Sending email to ${options.to} with subject "${options.subject}"`);
    if (process.env.FUNCTIONS_EMULATOR) {
        console.log(`[EmailService] Mock email sent: To: ${options.to}, Subject: ${options.subject}, Body: ${options.htmlBody.substring(0,100)}...`);
    }
    return Promise.resolve();
  },
  getAdminEmails: async (): Promise<string[]> => {
    return ["admin@limpeja.com"];
  }
};

interface SearchableProviderData {
  objectID: string;
  name?: string;
  description?: string;
  servicesOfferedSummary?: string[];
  averageRating?: number;
  city?: string;
  state?: string;
  _geoloc?: { lat: number; lng: number };
  isVerified?: boolean;
  isActive?: boolean;
}

const searchService = {
  indexProvider: async (providerId: string, data: ProviderProfile): Promise<void> => {
    const searchableData: SearchableProviderData = {
      objectID: providerId,
      name: data.name,
      description: data.bio,
      servicesOfferedSummary: data.servicesOffered?.map(s => s.name),
      averageRating: data.averageRating || 0,
      // Corrected: Access city and state from the first address in the addresses array
      city: data.addresses && data.addresses.length > 0 ? data.addresses[0].city : undefined,
      state: data.addresses && data.addresses.length > 0 ? data.addresses[0].state : undefined,
      // Corrected: Access location for _geoloc (assuming 'location' is now part of ProviderProfile)
      _geoloc: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : undefined,
      isVerified: data.isVerified || false,
      isActive: (data.isVerified || false) && !(data.isDisabledByAdmin || false),
    };
    console.log(`[SearchService] Indexing provider ${providerId}:`, searchableData);
    return Promise.resolve();
  },
  removeProvider: async (providerId: string): Promise<void> => {
    console.log(`[SearchService] Removing provider ${providerId} from index.`);
    return Promise.resolve();
  },
  updateProviderStatusInIndex: async (providerId: string, isVerified: boolean, isDisabledByAdmin: boolean): Promise<void> => {
    const isActive = isVerified && !isDisabledByAdmin;
    console.log(`[SearchService] Updating status for provider ${providerId} in index. IsActive: ${isActive}, IsVerified: ${isVerified}, IsDisabled: ${isDisabledByAdmin}`);
     return Promise.resolve();
  }
};

// --- End Conceptual Services ---

const REGION = "southamerica-east1";

export const onProviderProfileWrite = region(REGION)
  .firestore.document("providerProfiles/{providerId}")
  .onWrite(async (change, context) => {
    const providerId = context.params.providerId;

    const oldData = change.before.data() as ProviderProfile | undefined;
    const newData = change.after.data() as ProviderProfile | undefined;

    // --- Cenário: Perfil do Provedor Deletado ---
    if (!newData) {
      console.log(`[ProvidersTrigger] Perfil do provedor ${providerId} foi deletado.`);
      try {
        await auth.updateUser(providerId, { disabled: true });
        console.log(`[ProvidersTrigger] Conta de autenticação ${providerId} desativada.`);

        // Assuming services are in a top-level 'services' collection and have a 'providerId' field.
        // We'll mark them as inactive. 'OfferedService' type should be used for documents in this collection.
        const servicesQuery = db.collection('services').where('providerId', '==', providerId).where('isActive', '==', true);
        const servicesSnapshot = await servicesQuery.get();
        if (!servicesSnapshot.empty) {
          const batch = db.batch();
          servicesSnapshot.docs.forEach(doc => {
            // Ensure you cast doc.data() to OfferedService if needed for strict type checking before update
            batch.update(doc.ref, { isActive: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          });
          await batch.commit();
          console.log(`[ProvidersTrigger] ${servicesSnapshot.size} serviço(s) do provedor ${providerId} marcado(s) como inativo(s).`);
        }

        const adminEmails = await emailService.getAdminEmails();
        if (adminEmails.length > 0) {
          await emailService.sendEmail({
            to: adminEmails,
            subject: `Alerta: Perfil de Provedor Deletado - ${oldData?.name || providerId}`,
            htmlBody: `<p>O perfil do provedor de serviços <strong>${oldData?.name || 'Nome não disponível'} (ID: ${providerId})</strong> foi deletado da plataforma LimpeJá.</p><p>A conta de autenticação foi desativada e os serviços associados foram marcados como inativos.</p><p>Esta é uma notificação automática.</p>`,
            textBody: `O perfil do provedor de serviços ${oldData?.name || 'Nome não disponível'} (ID: ${providerId}) foi deletado da plataforma LimpeJá. A conta de autenticação foi desativada e os serviços associados foram marcados como inativos. Esta é uma notificação automática.`
          });
          console.log(`[ProvidersTrigger] Notificação de deleção do provedor ${providerId} enviada aos administradores.`);
        }
        
        await searchService.removeProvider(providerId);

      } catch (error) {
        console.error(`[ProvidersTrigger] Erro ao processar deleção do provedor ${providerId}:`, error);
      }
      return null;
    }

    // --- Cenário: Novo Perfil de Provedor Criado ---
    if (!oldData) {
      console.log(`[ProvidersTrigger] Novo perfil de provedor criado para ${providerId}: ${newData.name}`);
      try {
        await db.collection('users').doc(providerId).set({
          isProvider: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isProviderVerified: newData.isVerified || false,
        }, { merge: true });
        console.log(`[ProvidersTrigger] UserProfile para ${providerId} atualizado com isProvider: true.`);

        if (newData.isVerified) {
          const userProfileSnap = await db.collection('users').doc(providerId).get();
          const userProfileData = userProfileSnap.data() as UserProfile;

          if (userProfileData?.fcmTokens && userProfileData.fcmTokens.length > 0) {
            const payload: NotificationPayload = {
              title: "Seu perfil foi verificado!",
              body: "Parabéns! Seu perfil LimpeJá foi verificado e agora está ativo para receber agendamentos.",
              data: {
                screen: "ProviderDashboard",
                notificationType: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
                status: "approved",
              }
            };
            await sendPushNotification(userProfileData.fcmTokens, payload, {
              saveToFirestore: true,
              userIdToSave: providerId,
              typeToSave: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
              navigateTo: "ProviderDashboard",
            });
            console.log(`[ProvidersTrigger] Notificação de verificação (criação) enviada para ${providerId}`);
          }

          const providerAuthUser = await auth.getUser(providerId);
          if (providerAuthUser.email) {
            await emailService.sendEmail({
              to: providerAuthUser.email,
              subject: "Bem-vindo ao LimpeJá! Seu perfil está verificado!",
              htmlBody: `<p>Olá ${newData.name || 'Provedor'},</p><p>Parabéns! Seu perfil como profissional de limpeza no LimpeJá foi criado e já está verificado.</p><p>Você já pode configurar seus serviços, horários e começar a receber agendamentos. Acesse o app para começar!</p><p>Atenciosamente,<br/>Equipe LimpeJá</p>`,
              textBody: `Olá ${newData.name || 'Provedor'},\n\nParabéns! Seu perfil como profissional de limpeza no LimpeJá foi criado e já está verificado.\n\nVocê já pode configurar seus serviços, horários e começar a receber agendamentos. Acesse o app para começar!\n\nAtenciosamente,\nEquipe LimpeJá`
            });
            console.log(`[ProvidersTrigger] Email de boas-vindas (verificado na criação) enviado para ${providerAuthUser.email}`);
          }
        }
        await searchService.indexProvider(providerId, newData);

      } catch (error) {
        console.error(`[ProvidersTrigger] Erro ao processar novo perfil do provedor ${providerId}:`, error);
      }
      return null;
    }

    // --- Cenário: Perfil do Provedor Atualizado ---
    if (oldData && newData) {
      console.log(`[ProvidersTrigger] Perfil do provedor ${providerId} atualizado.`);
      let needsReindexing = false;

      if (newData.isVerified !== oldData.isVerified) {
        needsReindexing = true; 
        if (newData.isVerified) {
          console.log(`[ProvidersTrigger] Provedor ${providerId} foi verificado!`);
          const userProfileSnap = await db.collection('users').doc(providerId).get();
          const userProfileData = userProfileSnap.data() as UserProfile;

          if (userProfileData?.fcmTokens && userProfileData.fcmTokens.length > 0) {
            const payload: NotificationPayload = {
              title: "Seu perfil foi verificado!",
              body: "Parabéns! Seu perfil LimpeJá foi verificado e agora está ativo para receber agendamentos.",
              data: {
                screen: "ProviderDashboard",
                notificationType: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
                status: "approved",
              }
            };
            await sendPushNotification(userProfileData.fcmTokens, payload, {
              saveToFirestore: true,
              userIdToSave: providerId,
              typeToSave: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
              navigateTo: "ProviderDashboard",
            });
            console.log(`[ProvidersTrigger] Notificação de verificação (atualização) enviada para ${providerId}`);
          }

          await db.collection('users').doc(providerId).update({
            isProviderVerified: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[ProvidersTrigger] UserProfile para ${providerId} atualizado para isProviderVerified: true.`);

          const providerAuthUser = await auth.getUser(providerId);
          if (providerAuthUser.email) {
            await emailService.sendEmail({
              to: providerAuthUser.email,
              subject: "Seu perfil LimpeJá foi Aprovado!",
              htmlBody: `<p>Olá ${newData.name || 'Provedor'},</p><p>Ótima notícia! Seu perfil no LimpeJá foi revisado e aprovado.</p><p>Agora você está totalmente visível na plataforma e pode começar a receber agendamentos de limpeza. Certifique-se de que sua disponibilidade e serviços estão atualizados.</p><p>Bem-vindo(a) oficialmente!</p><p>Atenciosamente,<br/>Equipe LimpeJá</p>`,
              textBody: `Olá ${newData.name || 'Provedor'},\n\nÓtima notícia! Seu perfil no LimpeJá foi revisado e aprovado.\n\nAgora você está totalmente visível na plataforma e pode começar a receber agendamentos de limpeza. Certifique-se de que sua disponibilidade e serviços estão atualizados.\n\nBem-vindo(a) oficialmente!\n\nAtenciosamente,\nEquipe LimpeJá`
            });
            console.log(`[ProvidersTrigger] Email de aprovação enviado para ${providerAuthUser.email}`);
          }
          await searchService.updateProviderStatusInIndex(providerId, true, newData.isDisabledByAdmin || false);

        } else { 
          console.log(`[ProvidersTrigger] Provedor ${providerId} teve o status de verificação alterado para FALSE (rejeitado/suspenso).`);
          const userProfileSnap = await db.collection('users').doc(providerId).get();
          const userProfileData = userProfileSnap.data() as UserProfile;

          if (userProfileData?.fcmTokens && userProfileData.fcmTokens.length > 0) {
            const payload: NotificationPayload = {
              title: "Atualização do seu perfil de provedor",
              body: `Seu status de verificação no LimpeJá foi alterado. Motivo: ${newData.notesOnVerification || 'Entre em contato com o suporte.'}`,
              data: {
                screen: "ProviderVerification",
                notificationType: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
                status: "rejected", 
                reason: newData.notesOnVerification || 'Desconhecido',
              }
            };
            await sendPushNotification(userProfileData.fcmTokens, payload, {
              saveToFirestore: true,
              userIdToSave: providerId,
              typeToSave: "PROVIDER_APPLICATION_UPDATE" as NotificationType,
              navigateTo: "ProviderVerification",
            });
            console.log(`[ProvidersTrigger] Notificação de desverificação enviada para ${providerId}`);
          }
          const providerAuthUser = await auth.getUser(providerId);
          if (providerAuthUser.email) {
            await emailService.sendEmail({
              to: providerAuthUser.email,
              subject: "Atualização Importante Sobre Seu Perfil LimpeJá",
              htmlBody: `<p>Olá ${newData.name || 'Provedor'},</p><p>Houve uma atualização no status de verificação do seu perfil na plataforma LimpeJá. Seu perfil não está mais verificado.</p><p><strong>Motivo:</strong> ${newData.notesOnVerification || 'Por favor, entre em contato com nosso suporte para mais detalhes.'}</p><p>Se você tiver dúvidas ou precisar de assistência, não hesite em nos contatar.</p><p>Atenciosamente,<br/>Equipe LimpeJá</p>`,
            });
          }

          await db.collection('users').doc(providerId).update({
            isProviderVerified: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[ProvidersTrigger] UserProfile para ${providerId} atualizado para isProviderVerified: false.`);
          await searchService.updateProviderStatusInIndex(providerId, false, newData.isDisabledByAdmin || false);
        }
      }

      if (newData.isDisabledByAdmin !== oldData.isDisabledByAdmin) {
        needsReindexing = true; 
        const providerAuthUser = await auth.getUser(providerId); 
        if (newData.isDisabledByAdmin) {
          console.log(`[ProvidersTrigger] Provedor ${providerId} foi desabilitado por um administrador.`);
          await auth.updateUser(providerId, { disabled: true });
          console.log(`[ProvidersTrigger] Conta de autenticação ${providerId} desativada por admin.`);

          const userProfileSnap = await db.collection('users').doc(providerId).get();
          const userProfileData = userProfileSnap.data() as UserProfile;

          if (userProfileData?.fcmTokens && userProfileData.fcmTokens.length > 0) {
            const payload: NotificationPayload = {
              title: "Sua conta foi desativada temporariamente",
              body: `Sua conta no LimpeJá foi desativada por um administrador. Motivo: ${newData.notesOnVerification || 'Entre em contato com o suporte para mais detalhes.'}`,
              data: {
                screen: "Support",
                notificationType: "ACCOUNT_ISSUE" as NotificationType,
                reason: newData.notesOnVerification || 'Desconhecido',
              }
            };
            await sendPushNotification(userProfileData.fcmTokens, payload, {
              saveToFirestore: true,
              userIdToSave: providerId,
              typeToSave: "ACCOUNT_ISSUE" as NotificationType,
              navigateTo: "Support",
            });
          }
           if (providerAuthUser.email) {
            await emailService.sendEmail({
              to: providerAuthUser.email,
              subject: "Sua Conta LimpeJá Foi Desativada por um Administrador",
              htmlBody: `<p>Olá ${newData.name || 'Provedor'},</p><p>Sua conta na plataforma LimpeJá foi desativada temporariamente por um de nossos administradores.</p><p><strong>Motivo:</strong> ${newData.notesOnVerification || 'Para mais informações, por favor, entre em contato com nosso suporte.'}</p><p>Durante este período, seu perfil não estará visível e você não poderá receber novos agendamentos. Para reativar sua conta ou entender melhor a situação, por favor, contate nosso suporte.</p><p>Atenciosamente,<br/>Equipe LimpeJá</p>`,
            });
          }

          await db.collection('users').doc(providerId).update({
            isDisabledByAdmin: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[ProvidersTrigger] UserProfile para ${providerId} atualizado para isDisabledByAdmin: true.`);
          await searchService.updateProviderStatusInIndex(providerId, newData.isVerified || false, true);

        } else { 
          console.log(`[ProvidersTrigger] Provedor ${providerId} foi reativado por um administrador.`);
          await auth.updateUser(providerId, { disabled: false });
          console.log(`[ProvidersTrigger] Conta de autenticação ${providerId} reativada por admin.`);

          const userProfileSnap = await db.collection('users').doc(providerId).get();
          const userProfileData = userProfileSnap.data() as UserProfile;

          if (userProfileData?.fcmTokens && userProfileData.fcmTokens.length > 0) {
            const payload: NotificationPayload = {
              title: "Sua conta foi reativada!",
              body: "Boas notícias! Sua conta no LimpeJá foi reativada por um administrador. Você já pode voltar a receber agendamentos.",
              data: {
                screen: "ProviderDashboard",
                notificationType: "ACCOUNT_ISSUE" as NotificationType,
              }
            };
            await sendPushNotification(userProfileData.fcmTokens, payload, {
              saveToFirestore: true,
              userIdToSave: providerId,
              typeToSave: "ACCOUNT_ISSUE" as NotificationType,
              navigateTo: "ProviderDashboard",
            });
          }
          if (providerAuthUser.email) {
            await emailService.sendEmail({
              to: providerAuthUser.email,
              subject: "Sua Conta LimpeJá Foi Reativada!",
              htmlBody: `<p>Olá ${newData.name || 'Provedor'},</p><p>Boas notícias! Sua conta na plataforma LimpeJá foi reativada por um de nossos administradores.</p><p>Seu perfil está novamente visível e você pode voltar a receber agendamentos. Verifique suas configurações e disponibilidade.</p><p>Atenciosamente,<br/>Equipe LimpeJá</p>`,
            });
          }

          await db.collection('users').doc(providerId).update({
            isDisabledByAdmin: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[ProvidersTrigger] UserProfile para ${providerId} atualizado para isDisabledByAdmin: false.`);
          await searchService.updateProviderStatusInIndex(providerId, newData.isVerified || false, false);
        }
      }

      const fieldsToCheckForReindex = ['name', 'bio', 'addresses', 'location', 'servicesOffered', 'serviceAreas', 'averageRating'];
      let significantChange = false;
      for (const field of fieldsToCheckForReindex) {
        if (JSON.stringify((newData as any)[field]) !== JSON.stringify((oldData as any)[field])) {
          significantChange = true;
          console.log(`[ProvidersTrigger] Change detected in field '${field}' for provider ${providerId}.`);
          break;
        }
      }

      if (significantChange && !needsReindexing) { 
        console.log(`[ProvidersTrigger] Dados de serviço/área do provedor ${providerId} atualizados. Reindexando...`);
        await searchService.indexProvider(providerId, newData);
      } else if (needsReindexing && !significantChange) {
         console.log(`[ProvidersTrigger] Status do provedor ${providerId} alterado. Confirmando reindexação completa se 'searchService.updateProviderStatusInIndex' foi minimalista...`);
         await searchService.indexProvider(providerId, newData); // Ensures all data is current in search index
      }
    }
    return null;
  });