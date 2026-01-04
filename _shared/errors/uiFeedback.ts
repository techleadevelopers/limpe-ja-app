import { Alert } from 'react-native';
import { normalizeAppError, showUserError, UserFacingError } from './userError';

export const getUserMessage = (error: unknown): string =>
  normalizeAppError(error).message;

export const alertUserError = (error: unknown, title?: string): void => {
  Alert.alert(title ?? 'Erro', getUserMessage(error));
};

export const toastUserError = (error: unknown, title?: string): UserFacingError =>
  showUserError(error, title ?? 'Erro');

export const setSafeError = (setter: (value: string | null) => void, error: unknown): void => {
  setter(getUserMessage(error));
};
