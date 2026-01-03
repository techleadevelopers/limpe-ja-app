import { useCallback, useEffect, useRef, useState } from 'react';
import { captureException } from '../services/observability';

type AsyncFactory<T> = (signal: AbortSignal) => Promise<T>;

interface UseCancelableLoadableOptions<T> {
  factory: AsyncFactory<T>;
  timeoutMs?: number;
  dependencies?: any[];
  emptyPredicate?: (value: T) => boolean;
  initialData?: T | null;
}

interface UseCancelableLoadableResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isEmpty: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
}

const defaultIsEmpty = <T>(value: T | null): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  if (typeof value === 'string') return value.length === 0;
  return false;
};

export function useCancelableLoadable<T>(
  options: UseCancelableLoadableOptions<T>
): UseCancelableLoadableResult<T> {
  const {
    factory,
    timeoutMs = 10000,
    dependencies = [],
    emptyPredicate = defaultIsEmpty,
    initialData = null,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(initialData === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(() => emptyPredicate(initialData));

  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRequestIdRef = useRef(0);
  const timedOutRequestRef = useRef<number | null>(null);

  const runLoad = useCallback(
    async ({ isRefresh = false } = {}) => {
      const requestId = currentRequestIdRef.current + 1;
      currentRequestIdRef.current = requestId;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timedOutRequestRef.current = null;

      if (timeoutMs > 0) {
        timeoutRef.current = setTimeout(() => {
          timedOutRequestRef.current = requestId;
          controller.abort();
        }, timeoutMs);
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await factory(controller.signal);
        if (currentRequestIdRef.current !== requestId) return;
        setData(result);
        setIsEmpty(emptyPredicate(result));
      } catch (err: unknown) {
        if (currentRequestIdRef.current !== requestId) return;
        const isTimeout = timedOutRequestRef.current === requestId;
        const message = isTimeout
          ? 'A requisição demorou demais. Verifique a internet e tente novamente.'
          : (err instanceof Error ? err.message : String(err));
        setError(message);
        captureException(err ?? new Error(message), { tags: { source: 'useCancelableLoadable' } });
      } finally {
        const isLatestRequest = currentRequestIdRef.current === requestId;
        if (isLatestRequest) {
          if (!isRefresh) {
            setLoading(false);
          }
          if (isRefresh) {
            setRefreshing(false);
          }
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    [factory, timeoutMs, emptyPredicate, ...dependencies]
  );

  useEffect(() => {
    runLoad();
    return () => {
      controllerRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [runLoad, ...dependencies]);

  const refresh = useCallback(() => runLoad({ isRefresh: true }), [runLoad]);
  const reload = useCallback(() => runLoad(), [runLoad]);
  const retry = useCallback(async () => {
    await runLoad();
  }, [runLoad]);
  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setLoading(false);
    setRefreshing(false);
  }, []);

  return {
    data,
    loading,
    refreshing,
    error,
    isEmpty,
    reload,
    refresh,
    retry,
    cancel,
  };
}
