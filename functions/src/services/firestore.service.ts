// LimpeJaApp/functions/src/services/firestore.service.ts

import * as admin from "firebase-admin";
import { db } from "../config/firebaseAdmin"; // Your existing db import
import {
  UserProfile,
  ProviderProfile,
  Booking,
  Review,
  StoredNotification,
  OfferedService, // Assuming this is the type for individual services providers offer
  ChatMessage,
  ChatRoom,
  // Import other necessary types from ../types
  BookingStatus,
  PaymentStatus,
  UserRole,
} from "../types"; // Make sure all used types are exported from ../types/index.ts

// --- Collection References ---
export const usersCollection = db.collection("users");
export const providerProfilesCollection = db.collection("providerProfiles");
export const servicesCollection = db.collection("services"); // Collection for OfferedService documents
export const bookingsCollection = db.collection("bookings");
export const reviewsCollection = db.collection("reviews");
export const userNotificationsCollection = db.collection("userNotifications");
export const chatRoomsCollection = db.collection("chatRooms");
// For messages as a subcollection of chatRooms:
// const getChatMessagesCollection = (chatId: string) => chatRoomsCollection.doc(chatId).collection("messages");


// --- Generic CRUD Helpers ---

/**
 * Creates a new document in the specified collection.
 * @param collectionRef Firestore collection reference.
 * @param data Data to be saved.
 * @param id Optional specific ID for the new document.
 * @returns The ID of the newly created document.
 */
export const createDocument = async <T>(
  collectionRef: admin.firestore.CollectionReference<T>,
  data: T,
  id?: string
): Promise<string> => {
  try {
    const docData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as T & { createdAt: any; updatedAt: any }; // Ensure Timestamps

    let docRef: admin.firestore.DocumentReference<T>;
    if (id) {
      docRef = collectionRef.doc(id);
      await docRef.set(docData);
    } else {
      docRef = await collectionRef.add(docData);
    }
    return docRef.id;
  } catch (error) {
    console.error(`[FirestoreService] Error creating document in ${collectionRef.path}:`, error);
    throw error;
  }
};

/**
 * Updates an existing document.
 * @param docRef Firestore document reference.
 * @param data Partial data to update.
 */
export const updateDocument = async <T>(
  docRef: admin.firestore.DocumentReference<T>,
  data: Partial<T>
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as Partial<T> & { updatedAt: any };
    await docRef.update(updateData);
  } catch (error) {
    console.error(`[FirestoreService] Error updating document ${docRef.path}:`, error);
    throw error;
  }
};

/**
 * Deletes a document.
 * @param docRef Firestore document reference.
 */
export const deleteDocument = async <T>(
  docRef: admin.firestore.DocumentReference<T>
): Promise<void> => {
  try {
    await docRef.delete();
  } catch (error) {
    console.error(`[FirestoreService] Error deleting document ${docRef.path}:`, error);
    throw error;
  }
};

/**
 * Fetches a document by its reference.
 * @param docRef Firestore document reference.
 * @returns The document data or null if not found.
 */
export const getDocument = async <T extends { id: string }>( // Assume T has an id property
  docRef: admin.firestore.DocumentReference<Omit<T, 'id'>> // Firestore stores data without the id in the doc itself
): Promise<T | null> => {
  try {
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return null;
    }
    // Combine document ID with its data
    return { id: docSnap.id, ...docSnap.data() } as T;
  } catch (error) {
    console.error(`[FirestoreService] Error fetching document ${docRef.path}:`, error);
    throw error;
  }
};


// --- User and Provider Profile Helpers ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = usersCollection.doc(userId) as admin.firestore.DocumentReference<Omit<UserProfile, 'id'>>;
  return getDocument<UserProfile>(userDocRef);
};

export const getProviderProfile = async (providerId: string): Promise<ProviderProfile | null> => {
  const providerDocRef = providerProfilesCollection.doc(providerId) as admin.firestore.DocumentReference<Omit<ProviderProfile, 'id'>>;
  return getDocument<ProviderProfile>(providerDocRef);
};

export const updateUserFcmToken = async (
  userId: string,
  token: string,
  action: "add" | "remove"
): Promise<void> => {
  const userDocRef = usersCollection.doc(userId);
  try {
    if (action === "add") {
      await userDocRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (action === "remove") {
      await userDocRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error(`[FirestoreService] Error updating FCM token for user ${userId}:`, error);
    // Don't throw, as this might be a non-critical background task
  }
};

// --- Service (OfferedService) Helpers ---

export const getServiceById = async (serviceId: string): Promise<OfferedService | null> => {
    const serviceDocRef = servicesCollection.doc(serviceId) as admin.firestore.DocumentReference<Omit<OfferedService, 'id'>>;
    return getDocument<OfferedService>(serviceDocRef);
};

export const getServicesByProvider = async (providerId: string): Promise<OfferedService[]> => {
    try {
        const snapshot = await servicesCollection
                                .where("providerId", "==", providerId)
                                .where("isActive", "==", true) // Assuming an isActive flag
                                .orderBy("createdAt", "desc")
                                .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferedService));
    } catch (error) {
        console.error(`[FirestoreService] Error fetching services for provider ${providerId}:`, error);
        throw error;
    }
};

