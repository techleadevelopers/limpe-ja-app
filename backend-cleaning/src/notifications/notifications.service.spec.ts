import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: any;
  let i18nMock: { translate: jest.Mock };
  let configMock: { get: jest.Mock };

  beforeEach(() => {
    prismaMock = {
      notification: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-notif' }),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ id: 'updated' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ fcmToken: null }),
      },
    };
    i18nMock = { translate: jest.fn().mockResolvedValue('translated') };
    configMock = {
      get: jest.fn().mockImplementation((_key, fallback) => fallback ?? 0),
    };

    service = new NotificationsService(
      prismaMock as any,
      i18nMock as any,
      configMock as any,
    );
    (service as any).sendPushNotification = jest.fn().mockResolvedValue(undefined);
  });

  describe('createNotification', () => {
    it('reuses notification when idempotency key already exists', async () => {
      const existing = { id: 'notif-1', userId: 'client-1', type: 'PAYMENT_CONFIRMED' };
      prismaMock.notification.findUnique.mockResolvedValue(existing);
      const dto = {
        userId: 'client-1',
        type: 'PAYMENT_CONFIRMED',
        message: 'Pagamento confirmado',
        idempotencyKey: 'payment_confirmed:booking-123',
      };

      const result = await service.createNotification(dto as any);

      expect(result).toBe(existing);
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('creates a new notification when the idempotency key is new', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);
      prismaMock.notification.findFirst.mockResolvedValue(null);
      const created = { id: 'notif-2', userId: 'client-1', message: 'Pagamento confirmado' };
      prismaMock.notification.create.mockResolvedValue(created);
      const dto = {
        userId: 'client-1',
        type: 'PAYMENT_CONFIRMED',
        message: 'Pagamento confirmado',
      };

      const result = await service.createNotification(dto as any);

      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'client-1',
            type: 'PAYMENT_CONFIRMED',
            message: 'Pagamento confirmado',
          }),
        }),
      );
      expect(result).toBe(created);
    });

    it('deduplicates events that share the same dedupeKey within the window', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);
      const duplicate = { id: 'notif-dup', userId: 'client-1', type: 'BOOKING_UPDATED' };
      prismaMock.notification.findFirst.mockResolvedValue(duplicate);
      const dto = {
        userId: 'client-1',
        type: 'BOOKING_UPDATED',
        message: 'Booking changed',
        payload: { bookingId: 'booking-123' },
      };

      const result = await service.createNotification(dto as any);

      expect(prismaMock.notification.create).not.toHaveBeenCalled();
      expect(result).toBe(duplicate);
    });
  });

  describe('streaming and ack', () => {
    it('returns notifications created after the provided timestamp', async () => {
      const since = new Date('2025-01-01T00:00:00Z');
      await service.getUserNotificationStream('client-1', since, 50);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'client-1', createdAt: { gt: since } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
    });

    it('acks a notification idempotently', async () => {
      const existing = { id: 'notif-ack', userId: 'client-1' };
      prismaMock.notification.findUnique.mockResolvedValue(existing);
      prismaMock.notification.update.mockResolvedValue({
        ...existing,
        isRead: true,
        acknowledgedAt: new Date().toISOString(),
      });

      const result = await service.ackNotification('notif-ack', 'client-1');

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-ack' },
        data: expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
          acknowledgedAt: expect.any(Date),
        }),
      });
      expect(result).toMatchObject({ id: 'notif-ack' });
    });
  });
});
