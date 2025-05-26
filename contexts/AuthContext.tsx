// LimpeJaApp/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens } from '../types';
import { api } from '../services/api'; // Para atualizar o header de autorização

interface AuthContextData {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userData: User, tokenData: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoragedData() {
      console.log('[AuthContext] loadStoragedData: Attempting to load stored data...');
      try {
        const storedTokens = await SecureStore.getItemAsync('userTokens');
        const storedUser = await SecureStore.getItemAsync('userData');

        console.log('[AuthContext] loadStoragedData: Raw storedTokens:', storedTokens);
        console.log('[AuthContext] loadStoragedData: Raw storedUser:', storedUser);

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens) as AuthTokens;
          const parsedUser = JSON.parse(storedUser) as User;
          
          // Validação básica dos dados parseados
          if (parsedTokens && parsedTokens.accessToken && parsedUser && parsedUser.id && parsedUser.role) {
            console.log('[AuthContext] loadStoragedData: Data parsed successfully. Setting state.');
            setTokens(parsedTokens);
            setUser(parsedUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.accessToken}`;
          } else {
            console.warn('[AuthContext] loadStoragedData: Parsed data is invalid. Clearing storage.');
            // Se os dados parseados não são válidos, limpa para evitar estado inconsistente
            await SecureStore.deleteItemAsync('userTokens').catch(e => console.error("[AuthContext] loadStoragedData: Error deleting tokens on parse fail", e));
            await SecureStore.deleteItemAsync('userData').catch(e => console.error("[AuthContext] loadStoragedData: Error deleting user data on parse fail", e));
          }
        } else {
          console.log('[AuthContext] loadStoragedData: No stored tokens or user data found.');
        }
      } catch (error) {
        console.error("[AuthContext] loadStoragedData: Failed to load or parse user data from storage:", error);
        // Limpar em caso de erro para evitar estado inconsistente
        try {
          console.log('[AuthContext] loadStoragedData: Attempting to delete items due to load/parse error...');
          await SecureStore.deleteItemAsync('userTokens');
          await SecureStore.deleteItemAsync('userData');
          console.log('[AuthContext] loadStoragedData: Items deleted after load/parse error.');
        } catch (deleteError) {
          // Este é o ponto CRÍTICO se o erro da sua screenshot estiver acontecendo aqui
          console.error('[AuthContext] loadStoragedData: CRITICAL - Failed to delete items after load/parse error:', deleteError);
        }
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] loadStoragedData: Finished. isLoading:', isLoading, 'isAuthenticated:', !!user && !!tokens);
      }
    }
    loadStoragedData();
  }, []); // Removido user e tokens das dependências para evitar re-execução desnecessária ao logar/deslogar

  const signIn = async (userData: User, tokenData: AuthTokens) => {
    console.log('[AuthContext] signIn: Called with user:', userData, 'tokens:', tokenData);
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync('userTokens', JSON.stringify(tokenData));
      console.log('[AuthContext] signIn: User tokens stored in SecureStore.');
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      console.log('[AuthContext] signIn: User data stored in SecureStore.');
      
      setUser(userData);
      setTokens(tokenData);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenData.accessToken}`;
      console.log('[AuthContext] signIn: User state updated. isAuthenticated should now be true.');
    } catch (error) {
      console.error("[AuthContext] signIn: Failed to sign in and store data:", error);
      // Limpar em caso de falha ao salvar para evitar estado inconsistente
      setUser(null);
      setTokens(null);
      delete api.defaults.headers.common['Authorization'];
      try {
        console.log('[AuthContext] signIn: Attempting to delete items due to signIn failure...');
        await SecureStore.deleteItemAsync('userTokens');
        await SecureStore.deleteItemAsync('userData');
        console.log('[AuthContext] signIn: Items deleted after signIn failure.');
      } catch (deleteError) {
         console.error('[AuthContext] signIn: CRITICAL - Failed to delete items after signIn failure:', deleteError);
      }
      // TODO: Lidar com o erro de forma apropriada (ex: mostrar mensagem ao usuário)
      // throw error; // Opcional: propagar o erro para quem chamou o signIn
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signIn: Finished. isLoading:', false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut: Called.');
    setIsLoading(true);
    try {
      console.log('[AuthContext] signOut: Attempting to delete userTokens...');
      await SecureStore.deleteItemAsync('userTokens');
      console.log('[AuthContext] signOut: userTokens deleted.');
      console.log('[AuthContext] signOut: Attempting to delete userData...');
      await SecureStore.deleteItemAsync('userData');
      console.log('[AuthContext] signOut: userData deleted.');
      
      setUser(null);
      setTokens(null);
      delete api.defaults.headers.common['Authorization'];
      console.log('[AuthContext] signOut: User state cleared. isAuthenticated should now be false.');
    } catch (error) {
      console.error("[AuthContext] signOut: Failed to sign out and clear data:", error);
      // Mesmo se a exclusão falhar, tentamos limpar o estado da memória
      setUser(null);
      setTokens(null);
      delete api.defaults.headers.common['Authorization'];
      // TODO: Lidar com o erro de forma apropriada
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signOut: Finished. isLoading:', false);
    }
  };

  const updateUser = async (updatedUserData: Partial<User>) => { // Tornada async para o await do SecureStore
    console.log('[AuthContext] updateUser: Called with data:', updatedUserData);
    let finalUser: User | null = null;
    setUser(currentUser => {
      if (currentUser) {
        const newUser = { ...currentUser, ...updatedUserData };
        finalUser = newUser; // Captura newUser para usar no SecureStore
        console.log('[AuthContext] updateUser: New user object for state:', newUser);
        return newUser;
      }
      return null;
    });

    if (finalUser) {
      try {
        console.log('[AuthContext] updateUser: Attempting to store updated user data in SecureStore:', finalUser);
        await SecureStore.setItemAsync('userData', JSON.stringify(finalUser));
        console.log('[AuthContext] updateUser: Updated user data stored successfully.');
      } catch (error) {
        console.error('[AuthContext] updateUser: Failed to store updated user data:', error);
        // TODO: Considerar como lidar com essa falha. Reverter o estado setUser? Notificar o usuário?
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};