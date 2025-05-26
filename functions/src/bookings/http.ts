// LimpeJaApp/functions/src/bookings/http.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import express from "express";
import cors from "cors";
import admin, { db, auth as adminAuth } from "../config/firebaseAdmin";
import { Booking, BookingRequestData, BookingStatus, UserRole } from "../types"; // BookingStatus e UserRole são usados
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
    // TODO: Validar os dados de bookingData com Zod/Joi ou similar

    if (!bookingData.providerId || !bookingData.preferredDate || (!bookingData.serviceOfferingId && !bookingData.customServiceDescription)) {
        return res.status(400).send({ error: "Dados insuficientes para criar agendamento." });
    }

    const newBookingRef = db.collection("bookings").doc();
    const bookingId = newBookingRef.id;
    const clientNameFromToken = authenticatedUser.name || authenticatedUser.email?.split('@')[0] || "Cliente LimpeJá";

    const newBooking: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = { // Ajuste para FieldValue
      bookingId: bookingId,
      clientId: userId,
      clientName: clientNameFromToken,
      providerId: bookingData.providerId,
      serviceSnapshot: {
        name: bookingData.customServiceDescription || "Serviço a ser definido",
        priceType: "quote", 
        currency: "BRL",
      },
      scheduledDateTime: admin.firestore.Timestamp.fromDate(
        new Date(`${bookingData.preferredDate}T${bookingData.preferredTimeSlot || "09:00"}:00`)
      ),
      address: bookingData.address,
      clientNotes: bookingData.clientNotes,
      status: "pending_provider_confirmation" as BookingStatus,
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
    if (error instanceof functions.https.HttpsError) {  return res.status(403).send({ error: error.message}); }
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
        // Agora desestruturamos cancellationReason e o usamos
        const { newStatus, cancellationReason } = req.body as { newStatus: BookingStatus, cancellationReason?: string };
        const userId = (req as any).user.uid;
        const userRole = (req as any).user.token.role as UserRole;

        if (!newStatus) {
            return res.status(400).send({ error: "newStatus é obrigatório." });
        }

        const bookingRef = db.collection("bookings").doc(bookingId);
        
        // TODO: Adicionar lógica de validação de permissão e transição de status aqui,
        // similar à Callable Function updateBookingStatus.
        // Por exemplo: verificar se o booking existe, se o usuário logado é o cliente ou o provedor
        // do agendamento, e se a mudança de status é permitida.
        // Ex:
        // const bookingDoc = await bookingRef.get();
        // if (!bookingDoc.exists) throw new functions.https.HttpsError("not-found", "Agendamento não encontrado.");
        // const currentBooking = bookingDoc.data() as Booking;
        // if (userRole === 'client' && currentBooking.clientId !== userId) throw new functions.https.HttpsError("permission-denied", "Não autorizado.");
        // if (userRole === 'provider' && currentBooking.providerId !== userId) throw new functions.https.HttpsError("permission-denied", "Não autorizado.");
        // ... mais validações de transição de status ...

        console.log(`[BookingsHTTP] Usuário ${userId} (role: ${userRole}) atualizando status do booking ${bookingId} para ${newStatus}. Razão: ${cancellationReason || 'N/A'}`);

        const updatePayload: Partial<Booking> = { // Tipagem para clareza
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Adiciona cancellationReason e cancelledBy se for um cancelamento e o motivo for fornecido
        if ((newStatus === "cancelled_by_client" || newStatus === "cancelled_by_provider") && cancellationReason) {
            updatePayload.cancellationReason = cancellationReason;
            updatePayload.cancelledBy = userRole; // Assegure que UserRole permite 'client' e 'provider'
        }
        // Assegure que o tipo Booking em types/booking.types.ts tenha:
        // cancellationReason?: string;
        // cancelledBy?: UserRole; (ou 'client' | 'provider' | 'admin')

        await bookingRef.update(updatePayload);

        return res.status(200).send({ message: `Status do agendamento atualizado para ${newStatus}.` });
    } catch (error: any) {
        console.error(`[BookingsHTTP] Erro ao atualizar status do booking ${req.params.bookingId}:`, error);
        if (error instanceof functions.https.HttpsError) { return res.status(error.httpErrorCode.canonicalName === "UNAUTHENTICATED" ? 401 : 403).send({error: error.message});}
        return res.status(500).send({ error: "Falha ao atualizar status."});
    }
});


export const bookingsApi = region(REGION).https.onRequest(app);