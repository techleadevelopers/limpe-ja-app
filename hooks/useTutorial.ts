// hooks/useTutorial.ts
// Hook leve e reutilizável para controlar exibição de tutoriais contextuais.
// Persistência via AsyncStorage, compatível com o plano de tutoriais do LimpeJá.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TutorialId =
  | 'explore_first_time'
  | 'provider_rating_tip'
  | 'provider_schedule_tip'
  | 'booking_slots_tip'
  | 'booking_details_actions'
  | 'messages_intro'
  | 'wallet_intro'
  | 'coupons_intro'
  | 'missions_intro'
  | (string & {});

const STORAGE_PREFIX = '@LimpeJa:TutorialSeen:';

type UseTutorialState = {
  hasSeen: boolean;
  isReady: boolean;
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  markSeen: () => Promise<void>;
};

export function useTutorial(stepId: TutorialId): UseTutorialState {
  const [hasSeen, setHasSeen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const key = `${STORAGE_PREFIX}${stepId}`;
        const value = await AsyncStorage.getItem(key);
        if (!cancelled) {
          setHasSeen(value === '1');
        }
      } catch {
        // falha silenciosa — tutorial continua funcionando apenas em memória
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stepId]);

  const show = useCallback(() => {
    // Só exibe se o estado já foi carregado do AsyncStorage
    if (isReady && !hasSeen) {
      setIsVisible(true);
    }
  }, [hasSeen, isReady]);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const markSeen = useCallback(async () => {
    const key = `${STORAGE_PREFIX}${stepId}`;
    try {
      await AsyncStorage.setItem(key, '1');
    } catch {
      // se falhar, pelo menos atualiza o estado local
    }
    setHasSeen(true);
    setIsVisible(false);
  }, [stepId]);

  return {
    hasSeen,
    isReady,
    isVisible,
    show,
    hide,
    markSeen,
  };
}

