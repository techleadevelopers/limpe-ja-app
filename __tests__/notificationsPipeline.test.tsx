import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as notificationService from 'services/notificationService';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import NotificationUIService from '../services/notificationUIService';

jest.mock('services/notificationService', () => ({
  ackNotification: jest.fn(),
  getNotificationStream: jest.fn(),
}));
jest.mock('../../utils/socket', () => ({
  resolveSocketUrl: jest.fn(() => 'ws://localhost:4000'),
}));

const socketModule = require('socket.io-client');
const mockSocket = socketModule.__mockSocket;

describe('notifications pipeline (socket + stream + dedupe)', () => {
  const notificationServiceMock = notificationService as jest.Mocked<typeof notificationService>;
  const mockGetStream = notificationServiceMock.getNotificationStream;
  const mockAck = notificationServiceMock.ackNotification;

  beforeEach(() => {
    mockSocket.removeAllListeners();
    mockGetStream.mockReset();
    mockAck.mockReset();
    mockAck.mockResolvedValue(undefined);
    (NotificationUIService as any).dedupeHistory?.clear?.();
  });

  it('processes socket events, shows toast, and acknowledges payloads', async () => {
    mockGetStream.mockResolvedValue([]);
    const showSpy = jest.spyOn(NotificationUIService, 'showAppEvent');
    const { unmount } = renderHook(() => useNotificationsSocket('token'));
    await act(async () => {
      await Promise.resolve();
    });

    const event = {
      id: 'evt-1',
      userId: 'u',
      type: 'SYSTEM',
      title: 'Novo evento',
      message: 'Alerta de teste',
      createdAt: '2025-01-01T00:00:00.000Z',
      dedupeKey: 'socket:evt-1',
      payload: {
        deepLink: '/client/bookings/evt-1',
      },
    };

    await act(async () => {
      mockSocket.emit('notification', event);
    });

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(showSpy.mock.calls[0][0].dedupeKey).toBe('socket:evt-1');
    expect(showSpy.mock.calls[0][0].deepLink).toBe('/client/bookings/evt-1');
    expect(mockAck).toHaveBeenCalledWith('evt-1');

    showSpy.mockRestore();
    unmount();
  });

  it('reconciles stream events after reconnect and ignores duplicates', async () => {
    const duplicateEvent = {
      id: 'evt-dup',
      userId: 'u',
      type: 'SYSTEM',
      title: 'Evento duplicado',
      message: 'Duplicado',
      createdAt: '2025-01-01T00:01:00.000Z',
      dedupeKey: 'socket:dup',
    };
    const newEvent = {
      id: 'evt-new',
      userId: 'u',
      type: 'SYSTEM',
      title: 'Evento novo',
      message: 'Novo alerta',
      createdAt: '2025-01-01T00:02:00.000Z',
      dedupeKey: 'socket:new',
    };

    mockGetStream
      .mockResolvedValueOnce([]) // initial fetch at mount
      .mockResolvedValueOnce([duplicateEvent, newEvent]);

    const showSpy = jest.spyOn(NotificationUIService, 'showAppEvent');
    const { unmount } = renderHook(() => useNotificationsSocket('token'));
    await act(async () => {
      await Promise.resolve();
    });

    const initialEvent = {
      id: 'evt-initial',
      userId: 'u',
      type: 'SYSTEM',
      title: 'Evento inicial',
      message: 'Primeiro alerta',
      createdAt: '2025-01-01T00:00:00.000Z',
      dedupeKey: 'socket:dup',
    };

    await act(async () => {
      mockSocket.emit('notification', initialEvent);
    });

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(showSpy.mock.calls[0][0].dedupeKey).toBe('socket:dup');
    expect(mockAck).toHaveBeenCalledWith('evt-initial');

    await act(async () => {
      mockSocket.emit('connect');
      await Promise.resolve();
    });
    await waitFor(() => expect(mockGetStream).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(showSpy).toHaveBeenCalledTimes(2));

    expect(typeof mockGetStream.mock.calls[1][0]).toBe('string');
    expect(showSpy.mock.calls[1][0].dedupeKey).toBe('socket:new');
    expect(showSpy.mock.calls[1][0].deepLink).toBeUndefined();
    expect(mockAck).toHaveBeenCalledWith('evt-new');
    expect(mockAck).toHaveBeenCalledTimes(2);

    showSpy.mockRestore();
    unmount();
  });

  it('shows BOOKING_REMINDER once and dedupes by dedupeKey', async () => {
    mockGetStream.mockResolvedValue([]);
    const showSpy = jest.spyOn(NotificationUIService, 'showAppEvent');
    const { unmount } = renderHook(() => useNotificationsSocket('token'));
    await act(async () => {
      await Promise.resolve();
    });

    const reminder = {
      id: 'rem-1',
      userId: 'u',
      type: 'BOOKING_REMINDER',
      title: 'Lembrete',
      message: 'Seu horário está chegando.',
      createdAt: '2025-01-01T00:00:00.000Z',
      dedupeKey: 'booking:reminder:24h',
    };

    await act(async () => {
      mockSocket.emit('notification', reminder);
    });
    expect(showSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockSocket.emit('notification', {
        ...reminder,
        id: 'rem-2',
      });
    });
    expect(showSpy).toHaveBeenCalledTimes(1);

    showSpy.mockRestore();
    unmount();
  });
});
