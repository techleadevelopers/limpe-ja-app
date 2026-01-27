import { MutableRefObject, useCallback, useReducer } from 'react';

import { normalizeProviderList } from '@/components/client/explore/home/providerAvailability';
import { getRecommendedProviders } from '@/services/providerService';
import { getServiceCategories, getUserProfile } from '@/services/clientService';
import { CityStateHint } from '@/utils/locationFilter';
import { ProviderDisplayInfo } from '@/types/backend/providers';
import { Service } from '@/types/backend/services';
import { UserProfile } from '@/types/backend/users';
import { FALLBACK_RECOMMENDATIONS } from '@app/client/explore/data/homeFallbacks';

export type ExploreFetchResult = {
  hasSuccessfulData: boolean;
  errors: string[];
  errorMessage: string | null;
};

interface UseExploreDataOptions {
  isMountedRef: MutableRefObject<boolean>;
  locationHintRef: MutableRefObject<CityStateHint>;
  searchRadiusKm: number;
  user: UserProfile | null;
  networkErrorMessage: string;
}

interface ExploreDataState {
  userProfile: UserProfile | null;
  serviceCategories: Service[];
  recommendations: ProviderDisplayInfo[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

type ExploreAction =
  | { type: 'FETCH_START'; isRefresh: boolean }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_SERVICE_CATEGORIES'; payload: Service[] }
  | { type: 'SET_RECOMMENDATIONS'; payload: ProviderDisplayInfo[] }
  | { type: 'SET_LOADING_DONE' }
  | { type: 'FETCH_COMPLETE'; payload: { error: string | null } };

const initialState: ExploreDataState = {
  userProfile: null,
  serviceCategories: [],
  recommendations: [],
  loading: true,
  refreshing: false,
  error: null,
};

const exploreReducer = (state: ExploreDataState, action: ExploreAction): ExploreDataState => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: action.isRefresh ? state.loading : true,
        refreshing: action.isRefresh,
        error: null,
      };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_SERVICE_CATEGORIES':
      return { ...state, serviceCategories: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_LOADING_DONE':
      return { ...state, loading: false };
    case 'FETCH_COMPLETE':
      return {
        ...state,
        loading: false,
        refreshing: false,
        error: action.payload.error,
      };
    default:
      return state;
  }
};

export const useExploreData = ({
  isMountedRef,
  locationHintRef,
  searchRadiusKm,
  user,
  networkErrorMessage,
}: UseExploreDataOptions) => {
  const [state, dispatch] = useReducer(exploreReducer, initialState);

  const safeDispatch = useCallback(
    (action: ExploreAction) => {
      if (isMountedRef.current) {
        dispatch(action);
      }
    },
    [dispatch, isMountedRef]
  );

  const fetchData = useCallback(
    async ({ isRefresh = false } = {}): Promise<ExploreFetchResult> => {
      if (!isMountedRef.current) {
        return { hasSuccessfulData: false, errors: [], errorMessage: null };
      }

      safeDispatch({ type: 'FETCH_START', isRefresh });

      const hint = locationHintRef.current;
      const collectedErrors: string[] = [];
      let hasSuccessfulData = false;

      const runAndTrack = async <T,>(
        label: string,
        runner: () => Promise<T>,
        onSuccess: (value: T) => Promise<void> | void,
        fallbackMessage: string
      ) => {
        try {
          const result = await runner();
          if (!isMountedRef.current) {
            return;
          }
          await onSuccess(result);
          hasSuccessfulData = true;
        } catch {
          if (label === 'recommended providers') {
            safeDispatch({
              type: 'SET_RECOMMENDATIONS',
              payload: normalizeProviderList(FALLBACK_RECOMMENDATIONS),
            });
          }
          collectedErrors.push(fallbackMessage);
        }
      };

      const tasks: Promise<void>[] = [];
      const primaryTasks: Promise<void>[] = [];

      tasks.push(
        runAndTrack<UserProfile>(
          'user profile',
          () => getUserProfile(),
          (profile) => {
            safeDispatch({ type: 'SET_USER_PROFILE', payload: profile });
          },
          'Erro ao carregar perfil'
        )
      );

      tasks.push(
        runAndTrack<Service[]>(
          'service categories',
          () => getServiceCategories(),
          (data) => {
            safeDispatch({ type: 'SET_SERVICE_CATEGORIES', payload: data });
          },
          'Erro ao carregar categorias'
        )
      );

      const recommendedTask = runAndTrack<ProviderDisplayInfo[]>(
        'recommended providers',
        async () => {
          const apiResponse = await getRecommendedProviders(
            hint.latitude != null && hint.longitude != null
              ? { latitude: hint.latitude, longitude: hint.longitude, radius: searchRadiusKm }
              : ({} as any)
          );

          return (() => {
            const list = Array.isArray(apiResponse) ? apiResponse : [];
            const seen = new Set<string>();
            const merged = [...list, ...FALLBACK_RECOMMENDATIONS].filter((provider) => {
              const id = provider && typeof provider.id === 'string' ? provider.id : '';
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            });

            const currentProviderId =
              (user as any)?.providerDetails?.id || (user as any)?.providerDetails?.providerId;
            const currentProviderEmail = user?.email;

            let idx = -1;
            if (currentProviderId || currentProviderEmail) {
              idx = merged.findIndex((provider) => {
                if (!provider) return false;
                if (currentProviderId && provider.id === currentProviderId) return true;
                if (currentProviderEmail && provider.email === currentProviderEmail) return true;
                return false;
              });
            } else {
              idx = merged.findIndex(
                (provider) =>
                  provider &&
                  typeof provider.fullName === 'string' &&
                  /joana/i.test(provider.fullName)
              );
            }

            if (idx > 0) {
              const [first] = merged.splice(idx, 1);
              merged.unshift(first);
            }

            return merged;
          })();
        },
        (data) => {
          safeDispatch({
            type: 'SET_RECOMMENDATIONS',
            payload: normalizeProviderList(data),
          });
        },
        'Erro ao carregar recomendacoes'
      );

      tasks.push(recommendedTask);
      primaryTasks.push(recommendedTask);

      await Promise.race([
        Promise.allSettled(primaryTasks),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      safeDispatch({ type: 'SET_LOADING_DONE' });

      await Promise.allSettled(tasks);

      const finalError = hasSuccessfulData
        ? null
        : collectedErrors.length > 0
        ? collectedErrors[0]
        : networkErrorMessage || null;

      safeDispatch({ type: 'FETCH_COMPLETE', payload: { error: finalError } });

      return {
        hasSuccessfulData,
        errors: collectedErrors,
        errorMessage: finalError,
      };
    },
    [locationHintRef, networkErrorMessage, safeDispatch, searchRadiusKm, user, isMountedRef]
  );

  return {
    ...state,
    fetchData,
  };
};
