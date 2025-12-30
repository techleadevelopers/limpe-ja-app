jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));
jest.mock('../../i18n', () => ({
  t: jest.fn((key, opts) => opts?.defaultValue ?? key),
}));
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));
jest.mock('../authService', () => ({
  __esModule: true,
  default: {
    refreshSession: jest.fn(),
  },
}));

import { AuthEventType } from '../authEvents';
import { AuthErrorCode } from '../../types/backend/auth-error-code';
import type { AxiosError } from 'axios';

type AsyncStorageMock = {
  getItem: jest.Mock;
  multiRemove: jest.Mock;
};
type ToastModuleMock = {
  show: jest.Mock;
};

const AUTH_STORAGE_KEYS = ['auth_token', 'user_role', 'user_id', 'user_profile'];
let mockAsyncStorage: AsyncStorageMock;

type ApiModule = typeof import('../api');
let apiModule: ApiModule;
let cleanupAxios: ApiModule['cleanupAxios'];

let mockedAuthService: jest.Mocked<{ refreshSession: jest.Mock }>;

describe('services/api interceptor', () => {
  let apiInstance: typeof apiModule.api;
  let unauthorizedMock: jest.Mock;
  let requestSpy: jest.SpyInstance;
  let clearSpy: jest.SpyInstance;
  let toastSpy: jest.SpyInstance;
  let emitSpy: jest.SpyInstance;

  const createAxiosError = (status: number, code: AuthErrorCode): AxiosError => {
    const config = {
      url: '/test',
      method: 'get',
      headers: {},
      meta: {},
    } as any;
    const error = new Error('boom') as AxiosError;
    error.config = config;
    error.isAxiosError = true as const;
    error.response = {
      status,
      statusText: 'Unauthorized',
      data: { code },
      headers: {},
      config,
    } as any;
    return error;
  };

  const getResponseErrorHandler = () => {
    const entries = (apiInstance.interceptors.response as any).handlers;
    const handler = entries.find((entry: any) => typeof entry.rejected === 'function');
    return handler?.rejected;
  };

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.API_BASE_URL = 'http://api.test';
    mockAsyncStorage = jest.requireMock(
      '@react-native-async-storage/async-storage',
    ) as AsyncStorageMock;
    mockAsyncStorage.getItem.mockResolvedValue('token-abc');
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
    const { default: authServiceModule } = await import('../authService');
    mockedAuthService = authServiceModule as jest.Mocked<{ refreshSession: jest.Mock }>;
    mockedAuthService.refreshSession.mockResolvedValue({
      accessToken: 'new-token',
      user: { id: 'user-1', role: 'CLIENT', email: 'test@local', fullName: 'Test User' },
    } as any);
    const authEventsModule = await import('../authEvents');
    emitSpy = jest.spyOn(authEventsModule, 'emitAuthEvent');
    const module = await import('../api');
    apiModule = module;
    apiInstance = module.api;
    cleanupAxios = module.cleanupAxios;
    jest.spyOn(cleanupAxios, 'post').mockResolvedValue({ data: {} } as any);
    unauthorizedMock = jest.fn();
    module.setUnauthorizedCallback(unauthorizedMock);
    requestSpy = jest.spyOn(apiInstance, 'request').mockResolvedValue({ data: { ok: true } } as any);
    const queryClientModule = await import('../../components/provider/query-client-provider');
    clearSpy = jest.spyOn(queryClientModule.appQueryClient, 'clear').mockImplementation(() => undefined);
    const ToastModule = jest.requireMock('react-native-toast-message') as ToastModuleMock;
    toastSpy = jest.spyOn(ToastModule, 'show').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshes the session when TOKEN_EXPIRED arrives', async () => {
    const errorHandler = getResponseErrorHandler();
    expect(errorHandler).toBeDefined();
    const axiosError = createAxiosError(401, AuthErrorCode.TOKEN_EXPIRED);
    const result = await errorHandler!(axiosError);
    expect(mockedAuthService.refreshSession).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      AuthEventType.SESSION_REFRESHED,
      expect.objectContaining({ accessToken: 'new-token' }),
    );
    expect(result?.status).toBe(200);
    expect(clearSpy).not.toHaveBeenCalled();
    expect(toastSpy).not.toHaveBeenCalled();
    expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  it('falls back to revocation cleanup when TOKEN_EXPIRED refresh fails', async () => {
    mockedAuthService.refreshSession.mockRejectedValueOnce(new Error('refresh failed'));
    const errorHandler = getResponseErrorHandler();
    expect(errorHandler).toBeDefined();
    const axiosError = createAxiosError(401, AuthErrorCode.TOKEN_EXPIRED);
    await expect(errorHandler!(axiosError)).rejects.toBe(axiosError);
    expect(requestSpy).not.toHaveBeenCalled();
    expect(unauthorizedMock).toHaveBeenCalled();
    expect(cleanupAxios.post).toHaveBeenCalledWith(
      '/auth/logout-device',
      undefined,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(AUTH_STORAGE_KEYS);
    expect(clearSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(AuthEventType.SESSION_REVOKED, undefined);
  });

  it('cleans up storage and notifies on TOKEN_REVOKED', async () => {
    const errorHandler = getResponseErrorHandler();
    expect(errorHandler).toBeDefined();
    const axiosError = createAxiosError(401, AuthErrorCode.TOKEN_REVOKED);
    await expect(errorHandler!(axiosError)).rejects.toBe(axiosError);
    expect(mockedAuthService.refreshSession).not.toHaveBeenCalled();
    expect(unauthorizedMock).toHaveBeenCalled();
    expect(cleanupAxios.post).toHaveBeenCalledWith(
      '/auth/logout-device',
      undefined,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(AUTH_STORAGE_KEYS);
    expect(clearSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(AuthEventType.SESSION_REVOKED, undefined);
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
