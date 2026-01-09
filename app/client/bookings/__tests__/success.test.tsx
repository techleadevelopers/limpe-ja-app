import { PaymentIntentStatus } from '../../../types/backend/payments';
import { shouldStopPollingForStatus } from '../success';

describe('shouldStopPollingForStatus', () => {
  it('returns true when the payment intent is PAID', () => {
    expect(shouldStopPollingForStatus(PaymentIntentStatus.PAID)).toBe(true);
  });

  it('returns false for non-paid statuses', () => {
    expect(shouldStopPollingForStatus(PaymentIntentStatus.PENDING)).toBe(false);
    expect(shouldStopPollingForStatus(null)).toBe(false);
    expect(shouldStopPollingForStatus(undefined)).toBe(false);
  });
});
