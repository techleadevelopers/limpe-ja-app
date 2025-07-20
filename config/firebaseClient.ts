// LimpeJaApp/config/firebaseClient.ts
import { initializeApp, getApp, getApps } from 'firebase/app'; 
import { getAuth } from 'firebase/auth'; // Para o serviço de autenticação (API modular web)
import Constants from 'expo-constants'; 

// Importações do React Native Firebase para garantir que os módulos nativos sejam carregados
// Estes são importantes para o ambiente nativo (APK/Expo Go)
import '@react-native-firebase/app';
import '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey as string || '', 
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain as string || '',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId as string || '',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket as string || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId as string || '',
  appId: Constants.expoConfig?.extra?.firebaseAppId as string || '', 
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId as string || '' 
};

console.log('[Firebase Init] Carregando Firebase Config para o Frontend:', 
  firebaseConfig.projectId, 
  firebaseConfig.apiKey ? 'API Key OK' : 'API Key Missing',
  firebaseConfig.appId ? 'App ID OK' : 'App ID Missing'
);

let app;
let firebaseInitializationPromise: Promise<void>; 

if (!getApps().length) { 
  firebaseInitializationPromise = new Promise(async (resolve, reject) => {
    try {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
        const errorMsg = "Firebase credentials are incomplete or missing in app.json 'extra'. Cannot initialize Firebase.";
        console.error(`[Firebase Init] ERRO FATAL: ${errorMsg}`);
        return reject(new Error(errorMsg));
      }
      app = initializeApp(firebaseConfig);
      console.log('[Firebase Init] Firebase App inicializado com sucesso no frontend.');
      resolve();
    } catch (error: any) {
      if (error.code === 'app/duplicate-app') { 
          app = getApp();
          console.warn('[Firebase Init] Firebase App já estava inicializado (erro de duplicação). Usando instância existente.');
          resolve();
      } else {
          console.error(`[Firebase Init] ERRO CRÍTICO ao inicializar Firebase App no frontend: ${error.message}`);
          reject(error);
      }
    }
  });
} else {
  app = getApp();
  console.log('[Firebase Init] Firebase App já estava inicializado no frontend.');
  firebaseInitializationPromise = Promise.resolve(); 
}

// Exporta o serviço de autenticação para uso em componentes (API modular web)
// NOVO: Exportamos a instância getAuth(app) para uso direto em login.tsx para web.
export const authClient = app ? getAuth(app) : undefined; 

export { app, firebaseInitializationPromise };