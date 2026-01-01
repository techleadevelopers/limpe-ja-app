import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../app/auth/forgot-password';
import AuthService from '../../services/authService';

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    sendPasswordReset: jest.fn(),
  },
}));

describe('ForgotPasswordScreen flow', () => {
  const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;
  const successMessage =
    'Um link para redefinir sua senha foi enviado para seu e-mail. Verifique sua caixa de entrada (e spam)!';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('collects the email, calls the service, and shows success feedback', async () => {
    mockedAuthService.sendPasswordReset.mockResolvedValue({ message: successMessage });

    const { getByPlaceholderText, getByText, queryByText } = render(<ForgotPasswordScreen />);
    const emailInput = getByPlaceholderText('Seu E-mail');
    const submitButton = getByText(/Enviar Link de Redefinição/i);

    fireEvent.changeText(emailInput, '  Test@Example.com  ');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockedAuthService.sendPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    await waitFor(() => {
      expect(queryByText(successMessage)).toBeTruthy();
    });
  });
});
