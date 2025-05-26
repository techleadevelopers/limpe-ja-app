/**
 * Importa e re-exporta todas as Cloud Functions do projeto.
 */

// Configurações e Inicialização (importante ser o primeiro em alguns casos)
import "./config/firebaseAdmin"; // Garante que o Admin SDK seja inicializado

// --- AUTHENTICATION ---
import * as authTriggers from "./auth/triggers";
export const processNewUser = authTriggers.processNewUser;
export const cleanupUser = authTriggers.cleanupUser;
// import * as authHttp from "./auth/http";
// export const authApi = authHttp.authApi; // Se você criou a authApi

// --- USERS ---
import * as usersCallable from "./users/callable";
export const updateUserProfile = usersCallable.updateUserProfile;
export const addUserAddress = usersCallable.addUserAddress;
// import * as usersTriggers from "./users/triggers";
// export const onUserProfileUpdate = usersTriggers.onUserProfileUpdate;

// --- PROVIDERS ---
import * as providersCallable from "./providers/callable";
export const submitProviderRegistration = providersCallable.submitProviderRegistration;
export const updateOfferedServices = providersCallable.updateOfferedServices;
export const updateWeeklyAvailability = providersCallable.updateWeeklyAvailability;
export const updateBlockedDates = providersCallable.updateBlockedDates;
import * as providersTriggers from "./providers/triggers";
export const onProviderProfileWrite = providersTriggers.onProviderProfileWrite;

// --- BOOKINGS ---
import * as bookingsApiFunctions from "./bookings/http";
export const bookingsApi = bookingsApiFunctions.bookingsApi; // Endpoint Express
import * as bookingsCallableFunctions from "./bookings/callable";
export const updateBookingStatus = bookingsCallableFunctions.updateBookingStatus;
import * as bookingsTriggersFunctions from "./bookings/triggers";
export const onBookingCreatedSendNotifications = bookingsTriggersFunctions.onBookingCreatedSendNotifications;
export const onBookingUpdateSendNotifications = bookingsTriggersFunctions.onBookingUpdateSendNotifications;

// --- PAYMENTS ---
import * as paymentsApiFunctions from "./payments/http";
export const paymentsApi = paymentsApiFunctions.paymentsApi; // Já estava aqui
import * as paymentsTriggersFunctions from "./payments/triggers";
export const onBookingFinalizedProcessPayment = paymentsTriggersFunctions.onBookingFinalizedProcessPayment; // Já estava aqui
import * as paymentsCallableFunctions from "./payments/callable"; // <<<--- ADICIONADO IMPORT PARA PAYMENTS CALLABLE
export const requestProviderPayout = paymentsCallableFunctions.requestProviderPayout;   // <<<--- ADICIONADO
export const getMyPaymentHistory = paymentsCallableFunctions.getMyPaymentHistory;     // <<<--- ADICIONADO
export const retryBookingPayment = paymentsCallableFunctions.retryBookingPayment;     // <<<--- ADICIONADO


// --- REVIEWS ---
import * as reviewsCallableFunctions from "./reviews/callable";
export const submitReview = reviewsCallableFunctions.submitReview;
import * as reviewsTriggersFunctions from "./reviews/triggers";
export const onReviewCreatedUpdateProviderRating = reviewsTriggersFunctions.onReviewCreatedUpdateProviderRating;

// --- NOTIFICATIONS ---
import * as notificationsCallableFunctions from "./notifications/callable";
export const markNotificationsAsRead = notificationsCallableFunctions.markNotificationsAsRead;
export const getNotificationsHistory = notificationsCallableFunctions.getNotificationsHistory;
// import * as notificationsTriggers from "./notifications/triggers";
// export const sendScheduledReminders = notificationsTriggers.sendScheduledReminders;
// export const onNewReviewForProvider = notificationsTriggers.onNewReviewForProvider; // Já tínhamos exportado este
// export const sendBookingReminderMaybe = notificationsTriggers.sendBookingReminderMaybe; // Já tínhamos exportado este


// --- CHAT ---
import * as chatTriggers from "./chat/triggers";
export const onNewChatMessage = chatTriggers.onNewChatMessage;

// --- ADMIN ---
import * as adminCallableFunctions from "./admin/callable";
export const setProviderVerificationStatus = adminCallableFunctions.setProviderVerificationStatus;
export const setUserDisabledStatus = adminCallableFunctions.setUserDisabledStatus;
export const getPlatformAnalytics = adminCallableFunctions.getPlatformAnalytics;

// Exemplo de HTTP function simples para teste (pode ser mantida ou removida)
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
const REGION = "southamerica-east1"; // Certifique-se de que REGION esteja definido aqui ou importado
export const helloLimpeJaBackend = region(REGION).https.onRequest((request, response) => {
  functions.logger.info("Hello LimpeJa Backend logs!", { structuredData: true });
  response.send("API do LimpeJá está no ar via Firebase Cloud Functions!");
});