import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import ProviderEarningsScreen from '../earnings';
import { emitProviderNotification } from '../../services/notificationBus';
import { getMyProviderDashboard } from '../../services/providerService';
import { getMyProviderEarnings } from '../../services/earningService';

jest.mock('../../services/providerService', () => ({
  getMyProviderDashboard: jest.fn(),
}));
jest.mock('../../services/earningService', () => ({
  getMyProviderEarnings: jest.fn(),
}));

const mockDashboard = {
  fullName: 'Paulo',
  upcomingBookings: [],
};

const initialEarnings = {
  availableForWithdrawal: 200.33,
  pendingWithdrawals: 150.02,
  totalEarnings: 350.35,
  earningsBreakdown: {},
  recentTransactions: [],
};

const refreshedEarnings = {
  availableForWithdrawal: 500.5,
  pendingWithdrawals: 80.12,
  totalEarnings: 580.62,
  earningsBreakdown: {},
  recentTransactions: [],
};

const mockGetMyProviderDashboard = getMyProviderDashboard as jest.MockedFunction<typeof getMyProviderDashboard>;
const mockGetMyProviderEarnings = getMyProviderEarnings as jest.MockedFunction<typeof getMyProviderEarnings>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMyProviderDashboard.mockResolvedValue(mockDashboard);
  mockGetMyProviderEarnings
    .mockResolvedValueOnce(initialEarnings)
    .mockResolvedValueOnce(refreshedEarnings);
});

it('exibe valores formatados e reaplica dados após evento de pagamento', async () => {
  const { getByText, getAllByLabelText } = render(<ProviderEarningsScreen />);

  await waitFor(() => expect(mockGetMyProviderEarnings).toHaveBeenCalledTimes(1));

  expect(getByText('Saldo liberado')).toBeTruthy();
  expect(getByText('R$ 200,33')).toBeTruthy();
  expect(getByText('Saldo pendente')).toBeTruthy();
  expect(getByText('R$ 150,02')).toBeTruthy();
  expect(getByText('Total acumulado')).toBeTruthy();
  expect(getByText('R$ 350,35')).toBeTruthy();

  const availableLabels = getAllByLabelText('Saldo liberado de R$ 200,33');
  expect(availableLabels.length).toBeGreaterThan(0);

  await act(async () => {
    emitProviderNotification('paymentConfirmed');
  });

  await waitFor(() => expect(mockGetMyProviderEarnings).toHaveBeenCalledTimes(2));

  expect(getByText('R$ 500,50')).toBeTruthy();
  expect(getByText('R$ 80,12')).toBeTruthy();
  expect(getAllByLabelText('Total acumulado de R$ 580,62').length).toBeGreaterThan(0);
  expect(getByText('R$ 580,62')).toBeTruthy();
});
