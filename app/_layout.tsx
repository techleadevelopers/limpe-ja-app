// LimpeJaApp/app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, SplashScreen, useRouter, usePathname } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext'; // Ajuste o caminho
import { useAuth } from '../hooks/useAuth';             // Ajuste o caminho
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import { AppProvider } from '../contexts/AppContext';   // Ajuste o caminho

// ----- INÍCIO DA CONFIGURAÇÃO DE CONEXÃO COM EMULADORES FIREBASE -----
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
// import { getStorage, connectStorageEmulator } from 'firebase/storage';
import firebaseApp from '../services/firebaseConfig'; // <<<--- SEU ARQUIVO DE CONFIGURAÇÃO DO FIREBASE CLIENTE

const authInstance = getAuth(firebaseApp);
const firestoreInstance = getFirestore(firebaseApp);
// ATENÇÃO: Para Functions, se você definiu uma região no backend (ex: 'southamerica-east1'),
// você PRECISA especificar a mesma região aqui ao obter a instância e ao conectar ao emulador.
const functionsInstance = getFunctions(firebaseApp, 'southamerica-east1');
// const storageInstance = getStorage(firebaseApp);

// Ajuste o EMULATOR_HOST conforme seu ambiente de teste:
// - "10.0.2.2" para Emulador Android rodando no mesmo PC que os emuladores Firebase.
// - "localhost" para Web ou Emulador iOS rodando no mesmo Mac que os emuladores Firebase.
// - O IP local do seu PC (ex: "192.168.X.X") se estiver testando em um celular físico na mesma rede Wi-Fi.
const EMULATOR_HOST = Platform.OS === 'android' ? "10.0.2.2" : "localhost"; // Exemplo dinâmico básico

if (__DEV__) { // Só executa em modo de desenvolvimento
  try {
    console.log(`[Firebase Client Setup] Modo DEV. Tentando conectar aos emuladores em ${EMULATOR_HOST}...`);
    
    // Verifique se as instâncias já estão conectadas para evitar erros de "já conectado"
    // (Esta verificação pode não ser perfeita ou necessária dependendo da versão do SDK Firebase)
    if (!(authInstance as any).emulatorConfig) {
      connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
      console.log(`[Firebase Client Setup] Auth Emulator conectado em http://${EMULATOR_HOST}:9099`);
    }
    if (!(firestoreInstance as any).emulatorConfig) {
      connectFirestoreEmulator(firestoreInstance, EMULATOR_HOST, 8080);
      console.log(`[Firebase Client Setup] Firestore Emulator conectado em ${EMULATOR_HOST}:8080`);
    }
    if (!(functionsInstance as any).emulatorConfig) {
      connectFunctionsEmulator(functionsInstance, EMULATOR_HOST, 5001); // Porta padrão
      console.log(`[Firebase Client Setup] Functions Emulator conectado em ${EMULATOR_HOST}:5001`);
    }
    // if (!(storageInstance as any).emulatorConfig) {
    //   connectStorageEmulator(storageInstance, EMULATOR_HOST, 9199);
    //   console.log(`[Firebase Client Setup] Storage Emulator conectado em ${EMULATOR_HOST}:9199`);
    // }
    console.log('[Firebase Client Setup] Configuração para usar emuladores concluída (ou já estavam conectados).');
  } catch (e) {
    console.error("[Firebase Client Setup] Erro crítico ao tentar conectar aos emuladores:", e);
    // Considere mostrar um alerta para o desenvolvedor aqui
  }
}
// ----- FIM DA CONFIGURAÇÃO DE CONEXÃO COM EMULADORES FIREBASE -----


SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  // ... (resto do seu InitialLayout como antes) ...
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { /* ... sua lógica de redirecionamento ... */ }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) { /* ... seu ActivityIndicator ... */ }
  
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <InitialLayout />
      </AppProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({ /* ... seus estilos ... */ });