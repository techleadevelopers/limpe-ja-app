
import { useEffect, useState } from 'react';

import { fetchApi } from '../services/api';

export type ProviderMetrics = {
  acceptanceRate?: number;
  averageResponseTime?: number;
  badges?: string[];
};

export function useProviderMetrics(providerId?: string | null) {
  const [metrics, setMetrics] = useState<ProviderMetrics>({});

  useEffect(() => {
    let active = true;
    if (!providerId) {
      setMetrics({});
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const response = await fetchApi<ProviderMetrics>(`/providers/${providerId}/metrics`, {
          headers: { 'x-silent': '1' },
        });
        if (active) {
          setMetrics(response ?? {});
        }
      } catch (error) {
        if (active) {
          setMetrics({});
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [providerId]);

  return metrics;
}
