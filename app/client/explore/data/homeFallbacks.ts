import { ProviderDisplayInfo } from '@/types/backend/providers';
import { Service } from '@/types/backend/services';

// Fallback local: garante render do RecomendacaoCard mesmo se a API falhar
export const FALLBACK_RECOMMENDATIONS: ProviderDisplayInfo[] = [];

export const FALLBACK_CATEGORIES: Service[] = [
  { id: 'residential-basic', name: 'Casa', icon: 'residencial.png' } as Service,
  { id: 'office-standard', name: 'Empresa', icon: 'comercial.png' } as Service,
  { id: 'after-build', name: 'Obras', icon: 'obra.png' } as Service,
  { id: 'windows', name: 'Vidros', icon: 'vidro.png' } as Service,
  { id: 'upholstery', name: 'Estofados', icon: 'estofados.png' } as Service,
  { id: 'office-clean', name: 'Escritório', icon: 'escritorio.png' } as Service,
];
