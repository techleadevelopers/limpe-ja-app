// LimpeJaApp/functions/src/bookings/http.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import express from "express";
import cors from "cors";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
// CORREÇÃO: Importações separadas e ServiceOffering renomeado para OfferedService
import { Booking, BookingRequestData, BookingStatus } from "../types/booking.types";
import { UserRole } from "../types/user.types"; // Assumindo UserRole está em user.types
import { OfferedService } from "../types/provider.types"; // CORREÇÃO: ServiceOffering é na verdade OfferedService
import { assertRole } from "../utils/helpers";

const REGION = "southamerica-east1";
const app = express();
app.use(cors({ origin: true }));

// Middleware para verificar token de autenticação
const authenticate = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    console.warn("[BookingsHTTP] Token não fornecido ou mal formatado");
    res.status(403).send("Unauthorized");
    return;
  }
  const idToken = req.headers.authorization.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decodedToken; // Para tipagem melhor, defina uma interface que estenda express.Request
    next();
  } catch (error) {
    console.error("[BookingsHTTP] Erro ao verificar token:", error);
    res.status(403).send("Unauthorized");
  }
};

// Criar um novo agendamento (CLIENTE)
app.post("/", authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const authenticatedUser = (req as any).user;
    const userId = authenticatedUser.uid;
    assertRole(authenticatedUser, "client");

    const bookingData = req.body as BookingRequestData;

    // **VALIDAÇÃO DE DADOS REAL**
    const { providerId, preferredDate, preferredTimeSlot, serviceOfferingId, customServiceDescription, address, clientNotes } = bookingData;

    // 1. Validação de campos obrigatórios
    if (!providerId || !preferredDate || !address) {
      return res.status(400).send({ error: "Campos obrigatórios ausentes: providerId, preferredDate, address." });
    }

    // 2. Validação de serviceOfferingId OU customServiceDescription (não ambos)
    if (!serviceOfferingId && !customServiceDescription) {
      return res.status(400).send({ error: "É necessário fornecer serviceOfferingId ou customServiceDescription." });
    }
    if (serviceOfferingId && customServiceDescription) {
      return res.status(400).send({ error: "Não é possível fornecer serviceOfferingId e customServiceDescription simultaneamente." });
    }

    // 3. Validação da data e hora
    const combinedDateTimeString = `${preferredDate}T${preferredTimeSlot || "09:00"}:00`;
    const scheduledDateTime = new Date(combinedDateTimeString);
    if (isNaN(scheduledDateTime.getTime())) {
      return res.status(400).send({ error: "Data ou hora preferida inválida. Use o formato YYYY-MM-DD e HH:MM." });
    }
    if (scheduledDateTime < new Date()) {
        return res.status(400).send({ error: "A data e hora do agendamento deve ser no futuro." });
    }

    // 4. Buscar informações do serviço (se serviceOfferingId for fornecido)
    let serviceSnapshot: Booking['serviceSnapshot'];
    if (serviceOfferingId) {
        const serviceDoc = await db.collection("serviceOfferings").doc(serviceOfferingId).get();
        if (!serviceDoc.exists) {
            return res.status(404).send({ error: "Serviço oferecido não encontrado." });
        }
        const service = serviceDoc.data() as OfferedService; // CORREÇÃO: Usar OfferedService
        
        // **Lógica importante para garantir que o serviço pertence ao provedor selecionado**
        // Isso é crucial para evitar que um cliente agende um serviço de um provedor diferente
        if (service.providerId && service.providerId !== providerId) {
          return res.status(400).send({ error: "O serviço selecionado não pertence ao prestador especificado." });
        }

        serviceSnapshot = {
            serviceId: service.id, // CORREÇÃO: 'id' para 'serviceId'
            name: service.name,
            description: service.description || '', // Pode ser opcional no OfferedService
            priceValueAtBooking: service.price, // CORREÇÃO: 'price' para 'priceValueAtBooking'
            priceType: service.priceType,
            currency: service.currency,
        };
    } else {
        // Se for um serviço customizado (orçamento), o preço e tipo serão definidos depois
        serviceSnapshot = {
            name: customServiceDescription || "Serviço a ser definido",
            priceType: "quote", // Para serviços customizados, o preço é um orçamento
            currency: "BRL", // Moeda padrão para orçamento
        };
    }

    const newBookingRef = db.collection("bookings").doc();
    const bookingId = newBookingRef.id;
    const clientNameFromToken = authenticatedUser.name || authenticatedUser.email?.split('@')[0] || "Cliente LimpeJá";

    const newBooking: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      bookingId: bookingId,
      clientId: userId,
      clientName: clientNameFromToken,
      providerId: providerId,
      serviceSnapshot: serviceSnapshot, // Já populado acima
      scheduledDateTime: admin.firestore.Timestamp.fromDate(scheduledDateTime),
      address: address,
      clientNotes: clientNotes || "", // Garante que é uma string vazia se não fornecido
      status: "pending_provider_confirmation" as BookingStatus,
      paymentStatus: "pending_payment", // Novo campo para rastrear o status do pagamento
      totalPrice: serviceSnapshot.priceValueAtBooking || 0, // CORREÇÃO: 'price' para 'priceValueAtBooking'
      commissionValue: 0, // Será calculado e atualizado após confirmação do pagamento
      providerEarnings: 0, // Será calculado e atualizado após confirmação do pagamento
      // Estes serão Timestamps do servidor
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await newBookingRef.set(newBooking);
    console.log(`[BookingsHTTP] Novo agendamento ${bookingId} criado para cliente ${userId}`);
    
    return res.status(201).send({ bookingId: newBookingRef.id, message: "Agendamento solicitado com sucesso." });

  } catch (error: any) {
    console.error("[BookingsHTTP] Erro ao criar agendamento:", error);
    if (error instanceof functions.https.HttpsError) {
      return res.status(error.httpErrorCode.canonicalName === "UNAUTHENTICATED" ? 401 : 403).send({ error: error.message });
    }
    // Erros específicos de validação podem ser tratados aqui também
    if (error.message.includes("Inválido") || error.message.includes("obrigatório")) {
      return res.status(400).send({ error: error.message });
    }
    return res.status(500).send({ error: "Falha ao criar agendamento.", details: error.message });
  }
});