// --- Booking Helpers ---

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  const bookingDocRef = bookingsCollection.doc(bookingId) as admin.firestore.DocumentReference<Omit<Booking, 'id'>>;
  return getDocument<Booking>(bookingDocRef);
};

export const updateBookingStatusAndPayment = async (
    bookingId: string,
    status: BookingStatus,
    paymentStatus?: PaymentStatus, // Optional payment status update
    additionalUpdates: Partial<Booking> = {}
): Promise<void> => {
    const bookingDocRef = bookingsCollection.doc(bookingId);
    const updates: Partial<Booking> & { updatedAt: any } = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...additionalUpdates,
    };
    if (paymentStatus) {
        updates.paymentStatus = paymentStatus;
    }
    await updateDocument(bookingDocRef, updates);
};

export const getClientBookings = async (clientId: string, limitNum: number = 20, lastBooking?: Booking): Promise<Booking[]> => {
    try {
        let query = bookingsCollection
            .where("clientId", "==", clientId)
            .orderBy("scheduledDateTime", "desc")
            .limit(limitNum);

        if (lastBooking?.scheduledDateTime) {
            query = query.startAfter(lastBooking.scheduledDateTime);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
        console.error(`[FirestoreService] Error fetching bookings for client ${clientId}:`, error);
        throw error;
    }
};

// --- Review Helpers ---
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
    const reviewDocRef = reviewsCollection.doc(reviewId) as admin.firestore.DocumentReference<Omit<Review, 'id'>>;
    return getDocument<Review>(reviewDocRef);
};

export const getReviewsForProvider = async (providerId: string, limitNum: number = 10, lastReview?: Review): Promise<Review[]> => {
    try {
        let query = reviewsCollection
            .where("revieweeId", "==", providerId)
            .where("revieweeRole", "==", "provider" as UserRole) // Ensure role matches
            .orderBy("createdAt", "desc")
            .limit(limitNum);

        if (lastReview?.createdAt) {
            query = query.startAfter(lastReview.createdAt);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
        console.error(`[FirestoreService] Error fetching reviews for provider ${providerId}:`, error);
        throw error;
    }
};


// --- Notification Helpers ---

export const createStoredNotification = async (notificationData: Omit<StoredNotification, "id" | "createdAt" | "isRead">): Promise<string> => {
    const dataToStore: Omit<StoredNotification, "id"> = {
        ...notificationData,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    return createDocument(userNotificationsCollection as admin.firestore.CollectionReference<Omit<StoredNotification, "id">>, dataToStore);
};

// --- Chat Helpers ---

export const getChatRoomById = async (chatId: string): Promise<ChatRoom | null> => {
    const chatRoomDocRef = chatRoomsCollection.doc(chatId) as admin.firestore.DocumentReference<Omit<ChatRoom, 'id'>>;
    return getDocument<ChatRoom>(chatRoomDocRef);
};

/**
 * Finds a chat room between two participants.
 * Note: This assumes participant UIDs are stored consistently in the array (e.g., sorted)
 * or you create a compound ID like `uid1_uid2` for the chat room ID.
 * For simplicity, this example checks both orders.
 */
export const findChatRoomByParticipants = async (uid1: string, uid2: string): Promise<ChatRoom | null> => {
    try {
        // Firestore array queries for equality on arrays require the exact array match.
        // A common pattern is to create a deterministic chat room ID from participant UIDs
        // e.g., sorted UIDs joined by an underscore.
        // Or, have a `participantsMap: { [uid: string]: true }` for easier querying.
        // For this example, let's try querying for `participants` array containing both.
        // This requires two separate queries and merging or a more complex data structure.

        // Simpler approach if you store participants array and query with array-contains-any and then filter client-side or Function-side.
        // Most robust: use a compound ID for chat rooms: e.g., user1UID_user2UID (sorted)
        // For now, let's show a less efficient but illustrative 'array-contains' approach for two users.
        const query1 = await chatRoomsCollection
            .where('participants', 'array-contains', uid1)
            .get();

        for (const doc of query1.docs) {
            const room = { id: doc.id, ...doc.data() } as ChatRoom;
            if (room.participants.includes(uid2) && room.participants.length === 2) {
                return room;
            }
        }
        return null;
    } catch (error) {
        console.error(`[FirestoreService] Error finding chat room by participants ${uid1}, ${uid2}:`, error);
        throw error;
    }
};

export const createChatMessageInRoom = async (chatId: string, messageData: Omit<ChatMessage, "id" | "timestamp" | "chatId">): Promise<string> => {
    const messagesCollectionRef = chatRoomsCollection.doc(chatId).collection("messages");
    const dataToStore: Omit<ChatMessage, "id"> = {
        ...messageData,
        chatId: chatId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await messagesCollectionRef.add(dataToStore);

    // Also update the parent chatRoom document with last message details
    await updateDocument(chatRoomsCollection.doc(chatId), {
        lastMessageText: messageData.text || (messageData.imageUrl ? "Imagem" : "Mensagem"),
        lastMessageSenderId: messageData.senderId,
        lastMessageTimestamp: dataToStore.timestamp, // Use the server timestamp
        // Implement unread count logic here or in a separate trigger
    });
    return docRef.id;
};


// TODO: Consider adding more specific query helpers as needed, for example:
// - Searching providers by criteria (name, service type, location - might need geoqueries