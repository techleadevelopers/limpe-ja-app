// LimpeJaApp/config/firebaseClient.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Para o serviço de autenticação (API modular web)
import Constants from 'expo-constants';

// Importações do React Native Firebase para garantir que os módulos nativos sejam carregados
// Estes são importantes para o ambiente nativo (APK/Expo Go)
// Removido RN Firebase nativo: usamos SDK Web modular do Firebase no Expo.
// Isso evita pods nativos desnecessários e conflitos no iOS EAS build.

// --- LOGS DEFENSIVOS ESSENCIAIS ---
console.log('--- [FirebaseClient Debug] Início do Carregamento ---');

// 1. Verificar se Constants.expoConfig existe e tem a seção extra
if (!Constants.expoConfig) {
  console.error('[FirebaseClient Debug] ERRO: Constants.expoConfig é undefined. A configuração do Expo não foi carregada corretamente.');
} else {
  console.log('[FirebaseClient Debug] Constants.expoConfig carregado. Nome do app:', Constants.expoConfig.name);
  if (!Constants.expoConfig.extra) {
    console.error('[FirebaseClient Debug] ERRO: Constants.expoConfig.extra é undefined. A seção "extra" está faltando no app.config.ts/app.json.');
  } else {
    console.log('[FirebaseClient Debug] Constants.expoConfig.extra existe.');
    // 2. Logar o conteúdo bruto de process.env (apenas para depuração, cuidado com dados sensíveis em produção)
    console.log('[FirebaseClient Debug] Conteúdo de process.env.EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'Presente' : 'Ausente ou Vazio');
    console.log('[FirebaseClient Debug] Conteúdo de process.env.EXPO_PUBLIC_FIREBASE_APP_ID:', process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? 'Presente' : 'Ausente ou Vazio');
    console.log('[FirebaseClient Debug] Conteúdo de process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'Presente' : 'Ausente ou Vazio');
  }
}

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey as string || '',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain as string || '',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId as string || '',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket as string || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId as string || '',
  appId: Constants.expoConfig?.extra?.firebaseAppId as string || '',
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId as string || ''
};

// 3. Logar os valores que foram efetivamente atribuídos a firebaseConfig
console.log('[FirebaseClient Debug] Valores de firebaseConfig após atribuição:');
console.log('  apiKey:', firebaseConfig.apiKey ? 'OK' : 'Faltando');
console.log('  authDomain:', firebaseConfig.authDomain ? 'OK' : 'Faltando');
console.log('  projectId:', firebaseConfig.projectId ? 'OK' : 'Faltando');
console.log('  appId:', firebaseConfig.appId ? 'OK' : 'Faltando');
console.log('--- [FirebaseClient Debug] Fim do Carregamento de Config ---');


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
        // Logar os valores que causaram a falha de validação
        console.error(`[Firebase Init] Detalhes da Falha: apiKey=${firebaseConfig.apiKey}, projectId=${firebaseConfig.projectId}, appId=${firebaseConfig.appId}`);
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
export const authClient = app ? getAuth(app) : undefined;

export { app, firebaseInitializationPromise };
