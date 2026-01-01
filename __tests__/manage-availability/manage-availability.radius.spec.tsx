import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import ManageAvailabilityScreen from '../../schedule/manage-availability';
import { getMyProviderAvailability, updateMyProviderAvailability } from '../../../../services/providerService';
import { getBookingsForUser } from '../../../../services/bookingService';
import { getProviderSettings, saveProviderSettings } from '../../../../services/providerSettingsService';
import { getPricingConfig } from '../../../../services/configService';
import { useAuth } from '../../../../hooks/useAuth';
import { useLocalSearchParams } from 'expo-router';

jest.mock('../../../../types/backend/bookings', () => ({
  BookingStatus: {
    CONFIRMED: 'CONFIRMED',
  },
}));
jest.mock('../../../../types/backend/providers', () => ({
  ProviderAvailability: jest.fn(),
  UpdateAvailabilityData: jest.fn(),
}));

jest.mock('../../../../services/providerService', () => ({
  getMyProviderAvailability: jest.fn(),
  updateMyProviderAvailability: jest.fn(),
}));
jest.mock('../../../../services/bookingService', () => ({
  getBookingsForUser: jest.fn(),
}));
jest.mock('../../../../services/providerSettingsService', () => ({
  getProviderSettings: jest.fn(),
  saveProviderSettings: jest.fn(),
}));
jest.mock('../../../../services/configService', () => ({
  getPricingConfig: jest.fn(),
}));
jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockGetMyProviderAvailability = getMyProviderAvailability as jest.MockedFunction<typeof getMyProviderAvailability>;
const mockUpdateMyProviderAvailability = updateMyProviderAvailability as jest.MockedFunction<typeof updateMyProviderAvailability>;
const mockGetBookingsForUser = getBookingsForUser as jest.MockedFunction<typeof getBookingsForUser>;
const mockGetProviderSettings = getProviderSettings as jest.MockedFunction<typeof getProviderSettings>;
const mockSaveProviderSettings = saveProviderSettings as jest.MockedFunction<typeof saveProviderSettings>;
const mockGetPricingConfig = getPricingConfig as jest.MockedFunction<typeof getPricingConfig>;
let todayDow: number;

const addMinutes = (slot: string, minutes: number) => {
  const [hour, minute] = slot.split(':').map((value) => Number(value));
  const total = hour * 60 + minute + minutes;
  const endHour = Math.floor(total / 60);
  const endMinute = total % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
};

describe('ManageAvailabilityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todayDow = new Date().getDay();
    mockUseAuth.mockReturnValue({
      user: { id: 'provider-123', token: 'token-123', role: 'PROVIDER' },
      isLoading: false,
      isAuthenticated: true,
      role: 'PROVIDER',
      token: 'token-123',
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshUser: jest.fn(),
      signUpClient: jest.fn(),
      signUpProvider: jest.fn(),
      isRegistrationInProgress: false,
      setIsRegistrationInProgress: jest.fn(),
      setAuthData: jest.fn(),
      updateUser: jest.fn(),
      paymentOverlayVisible: false,
    } as any);
    mockUseLocalSearchParams.mockReturnValue({});
    mockGetProviderSettings.mockResolvedValue({ serviceRadiusKm: 5 });
    mockGetPricingConfig.mockResolvedValue({ minHourlyMinutes: 240 });
    mockGetMyProviderAvailability.mockResolvedValue({
      available: [
        {
          id: 'availability-1',
          dayOfWeek: todayDow,
          startTime: '08:00',
          endTime: '10:00',
          isAvailable: true,
        },
      ],
    });
    mockGetBookingsForUser.mockResolvedValue([]);
    mockSaveProviderSettings.mockResolvedValue(undefined);
    mockUpdateMyProviderAvailability.mockResolvedValue([]);
  });

  it('includes the chosen radius when saving availability', async () => {
    const { getByTestId, getAllByLabelText, getByLabelText } = render(<ManageAvailabilityScreen />);
    const saveButton = await waitFor(() => getByTestId('manage-availability-save'));

    const personalizeButton = await waitFor(() => getAllByLabelText(/personalizar/i)[0]);
    await act(async () => {
      fireEvent.press(personalizeButton);
    });

    const slotButton = await waitFor(() => getByLabelText(/hor[aá]rio 14:00/i));
    await act(async () => {
      fireEvent.press(slotButton);
    });

    saveButton.props.disabled = false;
    await act(async () => {
      fireEvent.press(saveButton);
    });

    const expectedFragment = expect.arrayContaining([
      expect.objectContaining({
        dayOfWeek: todayDow,
        startTime: '14:00',
        isAvailable: true,
      }),
    ]);

    await waitFor(() => {
      expect(mockUpdateMyProviderAvailability).toHaveBeenCalledWith(expectedFragment);
    });

    expect(mockSaveProviderSettings).toHaveBeenCalledWith({ serviceRadiusKm: 5 });
  });
});
