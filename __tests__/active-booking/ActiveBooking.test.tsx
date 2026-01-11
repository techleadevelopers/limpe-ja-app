import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ActiveBookingDetails from '../[bookingId]';
import { BookingStatus } from 'types/backend/bookings';

jest.mock('types/backend/bookings', () => ({
  BookingStatus: {
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  },
}));

jest.mock('hooks/useAuth', () => ({
  useAuth: () => ({
    user: { providerDetails: { id: 'provider-1' } },
  }),
}));

const baseInsurance = { planId: 'ESSENCIAL', proofRequired: false };
const baseAddress = {
  cep: '01001000',
  street: 'Rua Teste',
  number: '100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  latitude: -23.55,
  longitude: -46.63,
};
const mockBooking = {
  id: 'booking-1',
  serviceName: 'Limpeza Premium',
  clientFullName: 'Cliente Teste',
  scheduledDate: '2025-01-01',
  scheduledTime: '10:00',
  status: BookingStatus.CONFIRMED,
  providerId: 'provider-1',
  durationMinutes: 120,
  allowedActions: ['START_SERVICE'],
  insurance: baseInsurance,
  proofs: [],
  address: baseAddress,
};

const startedBooking = {
  ...mockBooking,
    status: BookingStatus.STARTED,
  allowedActions: ['COMPLETE_SERVICE'],
};

const completedBooking = {
  ...mockBooking,
    status: BookingStatus.FINISHED,
  allowedActions: [],
};

const mockStart = jest.fn();
const mockComplete = jest.fn();
const mockManualStartRequest = jest.fn();
const expoRouter = require('expo-router');
const bookingService = require('../../../../services/bookingService');
const mockGetBookingDetails = jest.spyOn(bookingService, 'getBookingDetails');
const proofService = require('services/proofService');
const mockSubmitCheckinProof = proofService.submitCheckinProof as jest.MockedFunction<
  typeof proofService.submitCheckinProof
>;
const mockSubmitCheckoutProof = proofService.submitCheckoutProof as jest.MockedFunction<
  typeof proofService.submitCheckoutProof
>;

jest.mock('hooks/useProviderBookings', () => ({
  useProviderBookings: () => ({
    start: mockStart,
    complete: mockComplete,
    manualStartRequest: mockManualStartRequest,
  }),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: -23.55, longitude: -46.63, accuracy: 5 },
      timestamp: Date.now(),
    }),
  ),
  Accuracy: { BestForNavigation: 0 },
  PermissionStatus: { GRANTED: 'granted' },
}));

jest.mock('hooks/useBookingStatusMeta', () => ({
  useBookingStatusMeta: () => ({
    statusMap: {
      CONFIRMED: { labelProvider: 'Confirmado' },
      IN_PROGRESS: { labelProvider: 'Em andamento' },
      COMPLETED: { labelProvider: 'Concluído' },
    },
  }),
}));

jest.mock('services/notificationUIService', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showInfo: jest.fn(),
  showAppEvent: jest.fn(),
}));

jest.mock('services/pushService', () => ({
  registerDevicePushToken: jest.fn(),
  unregisterDevicePushToken: jest.fn(),
}));

jest.mock('services/proofService', () => ({
  submitCheckinProof: jest.fn(),
  submitCheckoutProof: jest.fn(),
}));

jest.mock('services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  registerClient: jest.fn(),
  registerProvider: jest.fn(),
  loadAuthData: jest.fn().mockResolvedValue({
    token: 'token',
    role: 'PROVIDER',
    user: { id: 'provider-1', role: 'PROVIDER' },
    id: 'provider-1',
  }),
  storeAuthData: jest.fn(),
}));

jest.mock('services/api', () => ({
  setUnauthorizedCallback: jest.fn(),
  resetRevocationCallbackFlag: jest.fn(),
}));

jest.mock('services/authEvents', () => ({
  AuthEventType: { SESSION_REFRESHED: 'SESSION_REFRESHED', SESSION_REVOKED: 'SESSION_REVOKED' },
  onAuthEvent: () => jest.fn(),
}));

