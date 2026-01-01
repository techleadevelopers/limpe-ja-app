import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { bookingFixture } from '../../../__tests__/fixtures/booking.fixture';
import { createPaymentIntent } from '../../../__tests__/fixtures/payment.fixture';
import * as bookingService from '../../../services/bookingService';
import * as clientService from '../../../services/clientService';
import * as loyaltyService from '../../../services/loyaltyService';
import * as paymentService from '../../../services/paymentService';
import * as providerService from '../../../services/providerService';
import BookingSuccessScreen from '../../app/client/bookings/success';
import { PaymentIntentStatus } from '../../types/backend/payments';
import { renderWithProviders } from '../helpers/renderWithProviders';

jest.mock('../../../services/bookingService', () => ({
  getBookingDetails: jest.fn(),
}));

jest.mock('../../../services/providerService', () => ({
  getProviderDetails: jest.fn(),
}));

jest.mock('../../../services/loyaltyService', () => ({
  getMyLoyaltyBalance: jest.fn(),
}));

jest.mock('../../../services/clientService', () => ({
  getOffers: jest.fn(),
}));

jest.mock('../../../services/paymentService', () => ({
  fetchPaymentIntent: jest.fn(),
  createPixCharge: jest.fn(),
}));

jest.mock('../../../services/pushService', () => ({
  registerDevicePushToken: jest.fn().mockResolvedValue(null),
  unregisterDevicePushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'client-1', token: 'client-token' },
    isAuthenticated: true,
  })),
}));

jest.setTimeout(20000);

const mockedGetBookingDetails = jest.mocked(bookingService.getBookingDetails);
const mockedFetchPaymentIntent = jest.mocked(paymentService.fetchPaymentIntent);
const mockedGetProviderDetails = jest.mocked(providerService.getProviderDetails);
const mockedGetMyLoyaltyBalance = jest.mocked(loyaltyService.getMyLoyaltyBalance);
const mockedGetOffers = jest.mocked(clientService.getOffers);
const useLocalSearchParamsMock = jest.mocked(useLocalSearchParams);
const mockRouter = router as jest.Mocked<typeof router>;

describe('BookingSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalSearchParamsMock.mockReturnValue({
      bookingId: 'booking-1',
      paymentMethod: 'PIX',
    });
    mockedGetProviderDetails.mockResolvedValue({ id: 'provider-1' } as any);
    mockedGetMyLoyaltyBalance.mockResolvedValue({
      currentPoints: 0,
      nextReward: null,
    } as any);
    mockedGetOffers.mockResolvedValue([]);
    mockRouter.replace.mockClear();
  });

  it('shows success content when payment is already confirmed', async () => {
    mockedGetBookingDetails.mockResolvedValue(bookingFixture);
    mockedFetchPaymentIntent.mockResolvedValue(
      createPaymentIntent({
        status: PaymentIntentStatus.PAID,
        id: 'pi-paid',
      }),
    );
    const { findByTestId, getByText } = renderWithProviders(<BookingSuccessScreen />);

    await waitFor(() => expect(mockedGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    await findByTestId('booking-success-primary-cta');

    const detailsButton = await waitFor(() => getByText('Ver detalhes'));
    act(() => {
      fireEvent.press(detailsButton);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/client/bookings?highlightNew=true');
  });

  it('renders the insurance summary when the booking includes insurance', async () => {
    mockedFetchPaymentIntent.mockResolvedValue(
      createPaymentIntent({
        status: PaymentIntentStatus.PAID,
        id: 'pi-paid',
      }),
    );
    const { findByTestId, findByText } = renderWithProviders(<BookingSuccessScreen />);

    await waitFor(() => expect(mockedGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    await findByTestId('insurance-summary');
    expect(await findByText('Proteção Residencial')).toBeTruthy();
    expect(await findByText('PREMIUM')).toBeTruthy();
    expect(await findByText(/59,90/)).toBeTruthy();
  });

  it('keeps polling when payment intent remains pending', async () => {
    const intervalSpy = jest
      .spyOn(global, 'setInterval')
      .mockImplementation((fn: () => void) => {
        fn();
        return 0 as any;
      });
    mockedGetBookingDetails.mockResolvedValue(bookingFixture);
    mockedFetchPaymentIntent.mockResolvedValue(
      createPaymentIntent({
        status: PaymentIntentStatus.PENDING,
      }),
    );

    const { queryByTestId } = renderWithProviders(<BookingSuccessScreen />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(queryByTestId('booking-success-primary-cta')).toBeNull();
    expect(mockedFetchPaymentIntent.mock.calls.length).toBeGreaterThan(1);
    intervalSpy.mockRestore();
  });

  it('shows error state when booking details fail to load', async () => {
    mockedGetBookingDetails.mockRejectedValue(new Error('falha no servidor'));
    const { getByText } = renderWithProviders(<BookingSuccessScreen />);

    await waitFor(() => expect(getByText(/Tentar novamente/i)).toBeTruthy());
    expect(mockedFetchPaymentIntent).not.toHaveBeenCalled();
  });
});
