// app/hooks/useProviderServices.ts
import { useEffect, useState } from 'react';
import { getProviderDetails } from '@/services/providerService';
import type { ProviderServiceOffering } from '@/types/backend/provider-service';

/**
 * Hook para buscar os serviços de um provedor.
 * - Tolera price === null/undefined (retorna null).
 * - Evita state update após unmount.
 */
type OfferingSafe = ProviderServiceOffering & { price: number | null };

export function useProviderServices(providerId?: string) {
  const [services, setServices] = useState<OfferingSafe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!providerId) return;

    (async () => {
      try {
        setLoading(true);
        const provider = await getProviderDetails(providerId);
        const list = (provider?.providerServices ?? []).map((s: any) => ({
          ...s,
          price: typeof s?.price === 'number' ? s.price : null,
        }));
        if (mounted) setServices(list);
      } catch (e) {
        if (mounted) setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [providerId]);

  return { services, loading };
}

export default useProviderServices;