jest.mock('services/userService', () => ({
  getMe: jest.fn().mockResolvedValue({ id: 'provider-1', role: 'PROVIDER' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSubmitCheckinProof.mockClear();
  mockSubmitCheckoutProof.mockClear();
  mockGetBookingDetails.mockResolvedValue(mockBooking);
  mockStart.mockResolvedValue(startedBooking);
  mockComplete.mockResolvedValue(completedBooking);
  mockManualStartRequest.mockResolvedValue({ message: 'Solicitação registrada' });
  (expoRouter.useLocalSearchParams as jest.Mock).mockReturnValue({ bookingId: 'booking-1' });
});

jest.setTimeout(20000);

describe('Active booking actions', () => {
  it('renders start button and transitions to complete when allowed actions change', async () => {
    render(<ActiveBookingDetails />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    await waitFor(() => expect(screen.getByLabelText('Iniciar Servico')).toBeTruthy());
    const startButton = screen.getByLabelText('Iniciar Servico');
    expect(startButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(startButton);
    await waitFor(() =>
      expect(mockStart).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({ lat: -23.55, lng: -46.63 }),
      ),
    );
    await waitFor(() => expect(screen.getByText('Servico em andamento')).toBeTruthy());

    await waitFor(() => expect(screen.getByLabelText('Concluir Servico')).toBeTruthy());
    const completeButton = screen.getByLabelText('Concluir Servico');
    expect(completeButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(completeButton);
    await waitFor(() => expect(mockComplete).toHaveBeenCalledWith('booking-1'));
    await waitFor(() => expect(screen.getByText('Concluido')).toBeTruthy());
  });

  it('desabilita start e complete até comprovantes obrigatórios serem enviados', async () => {
    const checkinProof = {
      id: 'proof-checkin',
      type: 'CHECKIN',
      photos: ['https://img.checkin'],
      videoUrl: null,
      hashes: null,
      timestamps: null,
      userId: 'provider-1',
      createdAt: new Date().toISOString(),
    };
    const checkoutProof = {
      id: 'proof-checkout',
      type: 'CHECKOUT',
      photos: ['https://img.checkout'],
      videoUrl: 'https://video.checkout',
      hashes: null,
      timestamps: null,
      userId: 'provider-1',
      createdAt: new Date().toISOString(),
    };
    const proofRequiredInsurance = { planId: 'PREMIUM', proofRequired: true };
    const bookingWithoutProof = {
      ...mockBooking,
      insurance: proofRequiredInsurance,
      proofs: [],
    };
    const bookingWithCheckin = {
      ...mockBooking,
      insurance: proofRequiredInsurance,
      proofs: [checkinProof],
      allowedActions: ['START_SERVICE'],
    };
    const bookingWithCheckout = {
      ...mockBooking,
      insurance: proofRequiredInsurance,
      proofs: [checkinProof, checkoutProof],
      status: BookingStatus.STARTED,
      allowedActions: ['COMPLETE_SERVICE'],
    };

    mockGetBookingDetails
      .mockResolvedValueOnce(bookingWithoutProof)
      .mockResolvedValueOnce(bookingWithCheckin)
      .mockResolvedValueOnce(bookingWithCheckout)
      .mockResolvedValue(bookingWithCheckout);
    mockSubmitCheckinProof.mockResolvedValue(checkinProof);
    mockSubmitCheckoutProof.mockResolvedValue(checkoutProof);

    render(<ActiveBookingDetails />);

    await waitFor(() => expect(mockGetBookingDetails).toHaveBeenCalledWith('booking-1'));
    const startButton = screen.getByLabelText('Iniciar Servico');
    expect(startButton.props.accessibilityState?.disabled).toBe(true);

    const checkinButton = await waitFor(() =>
      screen.getByLabelText('Enviar comprovante de check-in'),
    );
    fireEvent.press(checkinButton);
    await waitFor(() => expect(screen.getByTestId('proof-photos-input')).toBeTruthy());
    fireEvent.changeText(
      screen.getByTestId('proof-photos-input'),
      'https://example.com/checkin.jpg',
    );
    fireEvent.press(screen.getByTestId('proof-submit-button'));
    await waitFor(() =>
      expect(mockSubmitCheckinProof).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({ photos: ['https://example.com/checkin.jpg'] }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Iniciar Servico').props.accessibilityState?.disabled).toBe(
        false,
      ),
    );

    const completeButton = screen.getByLabelText('Concluir Servico');
    expect(completeButton.props.accessibilityState?.disabled).toBe(true);
    const checkoutButton = screen.getByLabelText('Enviar comprovante de checkout');
    fireEvent.press(checkoutButton);
    await waitFor(() => expect(screen.getByTestId('proof-photos-input')).toBeTruthy());
    fireEvent.changeText(
      screen.getByTestId('proof-photos-input'),
      'https://example.com/checkout.jpg',
    );
    fireEvent.changeText(
      screen.getByTestId('proof-video-input'),
      'https://example.com/checkout.mp4',
    );
    fireEvent.press(screen.getByTestId('proof-submit-button'));
    await waitFor(() =>
      expect(mockSubmitCheckoutProof).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({
          photos: ['https://example.com/checkout.jpg'],
          videoUrl: 'https://example.com/checkout.mp4',
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Concluir Servico').props.accessibilityState?.disabled).toBe(
        false,
      ),
    );
  });
});
