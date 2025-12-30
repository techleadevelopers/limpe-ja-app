import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import BookingDetailsScreen from '../[bookingId]';
import {
  cancelBooking,
  getBookingDetails,
} from '../../../../services/bookingService';
import { getProviderDetails } from '../../../../services/providerService';
import { useBookingStatusMeta } from '../../../../hooks/useBookingStatusMeta';

jest.setTimeout(20000);

jest.mock('../../../../components/booking/ProviderServicesInline', () => () => null);
jest.mock('../../../../components/ui/TutorialOverlay', () => () => null);
jest.mock('../../../../hooks/useProviderServices', () => ({
  useProviderServices: () => ({
    services: [],
  }),
}));
jest.mock('../../../../hooks/useTutorial', () => ({
  useTutorial: () => ({
    isVisible: false,
    isReady: true,
    hasSeen: true,
    show: jest.fn(),
    markSeen: jest.fn(),
  }),
}));
jest.mock('../../../../hooks/useBookingStatusMeta', () => ({
  useBookingStatusMeta: jest.fn(),
}));
jest.mock('../../../../services/bookingService', () => ({
  getBookingDetails: jest.fn(),
  cancelBooking: jest.fn(),
}));
jest.mock('../../../../services/providerService', () => ({
  getProviderDetails: jest.fn(),
}));
jest.mock('../../../../utils/normalize', () => ({
  normalizeBooking: (booking: any) => booking,
}));
jest.mock('../../../../types/backend/bookings', () => ({
  BookingStatus: {
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

const mockGetBookingDetails = getBookingDetails as jest.MockedFunction<typeof getBookingDetails>;
const mockCancelBooking = cancelBooking as jest.MockedFunction<typeof cancelBooking>;
const mockGetProviderDetails = getProviderDetails as jest.MockedFunction<typeof getProviderDetails>;
const mockUseBookingStatusMeta = useBookingStatusMeta as jest.MockedFunction<
  typeof useBookingStatusMeta
>;
const router = require('expo-router');
const { BookingStatus } = require('../../../../types/backend/bookings');

type BookingStatusValue = typeof BookingStatus[keyof typeof BookingStatus];

const baseBooking = {
  id: 'booking-1',
  providerId: 'provider-1',
  providerFullName: 'Ana Silva',
  providerAvatarUrl: null,
  clientId: 'client-1',
  serviceName: 'Limpeza final',
  scheduledDate: '2025-12-05',
  scheduledTime: '10:00',
  totalPrice: 120,
  durationMinutes: 90,
  status: BookingStatus.CONFIRMED as BookingStatusValue,
  address: {
    street: 'Rua A',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01000-000',
  },
  notes: '',
  allowedActions: [],
  isReviewed: false,
  reviewId: null,
};

const providerData = { id: 'provider-1', fullName: 'Ana Silva' };

beforeEach(() => {
  jest.clearAllMocks();
  router.useLocalSearchParams.mockReturnValue({ bookingId: 'booking-1' });
  mockGetBookingDetails.mockResolvedValue(baseBooking);
  mockGetProviderDetails.mockResolvedValue(providerData);
  mockUseBookingStatusMeta.mockReturnValue({ statusMap: {} });
  mockCancelBooking.mockResolvedValue({ ...baseBooking, status: BookingStatus.CANCELLED });
});

describe('BookingDetailsScreen status resilience', () => {
  it('shows mapped label when meta contains a client override', async () => {
    mockUseBookingStatusMeta.mockReturnValue({
      statusMap: {
        [BookingStatus.CONFIRMED]: { labelClient: 'Confirmado pelo cliente' },
      },
    });

    const { getByText } = render(<BookingDetailsScreen />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    expect(getByText('Confirmado pelo cliente')).toBeTruthy();
  });

  it('falls back to "Em atualização" when status is unknown and not mapped', async () => {
  const unknownBooking = {
    ...baseBooking,
    status: 'UNKNOWN_STATUS' as BookingStatusValue,
  };
    mockGetBookingDetails.mockResolvedValueOnce(unknownBooking);
    mockUseBookingStatusMeta.mockReturnValue({ statusMap: {} });

    const { getByText } = render(<BookingDetailsScreen />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    expect(getByText('Em atualização')).toBeTruthy();
  });

  it('renders insurance summary when the booking includes an insurance snapshot', async () => {
    const bookingWithInsurance = {
      ...baseBooking,
      insurance: {
        planId: 'TOTAL',
        priceCents: 9990,
        coverageCents: 1000000,
        deductibleCents: 50000,
        riskMultiplierBps: 1000,
        proofRequired: true,
        createdAt: '2025-12-05T10:00:00.000Z',
      },
    };
    mockGetBookingDetails.mockResolvedValueOnce(bookingWithInsurance);

    const { findByText } = render(<BookingDetailsScreen />);

    await findByText('Proteção Residencial');
    expect(await findByText('TOTAL')).toBeTruthy();
    expect(await findByText(/99,90/)).toBeTruthy();
  });
});

describe('BookingDetailsScreen cancel flow', () => {
  it('renders cancel button when allowedActions includes CANCEL and calls cancelBooking', async () => {
    mockGetBookingDetails.mockResolvedValueOnce({
      ...baseBooking,
      allowedActions: ['CANCEL'],
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons = []) => {
      buttons[1]?.onPress?.();
    });

    const { getByText } = render(<BookingDetailsScreen />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalled());
    const cancelButton = getByText('Cancelar agendamento');
    await act(async () => {
      fireEvent.press(cancelButton);
    });

    await waitFor(() => expect(mockCancelBooking).toHaveBeenCalledWith('booking-1'));
    alertSpy.mockRestore();
  });

  it('does not render cancel button when allowedActions omits CANCEL', async () => {
    mockGetBookingDetails.mockResolvedValueOnce({ ...baseBooking, allowedActions: [] });
    const { queryByText } = render(<BookingDetailsScreen />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalled());
    expect(queryByText('Cancelar agendamento')).toBeNull();
  });
});
