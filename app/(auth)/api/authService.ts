// LimpeJaApp/app/(auth)/api/authService.ts

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { app, functions } from '../../../config/firebase'; // Certifique-se de que o caminho para 'firebase.ts' está correto
// Importe UserProfile e UserRole do seu types/auth.ts
import { UserProfile, UserRole } from '../../../types/auth'; 

const auth = getAuth(app);

/**
 * Interface para os dados de login.
 * Alinhe com os tipos definidos no backend (functions/src/types/auth.d.ts)
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface para os dados de registro de cliente.
 * Alinhe com os tipos definidos no backend (functions/src/types/auth.d.ts)
 */
interface RegisterClientRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/**
 * Interface para a resposta de autenticação.
 * Alinhe com os tipos definidos no backend (functions/src/types/auth.d.ts)
 */
interface AuthResponse {
  userId: string;
  email: string;
  name?: string;
  token: string;
  role?: UserRole; // Use o tipo UserRole aqui
  // ... outras propriedades do UserProfile que você queira retornar
}

/**
 * Interface para os dados de atualização de perfil.
 * Alinhe com os tipos definidos no backend (functions/src/types/user.types.ts ou types/auth.ts)
 */
interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  // ... outras propriedades que podem ser atualizadas
}

/**
 * Serviço de Autenticação e Gerenciamento Básico de Usuários.
 * Interage com Firebase Auth SDK e Cloud Functions de autenticação.
 */
export const authService = {
  /**
   * Realiza o login de um usuário com e-mail e senha.
   * @param credentials Objeto contendo email e password.
   * @returns Uma Promise que resolve com os dados de autenticação.
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const idTokenResult = await userCredential.user.getIdTokenResult(true); // Força atualização do token

      // CORREÇÃO AQUI: Adicione a propriedade 'role'
      const userProfile: UserProfile = { 
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || 'Usuário LimpeJá', // Fornecer um valor padrão caso displayName seja null
        // O papel (role) deve vir dos Custom Claims do ID Token
        // O backend é responsável por definir esses claims após o registro ou em triggers.
        role: (idTokenResult.claims.role || 'client') as UserRole, // Assumindo 'client' como padrão se não definido
        phone: idTokenResult.claims.phone as string | undefined, // Exemplo: se o phone estiver nos claims
        avatarUrl: userCredential.user.photoURL || undefined, // Exemplo: se photoURL existir no Auth
      };

      return {
        userId: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || 'Usuário LimpeJá',
        token: idTokenResult.token,
        role: (idTokenResult.claims.role || 'client') as UserRole, // Retornar o role do token
      };
    } catch (error: any) {
      console.error("Erro no login:", error.code, error.message);
      // Mapeie erros do Firebase para mensagens amigáveis
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "E-mail ou senha inválidos.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de e-mail inválido.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Sua conta foi desativada. Entre em contato com o suporte.";
      }
      throw new Error(errorMessage);
    }
  },

  /**
   * Registra um novo cliente.
   * Esta função chama a Cloud Function `createUser` para criar o usuário no Auth e no Firestore.
   * @param data Objeto contendo email, password, name, phone.
   * @returns Uma Promise que resolve com os dados de autenticação.
   */
  async registerClient(data: RegisterClientRequest): Promise<AuthResponse> {
    try {
      // Chama a Cloud Function para criar o usuário e o perfil no backend
      const createUserCallable = httpsCallable<RegisterClientRequest, AuthResponse>(functions, 'createUser');
      const result = await createUserCallable(data);
      return result.data; // Retorna os dados do usuário e token do backend
    } catch (error: any) {
      console.error("Erro no registro de cliente:", error.code, error.message);
      let errorMessage = "Ocorreu um erro ao registrar. Tente novamente.";
      if (error.code === 'functions/already-exists') { // Erro customizado da Cloud Function
        errorMessage = "Este e-mail já está em uso.";
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = "Dados de registro inválidos.";
      }
      throw new Error(errorMessage);
    }
  },

  /**
   * Envia um e-mail de redefinição de senha.
   * @param email O e-mail do usuário.
   * @returns Uma Promise que resolve quando o e-mail é enviado.
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Erro ao enviar redefinição de senha:", error.code, error.message);
      let errorMessage = "Ocorreu um erro ao enviar o e-mail de redefinição.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "E-mail não encontrado.";
      }
      throw new Error(errorMessage);
    }
  },

  /**
   * Atualiza o perfil de um usuário.
   * Esta função chama a Cloud Function `updateUserProfile`.
   * @param data Os dados a serem atualizados no perfil.
   * @returns Uma Promise que resolve quando o perfil é atualizado.
   */
  async updateUserProfile(data: UpdateUserProfileRequest): Promise<void> {
    try {
      const updateUserProfileCallable = httpsCallable<UpdateUserProfileRequest, void>(functions, 'updateUserProfile');
      await updateUserProfileCallable(data);
      console.log('Perfil atualizado com sucesso no backend.');
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error.code, error.message);
      throw new Error("Não foi possível atualizar o perfil. Tente novamente.");
    }
  },

  /**
   * Realiza o logout do usuário.
   */
  async logout(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erro no logout:", error);
      throw new Error("Ocorreu um erro ao fazer logout.");
    }
  },
};