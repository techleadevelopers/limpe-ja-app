import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ResetPasswordScreen from '../../app/auth/reset-password';
import AuthService from '../../services/authService';

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    sendPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

describe('ResetPasswordScreen', () => {
  const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;
  const router = useRouter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('confirms token, calls auth service and navigates to login', async () => {
    mockedAuthService.confirmPasswordReset.mockResolvedValue({ message: 'ok' });

    const { getByPlaceholderText, getByText } = render(<ResetPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Código recebido'), '  abc123  ');
    fireEvent.changeText(getByPlaceholderText('Nova senha'), 'NovaSenha@2025');
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(mockedAuthService.confirmPasswordReset).toHaveBeenCalledWith(
        'abc123',
        'NovaSenha@2025',
      );
    });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/auth/login');
    });
  });
});
