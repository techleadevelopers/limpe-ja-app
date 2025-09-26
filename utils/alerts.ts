// LimpeJaApp/utils/alerts.ts
import { Alert, Platform, AlertButton } from 'react-native'; // <<-- Importe AlertButton aqui

/**
 * Exibe um alerta consistente no aplicativo, com tratamento seguro para mensagens de erro.
 * @param title O título do alerta.
 * @param message A mensagem do alerta. Pode ser uma string ou um objeto de erro.
 * @param buttons Botões personalizados para o alerta.
 */
export function showAppAlert(
  title: string,
  message: string | unknown, // Aceita string ou unknown para ser mais robusto
  buttons?: AlertButton[] // <<-- Usando AlertButton[]
) {
  let formattedMessage: string;

  if (typeof message === 'string') {
    formattedMessage = message;
  } else if (message instanceof Error) {
    formattedMessage = message.message;
  } else if (typeof message === 'object' && message !== null && 'message' in message && typeof (message as any).message === 'string') {
    formattedMessage = (message as any).message;
  } else {
    formattedMessage = 'Ocorreu um erro inesperado. Tente novamente.';
  }

  // No iOS, o Alert pode ser mais flexível com o número de botões.
  // No Android, é comum ter 1 ou 2 botões.
  // Para simplicidade, usamos um botão padrão se nenhum for fornecido.
  const defaultButtons: AlertButton[] = [{ text: 'OK' }]; // <<-- Usando AlertButton[]

  Alert.alert(title, formattedMessage, buttons || defaultButtons);
}