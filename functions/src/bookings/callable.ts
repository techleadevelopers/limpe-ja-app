// LimpeJaApp/functions/src/bookings/callable.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import admin, { db } from "../config/firebaseAdmin";
import { BookingStatus, Booking, UserRole } from "../types"; // Assegure-se que BookingStatus e Booking estão atualizados em ../types/booking.types.ts
// Certifique-se de que assertRole e assertAuthenticated são exportados de ../utils/helpers
import { assertRole, assertAuthenticated } from "../utils/helpers";

const REGION = "southamerica-east1";

// ==========================================================
// IMPORTANTE: Adicione esta interface ao seu arquivo
// LimpeJaApp/functions/src/types/booking.types.ts (ou index.ts)
// para que o TypeScript a reconheça.
// ==========================================================
// export interface RescheduleRequest {
//   bookingId: string;
//   proposedDateTime: admin.firestore.Timestamp;
//   reason: string;
//   status: "pending" | "accepted" | "rejected";
//   requestedBy: UserRole;
//   requestedById: string;
//   createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
//   updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
// }
// ==========================================================

interface UpdateBookingStatusData {
    bookingId: string;
    newStatus: BookingStatus;
    cancellationReason?: string;
}

interface RequestBookingRescheduleData {
    bookingId: string;
    newProposedDateTime: string; // ISO 8601 string
    reason: string;
}

interface AcceptBookingRescheduleData {
    bookingId: string;
}

export const updateBookingStatus = region(REGION).https.onCall(
    async (data: UpdateBookingStatusData, context) => {
        // 1. Autenticação e Autorização Inicial
        // A função assertAuthenticated já faz a checagem e lança o erro se não autenticado.
        assertAuthenticated(context);
        // Após esta linha, TypeScript SABE que context.auth não é undefined
        // e tem uid e token.
        const uid = context.auth!.uid; // Adicionado '!' para afirmar que context.auth não é nulo
        const userRole = context.auth!.token.role as UserRole; // Adicionado '!'

        const { bookingId, newStatus, cancellationReason } = data;

        // 2. Validação de Argumentos
        if (!bookingId || !newStatus) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "bookingId e newStatus são obrigatórios."
            );
        }

        console.log(
            `[BookingsCallable] Usuário ${uid} (role: ${userRole}) tentando atualizar status do booking ${bookingId} para ${newStatus}`
        );

        const bookingRef = db.collection("bookings").doc(bookingId);

        try {
            await db.runTransaction(async (transaction) => {
                const bookingDoc = await transaction.get(bookingRef);
                if (!bookingDoc.exists) {
                    throw new functions.https.HttpsError(
                        "not-found",
                        "Agendamento não encontrado."
                    );
                }
                const booking = bookingDoc.data() as Booking;

                // 3. Verificação de Permissões e Lógica de Transição de Status
                let canUpdate = false;
                const currentStatus = booking.status; // Captura o status atual para clareza

                if (userRole === "provider" && uid === booking.providerId) {
                    // Aqui, o 'context.auth' já foi validado pela assertAuthenticated
                    // Podemos passar 'context.auth' diretamente, pois sabemos que não é undefined.
                    assertRole(context.auth!, "provider"); // Corrigido aqui com '!'
                    switch (newStatus) {
                        case "confirmed_by_provider":
                            canUpdate = currentStatus === "pending_provider_confirmation";
                            break;
                        case "cancelled_by_provider":
                            canUpdate = ["pending_provider_confirmation", "confirmed_by_provider", "scheduled_paid", "reschedule_requested"].includes(currentStatus);
                            break;
                        case "in_progress":
                            canUpdate = currentStatus === "scheduled_paid";
                            break;
                        case "completed":
                            canUpdate = currentStatus === "in_progress";
                            break;
                        default:
                            canUpdate = false; // Status não permitido para provedor via esta função
                    }
                } else if (userRole === "client" && uid === booking.clientId) {
                    // Mesma correção aqui para 'context.auth'
                    assertRole(context.auth!, "client"); // Corrigido aqui com '!'
                    switch (newStatus) {
                        case "cancelled_by_client":
                            canUpdate = ["pending_provider_confirmation", "confirmed_by_provider", "scheduled_paid", "reschedule_requested"].includes(currentStatus);
                            break;
                        default:
                            canUpdate = false; // Status não permitido para cliente via esta função
                    }
                } else {
                    // Se não for o cliente ou o provedor do agendamento, não tem permissão
                    throw new functions.https.HttpsError(
                        "permission-denied",
                        "Você não tem permissão para alterar este agendamento."
                    );
                }

                if (!canUpdate) {
                    console.warn(
                        `[BookingsCallable] Tentativa de atualização de status não permitida: User ${uid} (Role: ${userRole}), Booking ${bookingId}, De ${currentStatus} Para ${newStatus}`
                    );
                    throw new functions.https.HttpsError(
                        "permission-denied",
                        `Você não tem permissão para alterar o status deste agendamento de '${currentStatus}' para '${newStatus}'.`
                    );
                }

                // 4. Construção dos Dados de Atualização
                const updateData: Partial<Booking> = {
                    status: newStatus,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                if (
                    cancellationReason &&
                    (newStatus === "cancelled_by_client" ||
                        newStatus === "cancelled_by_provider")
                ) {
                    updateData.cancellationReason = cancellationReason;
                    updateData.cancelledBy = userRole;
                }

                // Se a mudança for para um status de cancelamento, o rescheduleRequestId é limpo.
                if (["cancelled_by_client", "cancelled_by_provider"].includes(newStatus)) {
                    // Usa delete() para remover o campo do documento no Firestore
                    updateData.rescheduleRequestId = admin.firestore.FieldValue.delete();
                }

                transaction.update(bookingRef, updateData);
            });

            console.log(
                `[BookingsCallable] Status do agendamento ${bookingId} atualizado para ${newStatus} por ${uid}.`
            );
            return {
                success: true,
                message: `Agendamento ${newStatus.replace(/_/g, " ").toLowerCase()}.`,
            };
        } catch (error: any) {
            console.error(
                `[BookingsCallable] Erro ao atualizar status do agendamento ${bookingId} para ${uid}:`,
                error
            );
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError(
                "internal",
                "Falha ao atualizar o status do agendamento.",
                error.message
            );
        }
    }
);