// Listar agendamentos do CLIENTE (exemplo básico)
app.get("/client", authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user.uid;
    assertRole((req as any).user, "client");
    const querySnapshot = await db.collection("bookings").where("clientId", "==", userId).orderBy("scheduledDateTime", "desc").get();
    const clientBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    return res.status(200).send(clientBookings);
  } catch (error: any) {
    console.error("[BookingsHTTP] Erro ao listar agendamentos do cliente:", error);
    if (error instanceof functions.https.HttpsError) {   return res.status(403).send({ error: error.message}); }
    return res.status(500).send({ error: "Falha ao listar agendamentos."});
  }
});

// Listar agendamentos do PRESTADOR (exemplo básico)
app.get("/provider", authenticate, async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.uid;
      assertRole((req as any).user, "provider");
      const querySnapshot = await db.collection("bookings").where("providerId", "==", userId).orderBy("scheduledDateTime", "desc").get();
      const providerBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      return res.status(200).send(providerBookings);
    } catch (error: any) {
      console.error("[BookingsHTTP] Erro ao listar agendamentos do provedor:", error);
      if (error instanceof functions.https.HttpsError) { return res.status(403).send({ error: error.message});}
      return res.status(500).send({ error: "Falha ao listar agendamentos."});
    }
});

// Obter detalhes de UM agendamento
app.get("/:bookingId", authenticate, async (req: express.Request, res: express.Response) => {
    try {
      const bookingId = req.params.bookingId;
      const userId = (req as any).user.uid;
      const userRole = (req as any).user.token.role as UserRole;

      const bookingDoc = await db.collection("bookings").doc(bookingId).get();
      if (!bookingDoc.exists) {
          return res.status(404).send({ error: "Agendamento não encontrado." });
      }
      const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

      if (booking.clientId !== userId && booking.providerId !== userId && userRole !== "admin") { // Admin pode ver qualquer um
            return res.status(403).send({ error: "Você não tem permissão para ver este agendamento." });
      }
      return res.status(200).send(booking);
    } catch (error: any) { 
      console.error(`[BookingsHTTP] Erro ao buscar detalhes do booking ${req.params.bookingId}:`, error);
      return res.status(500).send({ error: "Falha ao buscar detalhes do agendamento."});
    }
});

