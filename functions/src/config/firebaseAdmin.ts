import * as admin from "firebase-admin";

// Inicializa o Firebase Admin SDK apenas uma vez
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("Firebase Admin SDK initialized.");
}

export const db = admin.firestore(); // Instância do Firestore
export const auth = admin.auth();     // Instância do Firebase Authentication (Admin)
export const storage = admin.storage(); // Instância do Firebase Storage (Admin)
// Adicione outros serviços admin do Firebase conforme necessário (ex: Messaging)
export const messaging = admin.messaging();

export default admin;