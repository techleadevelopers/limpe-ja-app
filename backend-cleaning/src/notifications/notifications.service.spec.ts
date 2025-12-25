import { NotificationsService } from './notifications.service';

describe('NotificationsService.createNotification', () => {
  let service: NotificationsService;
  let prismaMock: {
    notification: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };
  let i18nMock: { translate: jest.Mock };

  beforeEach(() => {
    prismaMock = {
      notification: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ fcmToken: null }),
      },
    };
    i18nMock = { translate: jest.fn().mockResolvedValue('translated') };

    service = new NotificationsService(prismaMock as any, i18nMock as any);
    (service as any).sendPushNotification = jest.fn().mockResolvedValue(undefined);
  });

  it('returns the existing notification when the idempotency key already exists', async () => {
    const existing = { id: 'notif-1', userId: 'client-1', type: 'PAYMENT_CONFIRMED' };
    prismaMock.notification.findUnique.mockResolvedValue(existing);
    const dto = {
      userId: 'client-1',
      type: 'PAYMENT_CONFIRMED',
      message: 'Pagamento confirmado',
      idempotencyKey: 'payment_confirmed:client:booking-123',
    };

    const result = await service.createNotification(dto as any);

    expect(result).toBe(existing);
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  it('creates a new notification when the idempotency key is new', async () => {
    prismaMock.notification.findUnique.mockResolvedValue(null);
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
});
