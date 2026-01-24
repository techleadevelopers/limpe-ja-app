import { useCallback, useEffect, useRef, useState } from 'react';
import { LocationObjectCoords } from 'expo-location';
import { ProviderDisplayInfo } from '../types/backend/providers';
import { getCurrentPosition } from '../services/locationService';
import { searchProvidersWithLocation } from '../services/clientService';

export interface LocationHint {
  latitude?: number;
  longitude?: number;
}

interface UseLocationBasedProvidersOptions {
  radiusKm: number;
  query?: string;
  fallbackLocation?: LocationHint;
}

interface UseLocationBasedProvidersResult {
  providers: ProviderDisplayInfo[];
  location: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLocationBasedProviders({
  radiusKm,
  query,
  fallbackLocation,
}: UseLocationBasedProvidersOptions): UseLocationBasedProvidersResult {
  const [providers, setProviders] = useState<ProviderDisplayInfo[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  const loadProviders = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      let coords: LocationObjectCoords | null = await getCurrentPosition();
      if (!coords && fallbackLocation?.latitude != null && fallbackLocation?.longitude != null) {
        coords = {
          latitude: fallbackLocation.latitude,
          longitude: fallbackLocation.longitude,
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: null as any,
          heading: null as any,
          speed: null as any,
        };
      }
      if (!coords) {
        throw new Error('Não foi possível obter sua localização.');
      }

      const result = await searchProvidersWithLocation(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radiusKm,
          query,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted) {
        return;
      }

      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setProviders(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Não foi possível carregar provedores próximos.';
      setError(message);
      setProviders([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [fallbackLocation?.latitude, fallbackLocation?.longitude, query, radiusKm]);

  useEffect(() => {
    loadProviders();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadProviders, trigger]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    providers,
    location,
    isLoading,
    error,
    refresh,
  };
}