// Callable function para solicitar o reagendamento de um agendamento.
export const requestBookingReschedule = region(REGION).https.onCall(
    async (data: RequestBookingRescheduleData, context) => {
        // 1. Autenticação e Autorização Inicial
        assertAuthenticated(context); // Valida a autenticação
        const uid = context.auth!.uid; // Adicionado '!'
        const userRole = context.auth!.token.role as UserRole; // Adicionado '!'

        const { bookingId, newProposedDateTime, reason } = data;

        // 2. Validação de Argumentos
        if (!bookingId || !newProposedDateTime || !reason) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "bookingId, newProposedDateTime e reason são obrigatórios."
            );
        }

        const proposedDateTime = new Date(newProposedDateTime);
        if (isNaN(proposedDateTime.getTime())) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "newProposedDateTime é inválido. Deve ser uma string ISO 8601 válida."
            );
        }

        console.log(
            `[BookingsCallable] Usuário ${uid} (role: ${userRole}) solicitando reagendamento do booking ${bookingId} para ${newProposedDateTime}.`
        );

        const bookingRef = db.collection("bookings").doc(bookingId);

        try {
            await db.runTransaction(async (transaction) => {
                const bookingDoc = await transaction.get(bookingRef);
                if (!bookingDoc.exists) {
                    throw new functions.https.HttpsError(
                        "not-found",
                        "Agendamento não encontrado."
                    );
                }
                const booking = bookingDoc.data() as Booking;

                // 3. Verificação de Permissões
                // Apenas cliente ou prestador podem solicitar o reagendamento, e apenas para seus próprios agendamentos
                if (
                    (userRole === "client" && uid !== booking.clientId) ||
                    (userRole === "provider" && uid !== booking.providerId)
                ) {
                    throw new functions.https.HttpsError(
                        "permission-denied",
                        "Você não tem permissão para solicitar o reagendamento deste agendamento."
                    );
                }

                // 4. Verificação de Pré-condição de Status
                // Só pode solicitar reagendamento se o status permitir (ex: não cancelado, não finalizado)
                const allowedStatuses: BookingStatus[] = [
                    "pending_provider_confirmation",
                    "confirmed_by_provider",
                    "scheduled_paid",
                    "in_progress",
                ];
                if (!allowedStatuses.includes(booking.status)) {
                    throw new functions.https.HttpsError(
                        "failed-precondition",
                        `O agendamento não pode ser reagendado no status atual: ${booking.status}.`
                    );
                }

                // 5. Criar um novo documento de solicitação de reagendamento
                const rescheduleRequestRef = db
                    .collection("rescheduleRequests")
                    .doc();
                const rescheduleRequest = {
                    bookingId: bookingId,
                    proposedDateTime: admin.firestore.Timestamp.fromDate(proposedDateTime),
                    reason: reason,
                    status: "pending", // pending, accepted, rejected
                    requestedBy: userRole,
                    requestedById: uid,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                transaction.set(rescheduleRequestRef, rescheduleRequest);

                // 6. Atualizar o agendamento com o status 'reschedule_requested'
                // e guardar o ID da solicitação de reagendamento.
                const updateData: Partial<Booking> = {
                    status: "reschedule_requested",
                    rescheduleRequestId: rescheduleRequestRef.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                transaction.update(bookingRef, updateData);
            });

            console.log(
                `[BookingsCallable] Usuário ${uid} solicitou reagendamento do booking ${bookingId} para ${newProposedDateTime}.`
            );
            return {
                success: true,
                message:
                    "Solicitação de reagendamento enviada com sucesso. Aguardando aprovação.",
            };
        } catch (error: any) {
            console.error(
                `[BookingsCallable] Erro ao solicitar reagendamento do booking ${bookingId}:`,
                error
            );
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError(
                "internal",
                "Falha ao solicitar o reagendamento.",
                error.message
            );
        }
    }
);

