import NotificationUIService from './notificationUIService';

describe('NotificationUIService showAppEvent dedupe', () => {
  beforeEach(() => {
    (NotificationUIService as any).dedupeHistory?.clear?.();
  });

  it('does not show the same dedupeKey twice within the window', () => {
    const showSpy = jest.spyOn(NotificationUIService, 'show');
    NotificationUIService.showAppEvent({
      dedupeKey: 'event:1',
      title: 'Primeira',
      message: 'Uma notificação',
    });
    NotificationUIService.showAppEvent({
      dedupeKey: 'event:1',
      title: 'Segunda',
      message: 'Mesmo evento',
    });
    expect(showSpy).toHaveBeenCalledTimes(1);
    showSpy.mockRestore();
  });

  it('shows events with different dedupeKey', () => {
    const showSpy = jest.spyOn(NotificationUIService, 'show');
    NotificationUIService.showAppEvent({
      dedupeKey: 'event:1',
      title: 'Primeira',
      message: 'Uma notificação',
    });
    NotificationUIService.showAppEvent({
      dedupeKey: 'event:2',
      title: 'Segunda',
      message: 'Outro evento',
    });
    expect(showSpy).toHaveBeenCalledTimes(2);
    showSpy.mockRestore();
  });

  it('replays the same dedupeKey after the dedupe window expires', () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    const showSpy = jest.spyOn(NotificationUIService, 'show');

    NotificationUIService.showAppEvent({
      dedupeKey: 'event:window',
      title: 'Primeira',
      message: 'Uma notificação',
    });
    jest.advanceTimersByTime(16_000);
    NotificationUIService.showAppEvent({
      dedupeKey: 'event:window',
      title: 'Segunda',
      message: 'Mesmo evento depois da janela',
    });

    expect(showSpy).toHaveBeenCalledTimes(2);
    showSpy.mockRestore();
    jest.useRealTimers();
  });
});
