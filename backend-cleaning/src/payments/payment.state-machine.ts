export type PaymentIntentState =
  | 'CREATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

const PAYMENT_TRANSITIONS: Record<PaymentIntentState, PaymentIntentState[]> = {
  CREATED: ['PENDING'],
  PENDING: ['CONFIRMED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: [],
  FAILED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export const canTransition = (
  from: PaymentIntentState,
  to: PaymentIntentState,
): boolean => {
  if (from === to) return true;
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
};

export const assertTransition = (
  from: PaymentIntentState,
  to: PaymentIntentState,
): void => {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition ${from} -> ${to}`);
  }
};

export const applyTransition = (
  current: PaymentIntentState,
  desired: PaymentIntentState,
): PaymentIntentState => {
  if (current === desired) {
    return current;
  }
  assertTransition(current, desired);
  return desired;
};
