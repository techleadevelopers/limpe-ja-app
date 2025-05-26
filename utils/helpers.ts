// LimpeJaApp/src/utils/helpers.ts

/**
 * Formata uma data ISO string para um formato legível.
 * Ex: "2025-07-15T14:00:00Z" -> "15/07/2025 às 11:00" (considerando fuso -03:00)
 * ou "15 de julho de 2025, 14:00"
 */
export const formatDate = (isoString: string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const date = new Date(isoString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      // timeZone: 'America/Sao_Paulo', // Opcional: se quiser forçar um fuso específico
    };
    return date.toLocaleString('pt-BR', { ...defaultOptions, ...options });
  } catch (error) {
    console.warn("formatDate: Invalid date string provided", isoString);
    return "Data inválida";
  }
};

/**
 * Valida um endereço de e-mail.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  // Regex simples, pode ser aprimorado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida uma senha (exemplo: mínimo 8 caracteres).
 */
export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  if (!password) return false;
  return password.length >= minLength;
};


/**
 * Capitaliza a primeira letra de uma string.
 */
export const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Gera um ID único simples (NÃO use para IDs de banco de dados seguros, apenas para UI/mocks)
 */
export const generateSimpleId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Adicione outras funções helpers conforme necessário