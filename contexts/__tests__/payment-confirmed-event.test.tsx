import { act } from '@testing-library/react-native';
import { appQueryClient } from '../../components/provider/query-client-provider';
import { fetchPaymentIntent } from '../../services/paymentService';
import { ackNotification } from '../../services/notificationService';
import {
  createPaymentConfirmedHandler,
  runPaymentPostActions,
} from '../AuthContext';

jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  registerClient: jest.fn(),
  registerProvider: jest.fn(),
  loadAuthData: jest.fn().mockResolvedValue({
    token: 'token',
    user: { id: 'user-1', role: 'CLIENT' },
    role: 'CLIENT',
    id: 'user-1',
  }),
  storeAuthData: jest.fn(),
}));

jest.mock('../../services/pushService', () => ({
  registerDevicePushToken: jest.fn().mockResolvedValue(undefined),
  unregisterDevicePushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/api', () => ({
  setUnauthorizedCallback: jest.fn(),
  resetRevocationCallbackFlag: jest.fn(),
}));

jest.mock('../../services/authEvents', () => ({
  AuthEventType: {
    SESSION_REFRESHED: 'SESSION_REFRESHED',
    SESSION_REVOKED: 'SESSION_REVOKED',
  },
  onAuthEvent: jest.fn().mockReturnValue(() => undefined),
}));

jest.mock('../../services/userService', () => ({
  getMe: jest.fn().mockResolvedValue({ id: 'user-1', role: 'CLIENT' }),
}));

jest.mock('../../components/provider/query-client-provider', () => ({
  appQueryClient: {
    invalidateQueries: jest.fn(),
  },
}));

jest.mock('../../services/paymentService', () => ({
  fetchPaymentIntent: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/notificationService', () => ({
  ackNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('Payment confirmed helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the overlay when a payment event arrives and hides after timeout', () => {
    const setVisible = jest.fn();
    const postActions = jest.fn();
    const { handler, cleanup } = createPaymentConfirmedHandler(
      setVisible,
      postActions,
    );

    handler({ bookingId: 'b-1' });
    expect(setVisible).toHaveBeenCalledWith(true);
    expect(postActions).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'b-1' }),
    );

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(setVisible).toHaveBeenLastCalledWith(false);

    cleanup();
  });

  it('runs notification ack, booking invalidation and payment refetch', () => {
    runPaymentPostActions({
      booking: { id: 321 },
      notificationId: 'notif-321',
    });

    expect(ackNotification).toHaveBeenCalledWith('notif-321');
    expect(appQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['booking', '321'],
    });
    expect(fetchPaymentIntent).toHaveBeenCalledWith('321');
  });
});
