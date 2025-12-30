import { fireEvent, waitFor } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as quoteService from '../../../../services/quoteService';
import { useBookingQuote } from '../../../../hooks/useBookingQuote';
import { renderWithProviders } from '../../../__tests__/helpers/renderWithProviders';
import { InsuranceOptionsCard } from '../components/InsuranceOptionsCard';
import {
  BookingAddress,
  BookingQuoteResponse,
  InsurancePlanId,
} from '../../../../types/backend/bookings';
import { formatBRL } from '../../../../utils/formatters';

jest.mock('../../../../services/quoteService', () => ({
  quoteBooking: jest.fn(),
}));

const mockedQuoteBooking = jest.mocked(quoteService.quoteBooking);

const insuranceOptions = [
  {
    id: 'ESSENCIAL' as const,
    name: 'Essencial',
    basePriceCents: 2490,
    coverageCents: 70000,
    deductibleCents: 20000,
    finalPriceCents: 2490,
    eligible: true,
    reasons: [],
  },
  {
    id: 'PREMIUM' as const,
    name: 'Premium',
    basePriceCents: 5990,
    coverageCents: 350000,
    deductibleCents: 30000,
    finalPriceCents: 5990,
    eligible: true,
    reasons: [],
  },
  {
    id: 'TOTAL' as const,
    name: 'Total',
    basePriceCents: 9990,
    coverageCents: 1000000,
    deductibleCents: 50000,
    finalPriceCents: 9990,
    eligible: true,
    reasons: [],
  },
];

const ADDRESS: BookingAddress = {
  street: 'Rua Teste',
  number: '100',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  cep: '01000-000',
  latitude: -23.55,
  longitude: -46.63,
};

const buildQuoteResponse = (overrides: Partial<BookingQuoteResponse> = {}): BookingQuoteResponse => ({
  finalPrice: 100,
  subtotal: 100,
  discountAmount: 0,
  platformFee: 0,
  providerNet: 100,
  couponApplied: false,
  quoteId: 'quote-1',
  quoteHash: 'hash-1',
  expiresAt: new Date().toISOString(),
  totalCents: 10000,
  insuranceFeeCents: 0,
  insuranceOptions,
  selectedInsurance: null,
  breakdown: [],
  ...overrides,
});

const InsuranceQuoteHarness = () => {
  const [insurancePlanId, setInsurancePlanId] = useState<InsurancePlanId | null>(null);
  const { quote } = useBookingQuote({
    providerId: 'provider-1',
    providerServiceId: 'service-1',
    scheduledDate: '2025-10-05',
    scheduledTime: '08:00',
    address: ADDRESS,
    durationMinutes: 120,
    squareMeters: 50,
    insurancePlanId,
  });

  return (
    <View>
      <InsuranceOptionsCard
        insuranceOptions={quote?.insuranceOptions ?? []}
        selectedPlanId={insurancePlanId}
        onSelectPlan={setInsurancePlanId}
      />
      <Text testID="quote-total">
        {quote ? formatBRL(quote.totalCents / 100) : 'R$ --'}
      </Text>
    </View>
  );
};

describe('Insurance quote integration', () => {
  beforeEach(() => {
    mockedQuoteBooking.mockReset();
  });

  it('requests quote with insurancePlanId and updates total when Premium selected', async () => {
    mockedQuoteBooking
      .mockResolvedValueOnce(buildQuoteResponse())
      .mockResolvedValueOnce(
        buildQuoteResponse({
          totalCents: 16000,
          insuranceFeeCents: 6000,
          selectedInsurance: insuranceOptions[1],
        }),
      );

    const { getByTestId } = renderWithProviders(<InsuranceQuoteHarness />);

    await waitFor(() => expect(mockedQuoteBooking).toHaveBeenCalledTimes(1));
    expect(mockedQuoteBooking).toHaveBeenCalledWith(
      expect.objectContaining({ insurancePlanId: undefined }),
    );
    await waitFor(() =>
      expect(getByTestId('quote-total').props.children).toBe(formatBRL(10000 / 100)),
    );

    const premiumOption = await waitFor(() => getByTestId('insurance-option-PREMIUM'));
    fireEvent.press(premiumOption);

    await waitFor(() => expect(mockedQuoteBooking).toHaveBeenCalledTimes(2));
    expect(mockedQuoteBooking).toHaveBeenLastCalledWith(
      expect.objectContaining({ insurancePlanId: 'PREMIUM' }),
    );
    await waitFor(() =>
      expect(getByTestId('quote-total').props.children).toBe(formatBRL(16000 / 100)),
    );
  });
});
