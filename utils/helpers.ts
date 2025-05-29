// LimpeJaApp/src/utils/helpers.ts

/**
 * Formata uma data ISO string (ou objeto Date) para um formato legível em português do Brasil.
 *
 * @param {string | Date} dateInput - A data a ser formatada, pode ser uma string ISO (ex: "2025-07-15T14:00:00Z") ou um objeto Date.
 * @param {Intl.DateTimeFormatOptions} [options] - Opções de formatação adicionais para `toLocaleString`.
 * @returns {string} A data formatada ou "Data inválida" se a entrada for inválida.
 *
 * @example
 * formatDate("2025-07-15T14:00:00Z"); // Ex: "15/07/2025, 11:00" (considerando fuso -03:00)
 * formatDate("2025-07-15", { weekday: 'long', day: 'numeric', month: 'long' }); // Ex: "terça-feira, 15 de julho"
 * formatDate(new Date(), { hour: '2-digit', minute: '2-digit' }); // Ex: "10:30"
 */
export const formatDate = (dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  let date: Date;

  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    console.warn("formatDate: Entrada de data inválida fornecida. Esperado string ou Date.", dateInput);
    return "Data inválida";
  }

  if (isNaN(date.getTime())) {
    console.warn("formatDate: String de data inválida resultou em data inválida.", dateInput);
    return "Data inválida";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // timeZone: 'America/Sao_Paulo', // Descomente e ajuste se precisar forçar um fuso específico
  };

  try {
    return date.toLocaleString('pt-BR', { ...defaultOptions, ...options });
  } catch (error) {
    console.error("formatDate: Erro ao formatar data.", error);
    return "Data inválida";
  }
};

/**
 * Valida um endereço de e-mail usando uma expressão regular comum.
 *
 * @param {string} email - O endereço de e-mail a ser validado.
 * @returns {boolean} `true` se o e-mail for válido, `false` caso contrário.
 *
 * @example
 * isValidEmail("teste@example.com"); // true
 * isValidEmail("invalido@.com"); // false
 * isValidEmail(""); // false
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  // Regex para validação de e-mail (RFC 5322 simplificado)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valida uma senha com base em um comprimento mínimo.
 * Pode ser estendida para incluir requisitos de caracteres (maiúsculas, números, símbolos).
 *
 * @param {string} password - A senha a ser validada.
 * @param {number} [minLength=8] - O comprimento mínimo exigido para a senha.
 * @returns {boolean} `true` se a senha atender aos critérios, `false` caso contrário.
 *
 * @example
 * isValidPassword("minhasenha123"); // true (se minLength=8)
 * isValidPassword("curta"); // false (se minLength=8)
 */
export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
};

/**
 * Capitaliza a primeira letra de uma string.
 *
 * @param {string} str - A string a ser capitalizada.
 * @returns {string} A string com a primeira letra em maiúscula. Retorna uma string vazia se a entrada for nula ou vazia.
 *
 * @example
 * capitalizeFirstLetter("olá mundo"); // "Olá mundo"
 * capitalizeFirstLetter(""); // ""
 * capitalizeFirstLetter(null); // ""
 */
// << CORREÇÃO: Removido o 'const' duplicado >>
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Gera um ID único simples.
 * ATENÇÃO: NÃO use para IDs de banco de dados seguros ou chaves criptográficas.
 * Destinado apenas para uso em UI (ex: chaves de lista) ou mocks.
 *
 * @returns {string} Um ID único baseado em um número aleatório.
 *
 * @example
 * generateSimpleId(); // Ex: "k1j2l3m4n5o6p7"
 */
export const generateSimpleId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Formata um valor numérico como moeda brasileira (Real).
 *
 * @param {number} value - O valor numérico a ser formatado.
 * @param {string} [locale='pt-BR'] - O locale para formatação.
 * @param {string} [currency='BRL'] - O código da moeda (ISO 4217).
 * @returns {string} O valor formatado como string de moeda. Retorna "R$ 0,00" se a entrada for inválida.
 *
 * @example
 * formatCurrency(1234.56); // "R$ 1.234,56"
 * formatCurrency(100); // "R$ 100,00"
 * formatCurrency(0); // "R$ 0,00"
 * formatCurrency(null); // "R$ 0,00"
 */
export const formatCurrency = (value: number | null | undefined, locale: string = 'pt-BR', currency: string = 'BRL'): string => {
  if (value === null || value === undefined || isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Trunca uma string para um comprimento máximo especificado, adicionando reticências se necessário.
 *
 * @param {string} str - A string a ser truncada.
 * @param {number} maxLength - O comprimento máximo desejado para a string.
 * @returns {string} A string truncada.
 *
 * @example
 * truncateString("Isso é um texto muito longo.", 10); // "Isso é..."
 * truncateString("Curto", 10); // "Curto"
 */
export const truncateString = (str: string | null | undefined, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Valida um número de telefone brasileiro (com ou sem DDD, com 8 ou 9 dígitos no número).
 * Remove caracteres não numéricos antes da validação.
 *
 * @param {string} phoneNumber - O número de telefone a ser validado.
 * @returns {boolean} `true` se o número for um telefone brasileiro válido, `false` caso contrário.
 *
 * @example
 * isValidPhoneNumber("11987654321"); // true
 * isValidPhoneNumber("(21) 99876-5432"); // true
 * isValidPhoneNumber("9876-5432"); // true (considera DDD implícito)
 * isValidPhoneNumber("123"); // false
 */
export const isValidPhoneNumber = (phoneNumber: string | null | undefined): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  const cleaned = phoneNumber.replace(/\D/g, ''); // Remove todos os não-dígitos
  // Regex para telefones brasileiros:
  // (DDD opcional com 2 dígitos) (9 ou 8 dígitos no número)
  // Aceita 8 dígitos para fixos ou 9 para celulares, e 2 dígitos para DDD.
  // Pode ser mais específico se necessário (ex: apenas celulares, apenas DDDs válidos)
  const phoneRegex = /^(\d{2})?(\d{8,9})$/;
  return phoneRegex.test(cleaned);
};

/**
 * Formata um número de telefone brasileiro para exibição.
 * Tenta formatar como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 *
 * @param {string} phoneNumber - O número de telefone a ser formatado.
 * @returns {string} O número de telefone formatado. Retorna a string original se não puder formatar.
 *
 * @example
 * formatPhoneNumber("11987654321"); // "(11) 98765-4321"
 * formatPhoneNumber("21998765432"); // "(21) 99876-5432"
 * formatPhoneNumber("3123456789"); // "(31) 2345-6789"
 * formatPhoneNumber("987654321"); // "98765-4321" (sem DDD)
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return '';
  const cleaned = phoneNumber.replace(/\D/g, ''); // Remove todos os não-dígitos

  if (cleaned.length === 11) { // (XX) XXXXX-XXXX
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) { // (XX) XXXX-XXXX
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 9) { // XXXXX-XXXX (sem DDD)
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 9)}`;
  } else if (cleaned.length === 8) { // XXXX-XXXX (sem DDD)
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}`;
  }
  return phoneNumber; // Retorna original se não corresponder a um padrão conhecido
};