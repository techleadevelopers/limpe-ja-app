import axios from 'axios';
import { api } from './api';
import { createLocalConsole } from './logging';

const console = createLocalConsole();

export type ModerationSource = 'CHAT' | 'DISPUTE' | 'OTHER';

export interface ContactLeakEvaluationPayload {
  userId: string;
  content: string;
  source: ModerationSource;
  chatId?: string;
  bookingId?: string;
  disputeId?: string;
}

export interface ContactLeakEvaluationResult {
  enforcement: 'SANITIZED' | 'BLOCKED';
  type: string;
}

const CONTACT_LEAK_ENDPOINT = '/policies/contact-leak/evaluate';

export const moderationService = {
  async evaluateContactLeak(
    payload: ContactLeakEvaluationPayload,
  ): Promise<ContactLeakEvaluationResult | null> {
    try {
      const response = await api.post<ContactLeakEvaluationResult>(
        CONTACT_LEAK_ENDPOINT,
        payload,
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        if (status === 404 || status === 405 || status === 501) {
          return null;
        }
      }
      console.warn(
        '[moderationService] Falha ao avaliar política de contato:',
        error.response?.data || error.message,
      );
      return null;
    }
  },
};
