// LimpeJaApp/config/firebase.ts

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
// Importação CORRIGIDA: getReactNativePersistence vem de 'firebase/auth/react-native'
import { getReactNativePersistence } from 'firebase/auth/react-native'; 
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // Para acessar variáveis de ambiente do Expo

// 1. Configuração do Firebase
// Essas variáveis devem ser definidas no seu app.json / app.config.ts
// ou em variáveis de ambiente, acessíveis via Expo.Constants.manifest.extra
// Exemplo de como configurá-las no app.config.ts:
// extra: {
//   firebaseApiKey: process.env.FIREBASE_API_KEY,
//   firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
//   firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   firebaseAppId: process.env.FIREBASE_APP_ID,
//   firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
//   // ... outras configurações se houver
// }

// Validação básica para garantir que as variáveis existam
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey as string,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain as string,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId as string,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket as string,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId as string,
  appId: Constants.expoConfig?.extra?.firebaseAppId as string,
  // measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId as string, // Opcional, se usar Analytics
};

// Verifica se as variáveis de ambiente foram carregadas corretamente
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your app.config.ts and environment variables.");
  // Em produção, você pode querer lançar um erro ou lidar com isso de forma mais robusta.
}


// 2. Inicializar o Aplicativo Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// 3. Inicializar e Exportar Serviços Firebase
// Autenticação
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Cloud Firestore
const db: Firestore = getFirestore(app);

// Firebase Storage
const storage: FirebaseStorage = getStorage(app);

// Firebase Cloud Functions
// IMPORTANTE: Defina a região da sua Cloud Function se não for us-central1
// Para local (emulador): useFunctionsEmulator(functions, 'http://localhost:5001');
const functions: Functions = getFunctions(app, 'southamerica-east1'); // Exemplo: usando a região de São Paulo

// 4. Exportar as instâncias dos serviços para uso em outras partes do app
export { app, auth, db, storage, functions };

// Opcional: Para desenvolvimento local com emuladores
// Descomente as linhas abaixo se estiver usando emuladores do Firebase
/*
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { connectFunctionsEmulator } from 'firebase/functions';

// Verifique se está em ambiente de desenvolvimento (por exemplo, via variável de ambiente)
if (__DEV__) { // __DEV__ é uma variável global do React Native que é true em dev
  console.log('Conectando-se aos emuladores do Firebase...');
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001); // Porta padrão do Functions Emulator
  } catch (e) {
    console.warn('Erro ao conectar emuladores Firebase (podem já estar conectados):', e);
  }
}
*/