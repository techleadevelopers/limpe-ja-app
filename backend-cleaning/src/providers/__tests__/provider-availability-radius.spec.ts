import { ConfigService } from '@nestjs/config';
import { ProviderSettingsDto } from '../dto/provider-settings.dto';
import { ProvidersController } from '../providers.controller';
import { SettingsService } from '../../settings/settings.service';

class InMemoryCacheMock {
  private readonly store = new Map<string, number>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.has(key)
      ? (this.store.get(key) as unknown as T)
      : undefined;
  }

  async set<T>(_key: string, value: T): Promise<void> {
    const key = _key;
    this.store.set(key, value as unknown as number);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('Provider availability radius persistence', () => {
  it('saves the radius requested by the provider and persists it in cache', async () => {
    const cache = new InMemoryCacheMock();
    const configService = { get: jest.fn(() => undefined) } as unknown as ConfigService;
    const settingsService = new SettingsService(
      cache as any,
      configService,
    );

    const providersService = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'provider-1', userId: 'user-1' }),
    };
    const promotionsService = {};

    const controller = new ProvidersController(
      providersService as any,
      settingsService,
      promotionsService as any,
    );

    const request: Partial<{ user: { userId: string } }> = {
      user: { userId: 'user-1' },
    };
    const dto: ProviderSettingsDto = { serviceRadiusKm: 42.3 };

    const response = await controller.saveMySettings(
      request as any,
      dto,
    );

    expect(response).toEqual({ ok: true });
    expect(providersService.findByUserId).toHaveBeenCalledWith('user-1');

    const storedRadius = await settingsService.getProviderRadiusKm(
      'provider-1',
    );
    expect(storedRadius).toBe(42);

    const cacheKey = 'settings:provider:radius_km:provider-1';
    const cachedValue = await cache.get<number>(cacheKey);
    expect(cachedValue).toBe(42);
  });
});
