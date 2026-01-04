
import { useEffect, useState } from 'react';

import { fetchApi } from '../services/api';

export type ProviderMetrics = {
  acceptanceRate?: number;
  averageResponseTime?: number;
  badges?: string[];
};

const PROVIDER_METRICS_TTL_MS = 60 * 1000;
const PROVIDER_METRICS_COOLDOWN_MS = 20 * 1000;
const PROVIDER_METRICS_CONCURRENCY = 2;

const FALLBACK_METRICS: ProviderMetrics = {};

type ProviderMetricsCacheEntry = {
  data: ProviderMetrics;
  expiresAt: number;
  cooldownUntil: number;
  inflightPromise: Promise<ProviderMetrics> | null;
};

const providerMetricsCache = new Map<string, ProviderMetricsCacheEntry>();
const providerMetricsQueue: Array<() => void> = [];
let providerMetricsActiveFetches = 0;

const runNextProviderMetricsTask = () => {
  if (providerMetricsActiveFetches >= PROVIDER_METRICS_CONCURRENCY) {
    return;
  }
  const next = providerMetricsQueue.shift();
  if (!next) {
    return;
  }
  providerMetricsActiveFetches += 1;
  next();
};

const scheduleProviderMetricsTask = <T,>(task: () => Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    const runner = () => {
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          providerMetricsActiveFetches -= 1;
          runNextProviderMetricsTask();
        });
    };

    providerMetricsQueue.push(runner);
    runNextProviderMetricsTask();
  });

const getProviderMetricsCacheEntry = (providerId: string): ProviderMetricsCacheEntry => {
  const existing = providerMetricsCache.get(providerId);
  if (existing) {
    return existing;
  }

  const entry: ProviderMetricsCacheEntry = {
    data: FALLBACK_METRICS,
    expiresAt: 0,
    cooldownUntil: 0,
    inflightPromise: null,
  };
  providerMetricsCache.set(providerId, entry);
  return entry;
};

const fetchProviderMetrics = async (providerId: string) => {
  const entry = getProviderMetricsCacheEntry(providerId);
  const now = Date.now();

  if (entry.cooldownUntil > now) {
    return entry.data;
  }

  if (entry.data !== FALLBACK_METRICS && entry.expiresAt > now) {
    return entry.data;
  }

  if (entry.inflightPromise) {
    return entry.inflightPromise;
  }

  const networkPromise = scheduleProviderMetricsTask(() =>
    fetchApi<ProviderMetrics>(`/providers/${providerId}/metrics`, {
      headers: { 'x-silent': '1' },
    }),
  )
    .then((response) => {
      const normalized = response ?? FALLBACK_METRICS;
      entry.data = normalized;
      entry.expiresAt = Date.now() + PROVIDER_METRICS_TTL_MS;
      entry.cooldownUntil = 0;
      return normalized;
    })
    .catch((error: any) => {
      if (error?.response?.status === 429) {
        entry.cooldownUntil = Date.now() + PROVIDER_METRICS_COOLDOWN_MS;
      }
      throw error;
    })
    .finally(() => {
      entry.inflightPromise = null;
    });

  entry.inflightPromise = networkPromise;
  return networkPromise;
};

export function useProviderMetrics(providerId?: string | null) {
  const [metrics, setMetrics] = useState<ProviderMetrics>(FALLBACK_METRICS);

  useEffect(() => {
    let active = true;
    if (!providerId) {
      setMetrics(FALLBACK_METRICS);
      return () => {
        active = false;
      };
    }

    const entry = getProviderMetricsCacheEntry(providerId);
    setMetrics(entry.data);

    (async () => {
      try {
        const latest = await fetchProviderMetrics(providerId);
        if (!active) {
          return;
        }
        setMetrics(latest);
      } catch {
        if (!active) {
          return;
        }
        setMetrics(entry.data);
      }
    })();

    return () => {
      active = false;
    };
  }, [providerId]);

  return metrics;
}