// Atualizar status de um agendamento
app.patch("/:bookingId/status", authenticate, async (req: express.Request, res: express.Response) => {
    try {
      const bookingId = req.params.bookingId;
      const { newStatus, cancellationReason } = req.body as { newStatus: BookingStatus, cancellationReason?: string };
      const userId = (req as any).user.uid;
      const userRole = (req as any).user.token.role as UserRole;

      if (!newStatus) {
          return res.status(400).send({ error: "newStatus é obrigatório." });
      }

      const bookingRef = db.collection("bookings").doc(bookingId);
      
      // Início da lógica de validação de permissão e transição de status,
      // similar à Callable Function updateBookingStatus.
      const bookingDoc = await bookingRef.get();
      if (!bookingDoc.exists) {
          return res.status(404).send({ error: "Agendamento não encontrado." });
      }
      const currentBooking = bookingDoc.data() as Booking;

      let canUpdate = false;
      const currentStatus = currentBooking.status;

      // Verificação de permissões e transições de status
      if (userRole === "provider" && userId === currentBooking.providerId) {
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
                  canUpdate = false;
          }
      } else if (userRole === "client" && userId === currentBooking.clientId) {
          switch (newStatus) {
              case "cancelled_by_client":
                  canUpdate = ["pending_provider_confirmation", "confirmed_by_provider", "scheduled_paid", "reschedule_requested"].includes(currentStatus);
                  break;
              default:
                  canUpdate = false;
          }
      } else if (userRole === "admin") { // Admins podem realizar qualquer transição (se necessário)
          canUpdate = true; // Ou lógica mais granular para admins
      } else {
          return res.status(403).send({ error: "Você não tem permissão para alterar este agendamento." });
      }

      if (!canUpdate) {
          console.warn(
              `[BookingsHTTP] Tentativa de atualização de status não permitida: User ${userId} (Role: ${userRole}), Booking ${bookingId}, De ${currentStatus} Para ${newStatus}`
          );
          return res.status(403).send({ error: `Você não tem permissão para alterar o status deste agendamento de '${currentStatus}' para '${newStatus}'.` });
      }
      // Fim da lógica de validação.

      console.log(`[BookingsHTTP] Usuário ${userId} (role: ${userRole}) atualizando status do booking ${bookingId} para ${newStatus}. Razão: ${cancellationReason || 'N/A'}`);

      const updatePayload: Partial<Booking> = { // Tipagem para clareza
          status: newStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Adiciona cancellationReason e cancelledBy se for um cancelamento e o motivo for fornecido
      if ((newStatus === "cancelled_by_client" || newStatus === "cancelled_by_provider") && cancellationReason) {
          updatePayload.cancellationReason = cancellationReason;
          updatePayload.cancelledBy = userRole; 
      }

      // Se a mudança for para um status de cancelamento, o rescheduleRequestId é limpo.
      if (["cancelled_by_client", "cancelled_by_provider"].includes(newStatus)) {
          updatePayload.rescheduleRequestId = admin.firestore.FieldValue.delete();
      }

      await bookingRef.update(updatePayload);

      return res.status(200).send({ message: `Status do agendamento atualizado para ${newStatus}.` });
    } catch (error: any) {
      console.error(`[BookingsHTTP] Erro ao atualizar status do booking ${req.params.bookingId}:`, error);
      if (error instanceof functions.https.HttpsError) { return res.status(error.httpErrorCode.canonicalName === "UNAUTHENTICATED" ? 401 : 403).send({error: error.message});}
      return res.status(500).send({ error: "Falha ao atualizar status."});
    }
});


export const bookingsApi = region(REGION).https.onRequest(app);