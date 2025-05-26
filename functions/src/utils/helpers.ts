// LimpeJaApp/functions/src/utils/helpers.ts
import { HttpsError } from "firebase-functions/v1/https"; // Importa HttpsError ESPECIFICAMENTE da v1
import { DecodedIdToken } from "firebase-admin/auth";   // Tipo para o token decodificado do Firebase Admin SDK
import { UserRole } from "../types";                     // Seu tipo UserRole
import * as admin from "firebase-admin"; // Necessário para admin.firestore.Timestamp na função formatDate

/**
 * Interface para descrever a ESTRUTURA esperada de context.auth
 * quando passado de uma Callable Function v1 para esta função helper.
 * O próprio context.auth pode ser undefined se o usuário não estiver autenticado.
 */
interface V1CallableAuthContext {
  uid: string;
  token: DecodedIdToken; // O token já decodificado com os custom claims
}

/**
 * Valida se o usuário autenticado (representado pelo seu UID e token decodificado)
 * tem a role esperada. Lança um HttpsError se a verificação falhar.
 */
export function assertRole(
  // Recebe o objeto context.auth (ou undefined se não autenticado)
  // que vem de uma Callable Function v1 (context.auth)
  authData: V1CallableAuthContext | undefined,
  expectedRoles: UserRole | UserRole[]
): void {
  if (!authData || !authData.token || !authData.uid) {
    console.error("[assertRole] Requisição não autenticada, UID ou token ausente.");
    throw new HttpsError( // Usando o HttpsError importado da v1
      "unauthenticated",
      "A requisição deve ser autenticada e o token de autenticação é necessário."
    );
  }

  const userRole = authData.token.role as UserRole;
  if (!userRole) {
    console.error(`[assertRole] Usuário ${authData.uid} não possui o custom claim 'role' definido no seu token.`);
    throw new HttpsError(
      "permission-denied",
      "Permissão negada. O usuário não possui um papel (role) de acesso definido."
    );
  }

  const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];

  if (!rolesToCheck.includes(userRole)) {
    console.error(`[assertRole] Permissão negada para UID: ${authData.uid}. Role atual: '${userRole}'. Role(s) esperada(s): [${rolesToCheck.join(", ")}].`);
    throw new HttpsError(
      "permission-denied",
      `Você não tem permissão para executar esta ação. Seu papel (${userRole}) não está na lista de papéis permitidos (${rolesToCheck.join(" ou ")}).`
    );
  }
  // console.log(`[assertRole] UID: ${authData.uid} com role '${userRole}' verificado com sucesso para [${rolesToCheck.join(", ")}].`);
}

/**
 * Formata uma data ISO string ou objeto Date para um formato legível.
 */
export const formatDate = (
    dateInput: string | Date | admin.firestore.Timestamp,
    options?: Intl.DateTimeFormatOptions
): string => {
  let date: Date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput && typeof (dateInput as any).toDate === 'function') {
    // Converte Timestamp do Firestore para Date
    date = (dateInput as admin.firestore.Timestamp).toDate();
  } else {
    console.error("Erro ao formatar data: Input inválido", dateInput);
    return "Data inválida";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  const finalOptions = { ...defaultOptions, ...options };
  try {
    return date.toLocaleDateString('pt-BR', finalOptions);
  } catch (e) {
    console.error("Erro ao formatar data com options:", e, "Input:", dateInput, "Options:", finalOptions);
    // Tenta um formato mais simples em caso de erro com options complexas
    try {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric'});
    } catch (finalError) {
        return "Data inválida";
    }
  }
};

// Você pode adicionar suas outras funções helpers aqui (isValidEmail, etc.)