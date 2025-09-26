// LimpeJaApp/utils/formatters.ts

import { BookingAddress } from '../types/backend/bookings'; // Assumindo que BookingAddress está disponível

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface DateFormatOptions {
  timeOnly?: boolean;
  dateOnly?: boolean;
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
}

/**
 * Formata uma string ISO de data de forma segura para exibição no frontend.
 * Evita crashes com datas inválidas e oferece opções de formatação.
 * @param isoString A string ISO da data.
 * @param options Opções de formatação (ex: timeOnly, dateOnly, ou qualquer Intl.DateTimeFormatOptions).
 * @returns A data formatada ou uma string de fallback em caso de erro.
 */
export function safeFormatDate(isoString?: string | null, options?: DateFormatOptions): string {
  if (!isoString) {
    return '--/--/----'; // Fallback para string nula/indefinida
  }

  try {
    const d = new Date(isoString);

    if (isNaN(d.getTime())) {
      // Data inválida, retornar a string original ou um fallback
      return isoString; 
    }

    const defaultOpts: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Formato 24h
    };

    let finalOpts: Intl.DateTimeFormatOptions = { ...defaultOpts, ...options };

    if (options?.timeOnly) {
        finalOpts = { hour: '2-digit', minute: '2-digit', hour12: false };
    } else if (options?.dateOnly) {
        finalOpts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    }

    return new Intl.DateTimeFormat('pt-BR', finalOpts).format(d);

  } catch (e) {
    console.error('Error formatting date:', e);
    return isoString; // Em caso de exceção, retorna a string original
  }
}

/**
 * Sanitiza uma string, removendo tags HTML básicas para evitar injeção de conteúdo.
 * Essencial para exibir texto vindo de fontes externas (backend, input do usuário).
 * @param s A string a ser sanitizada.
 * @returns A string sanitizada.
 */
export function sanitizeText(s: unknown): string {
  return String(s || '').replace(/<[^>]+>/g, '');
}

/**
 * Formata um valor numérico para o padrão monetário brasileiro (BRL).
 * Utiliza Intl.NumberFormat para garantir formatação correta e consistente.
 * @param value O valor a ser formatado. Pode ser number, string ou null/undefined.
 * @param fallback O texto a ser exibido se o valor for inválido. Padrão: 'R$ --'.
 * @returns Uma string formatada como "R$ X.XXX,XX" ou o fallback.
 */
export function formatPriceBRL(value: unknown, fallback: string = 'R$ --'): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

// Alias para compatibilidade, se ainda houver chamadas para formatBRL
export const formatBRL = formatPriceBRL;

/**
 * Formata um preço de serviço, adicionando o prefixo "R$" e um sufixo de unidade opcional.
 * Garante duas casas decimais e usa Intl.NumberFormat para a parte numérica.
 * @param price O preço do serviço.
 * @param unit Opcional: a unidade do preço (ex: "/h", "/m²").
 * @param fallback O texto a ser exibido se o preço for inválido ou zero. Padrão: 'Consultar'.
 * @returns Uma string formatada como "R$ X.XX/unidade" ou o fallback.
 */
export function formatServicePrice(price: unknown, unit: string = '', fallback: string = 'Consultar'): string {
  const num = Number(price);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  // Usa Intl.NumberFormat para formatar o número com 2 casas decimais
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `R$ ${formatted}${sanitizeText(unit)}`;
}

/**
 * Formata uma distância em metros para uma representação mais legível (m ou km).
 * @param distanceMeters A distância em metros.
 * @param fallback O valor a ser retornado se a distância for inválida. Padrão: null.
 * @returns Uma string formatada da distância ou o fallback.
 */
export function formatDistance(distanceMeters: unknown, fallback: string | null = null): string | null {
  const num = Number(distanceMeters);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  if (num < 1000) {
    return `${Math.round(num)} m`;
  }
  const km = num / 1000;
  // Usa Intl.NumberFormat para formatar KM com uma casa decimal, garantindo o separador correto
  if (km < 10) {
    return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Formata uma data e/ou hora para o padrão brasileiro.
 * Esta função é muito similar a `safeFormatDate` e pode ser consolidada.
 * Por enquanto, mantida para compatibilidade, mas `safeFormatDate` é preferível.
 * @param dateString A string da data (ISO 8601 ou compatível).
 * @param timeString Opcional: a string da hora (HH:mm ou HH:mm:ss).
 * @param opts Opcional: opções de formatação para Intl.DateTimeFormat.
 * @param fallback O texto a ser exibido se a data for inválida. Padrão: '--'.
 * @returns Uma string formatada da data/hora ou o fallback.
 */
export function formatDateTime(dateString: unknown, timeString?: unknown, opts?: Intl.DateTimeFormatOptions, fallback: string = '--'): string {
  let dateToFormat: Date;
  const ds = String(dateString || '');
  const ts = String(timeString || '');

  if (ts) {
    dateToFormat = new Date(`${ds}T${ts}`);
  } else {
    dateToFormat = new Date(ds);
  }

  if (isNaN(dateToFormat.getTime())) {
    return fallback;
  }

  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Formato 24h
  };

  return new Intl.DateTimeFormat('pt-BR', opts || defaultOpts).format(dateToFormat);
}

/**
 * Formata um objeto de endereço em uma única linha, sanitizando os campos.
 * @param addr O objeto de endereço (BookingAddress ou similar).
 * @param fallback O texto a ser exibido se o endereço for inválido ou incompleto. Padrão: ''.
 * @returns Uma string formatada do endereço ou o fallback.
 */
export function formatAddress(addr: BookingAddress | any, fallback: string = ''): string {
  if (!addr || typeof addr !== 'object') return sanitizeText(String(addr || fallback));
  const streetNumber = [sanitizeText(addr.street), sanitizeText(addr.number)].filter(Boolean).join(', ');
  const cityState = [sanitizeText(addr.city), sanitizeText(addr.state)].filter(Boolean).join('/');
  const complement = sanitizeText(addr.complement);

  const parts = [streetNumber];
  if (complement) parts.push(complement);
  if (cityState) parts.push(cityState);

  return parts.filter(Boolean).join(' - ');
}