// utils/address.ts

export interface Address {
  street?: string;
  number?: string | number;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

/**
 * Formata o endereço no padrão exibido no HeaderSuperior.
 * Remove separadores extras se algum campo estiver ausente.
 */
export function formatUserAddress(address?: Address): string {
  if (!address) return 'Endereço não disponível';

  const parts = [
    address.street && address.number
      ? `${address.street}, ${address.number}`
      : address.street || '',
    address.neighborhood || '',
    [address.city, address.state].filter(Boolean).join(' ')
  ];

  // Remove partes vazias e junta com " - "
  const formatted = parts
    .filter(Boolean)
    .join(' - ')
    .trim();

  return formatted || 'Endereço não disponível';
}

/**
 * Formata a primeira linha do endereço (rua e número)
 */
export function formatAddressLine1(address?: Address): string {
  if (!address) return '';
  return [address.street, address.number].filter(Boolean).join(', ');
}

/**
 * Formata a segunda linha do endereço (bairro, cidade/estado, CEP)
 */
export function formatAddressLine2(address?: Address): string {
  if (!address) return '';
  const parts = [
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join('/'),
    address.cep ? `CEP: ${address.cep}` : ''
  ];
  return parts.filter(Boolean).join(' - ');
}
