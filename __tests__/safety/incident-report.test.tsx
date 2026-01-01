import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

import IncidentReportScreen from '../../app/common/safety/incident-report';

jest.mock('../../../services/bookingService', () => ({
  getBookingDetails: jest.fn(),
}));

jest.mock('../../../services/incidentService', () => ({
  submitIncidentClaim: jest.fn(),
}));

jest.mock('../../../services/safetyService', () => ({
  reportIncident: jest.fn(),
}));

const mockGetBookingDetails = require('../../../services/bookingService')
  .getBookingDetails as jest.Mock;
const mockSubmitIncidentClaim = require('../../../services/incidentService')
  .submitIncidentClaim as jest.Mock;
const mockReportIncident = require('../../../services/safetyService')
  .reportIncident as jest.Mock;

describe('IncidentReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBookingDetails.mockResolvedValue({
      id: 'booking-1',
      insurance: {
        planId: 'ESSENCIAL',
        coverageCents: 70000,
        deductibleCents: 20000,
        proofRequired: false,
      },
    });
    mockSubmitIncidentClaim.mockResolvedValue({ id: 'claim-1' });
  });

  it('submits via the claims endpoint when insurance is active', async () => {
    renderWithProviders(<IncidentReportScreen />);

    fireEvent.changeText(
      screen.getByTestId('incident-booking-id-input'),
      'booking-1',
    );

    await waitFor(() =>
      expect(mockGetBookingDetails).toHaveBeenCalledWith('booking-1'),
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        'Descreva o que aconteceu, data, hora, quem estava envolvido, etc.',
      ),
      'Vidro quebrado',
    );

    fireEvent.changeText(
      screen.getByTestId('incident-claim-amount-input'),
      '150,00',
    );

    await waitFor(() => expect(screen.getByText('Enviar Sinistro')).toBeTruthy());
    fireEvent.press(screen.getByText('Enviar Sinistro'));

    await waitFor(() => expect(mockSubmitIncidentClaim).toHaveBeenCalled());
    const [payload] = mockSubmitIncidentClaim.mock.calls[0];
    expect(payload).toEqual(
      expect.objectContaining({
        bookingId: 'booking-1',
        description: 'Vidro quebrado',
        amountCents: 15000,
      }),
    );
    expect(mockReportIncident).not.toHaveBeenCalled();
  });
});
