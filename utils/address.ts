import { BookingAddress } from '../types/backend/bookings';

export function formatAddressCompact(addr?: BookingAddress | null): { line1: string; line2: string; line3?: string } {
  if (!addr) return { line1: 'Endereço indisponível', line2: '' };
  const parts1: string[] = [];
  if (addr.street) parts1.push(addr.street);
  if (addr.number) parts1.push(String(addr.number));
  if (addr.complement) parts1.push(addr.complement);
  const line1 = parts1.filter(Boolean).join(', ');

  const parts2: string[] = [];
  if (addr.neighborhood) parts2.push(addr.neighborhood);
  const cityState = [addr.city, addr.state].filter(Boolean).join(' - ');
  if (cityState) parts2.push(cityState);
  const line2 = parts2.filter(Boolean).join(', ');

  const line3 = (addr as any).cep ? `CEP: ${(addr as any).cep}` : undefined;
  return { line1: line1 || 'Endereço', line2, line3 };
}

export function formatAddressSingleLine(addr?: BookingAddress | null): string {
  const { line1, line2 } = formatAddressCompact(addr);
  return [line1, line2].filter(Boolean).join(', ');
}

// Backward‑compatibility helpers used by success screen
export function formatAddressLine1(addr?: BookingAddress | null): string {
  return formatAddressCompact(addr).line1;
}

export function formatAddressLine2(addr?: BookingAddress | null): string {
  const { line2, line3 } = formatAddressCompact(addr);
  return [line2, line3].filter(Boolean).join(' ');
}
