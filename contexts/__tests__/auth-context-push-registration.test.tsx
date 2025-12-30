import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthEventType, emitAuthEvent } from '../../services/authEvents';

jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  registerClient: jest.fn(),
  registerProvider: jest.fn(),
  loadAuthData: jest.fn().mockResolvedValue({
    token: 'token',
    user: { id: 'user-1', role: 'CLIENT' },
    id: 'user-1',
    role: 'CLIENT',
  }),
  storeAuthData: jest.fn(),
}));

jest.mock('../../services/pushService', () => ({
  registerDevicePushToken: jest.fn().mockResolvedValue(undefined),
  unregisterDevicePushToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/api', () => ({
  setUnauthorizedCallback: jest.fn(),
  resetRevocationCallbackFlag: jest.fn(),
}));

jest.mock('../../services/authEvents', () => {
  const listeners: Record<string, (payload: any) => void> = {};
  return {
    AuthEventType: {
      SESSION_REFRESHED: 'SESSION_REFRESHED',
      SESSION_REVOKED: 'SESSION_REVOKED',
    },
    onAuthEvent: jest.fn((event: string, handler: (payload: any) => void) => {
      listeners[event] = handler;
      return () => {
        delete listeners[event];
      };
    }),
    emitAuthEvent: (event: string, payload: any) => {
      listeners[event]?.(payload);
    },
  };
});

jest.mock('../../services/userService', () => ({
  getMe: jest.fn().mockResolvedValue({ id: 'user-1', role: 'CLIENT' }),
}));

jest.mock('../../components/provider/query-client-provider', () => ({
  appQueryClient: {
    invalidateQueries: jest.fn(),
  },
}));

const AuthUserInfo = () => {
  const { user } = useAuth();
  const display = `${user?.id ?? 'null'}|${user?.token ?? 'null'}`;
  return <Text testID="auth-user">{display}</Text>;
};

describe('AuthContext push registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const socketModule = require('socket.io-client');
    socketModule.__mockSocket.disconnect.mockClear();
  });

  it('re-registers the push token on SESSION_REFRESHED', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthUserInfo />
      </AuthProvider>,
    );
    const { registerDevicePushToken } = require('../../services/pushService');
    registerDevicePushToken.mockClear();
    const beforeCallCount = registerDevicePushToken.mock.calls.length;

    await waitFor(() => {
      expect(getByTestId('auth-user').props.children).toBe('user-1|token');
    });
    await act(async () => {
      emitAuthEvent(AuthEventType.SESSION_REFRESHED, {
        accessToken: 'new-token',
        user: { id: 'user-1', role: 'CLIENT' },
      });
    });

    await waitFor(() => {
      expect(registerDevicePushToken.mock.calls.length).toBeGreaterThan(beforeCallCount);
    });
    await waitFor(() => {
      expect(getByTestId('auth-user').props.children).toBe('user-1|new-token');
    });
  });

  it('performs cleanup on SESSION_REVOKED', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthUserInfo />
      </AuthProvider>,
    );
    const { registerDevicePushToken, unregisterDevicePushToken } =
      require('../../services/pushService');
    const socketModule = require('socket.io-client');
    const disconnectSpy = socketModule.__mockSocket.disconnect;
    disconnectSpy.mockClear();
    await waitFor(() => {
      expect(getByTestId('auth-user').props.children).toBe('user-1|token');
    });
    const callsBefore = registerDevicePushToken.mock.calls.length;

    await act(async () => {
      emitAuthEvent(AuthEventType.SESSION_REVOKED, {});
    });

    await waitFor(() => {
      expect(unregisterDevicePushToken).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalled();
      expect(registerDevicePushToken.mock.calls.length).toBe(callsBefore);
      expect(getByTestId('auth-user').props.children).toBe('null|null');
    });
  });
});