// Callable function para aceitar um reagendamento (apenas pelo prestador).
export const acceptBookingReschedule = region(REGION).https.onCall(
    async (data: AcceptBookingRescheduleData, context) => {
        // 1. Autenticação e Autorização Inicial
        assertAuthenticated(context); // Valida a autenticação
        const uid = context.auth!.uid; // Adicionado '!'
        const userRole = context.auth!.token.role as UserRole; // Adicionado '!'

        const { bookingId } = data;

        // 2. Validação de Argumentos
        if (!bookingId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "bookingId é obrigatório."
            );
        }

        console.log(
            `[BookingsCallable] Prestador ${uid} aceitando reagendamento do booking ${bookingId}.`
        );

        const bookingRef = db.collection("bookings").doc(bookingId);

        try {
            await db.runTransaction(async (transaction) => {
                const bookingDoc = await transaction.get(bookingRef);
                if (!bookingDoc.exists) {
                    throw new functions.https.HttpsError(
                        "not-found",
                        "Agendamento não encontrado."
                    );
                }
                const booking = bookingDoc.data() as Booking;

                // 3. Verificação de Permissões
                // Apenas o prestador pode aceitar o reagendamento
                if (userRole !== "provider" || uid !== booking.providerId) {
                    throw new functions.https.HttpsError(
                        "permission-denied",
                        "Apenas o prestador pode aceitar o reagendamento."
                    );
                }

                // 4. Verificar se há uma solicitação de reagendamento pendente
                // E AGORA VERIFICA SE rescheduleRequestId É UMA STRING VÁLIDA
                if (
                    booking.status !== "reschedule_requested" ||
                    typeof booking.rescheduleRequestId !== 'string' || // ADIÇÃO AQUI: Garante que é uma string
                    !booking.rescheduleRequestId // Garante que não é undefined/null ou string vazia
                ) {
                    throw new functions.https.HttpsError(
                        "failed-precondition",
                        "Não há solicitação de reagendamento pendente para este agendamento ou o ID é inválido."
                    );
                }

                // Agora é seguro usar booking.rescheduleRequestId porque sabemos que é uma string
                const rescheduleRequestRef = db
                    .collection("rescheduleRequests")
                    .doc(booking.rescheduleRequestId); // LINHA ONDE ESTAVA O ERRO - AGORA CORRIGIDO PELA VERIFICAÇÃO ACIMA
                const rescheduleRequestDoc = await transaction.get(rescheduleRequestRef);
                if (!rescheduleRequestDoc.exists) {
                    // Possível race condition. A solicitação pode ter sido cancelada ou deletada.
                    throw new functions.https.HttpsError(
                        "not-found",
                        "Solicitação de reagendamento não encontrada ou já processada."
                    );
                }
                // É seguro usar o '!' aqui porque verificamos .exists
                const rescheduleRequestData = rescheduleRequestDoc.data()!;

                // 5. Atualizar o agendamento com a nova data/hora e status
                const updateData: Partial<Booking> = {
                    scheduledDateTime: rescheduleRequestData.proposedDateTime,
                    status: "scheduled_paid", // Define para um status apropriado após o reagendamento
                    rescheduleRequestId: admin.firestore.FieldValue.delete(), // CORREÇÃO AQUI: Usa delete() para remover o campo
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                transaction.update(bookingRef, updateData);

                // 6. Atualizar a solicitação de reagendamento para 'accepted'
                transaction.update(rescheduleRequestRef, {
                    status: "accepted",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });

            console.log(
                `[BookingsCallable] Prestador ${uid} aceitou o reagendamento do booking ${bookingId}.`
            );
            return {
                success: true,
                message: "Reagendamento aceito com sucesso.",
            };
        } catch (error: any) {
            console.error(
                `[BookingsCallable] Erro ao aceitar reagendamento do booking ${bookingId}:`,
                error
            );
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError(
                "internal",
                "Falha ao aceitar o reagendamento.",
                error.message
            );
        }
    }
);