import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

export type DisputeSlaConfig = {
  urgentHours: number;
  highHours: number;
  mediumHours: number;
  lowHours: number;
};

export type SupportSlaConfig = {
  PAYMENT: number;
  QUALITY: number;
  APP: number;
  OTHER: number;
};

export type SlaSettings = {
  disputes: DisputeSlaConfig;
  support: SupportSlaConfig;
};

export type SlaAuditEvent = {
  id: string;
  at: string; // ISO
  actorUserId: string;
  before: SlaSettings;
  after: SlaSettings;
};

export type GeneralSettings = {
  commissionRatePercent: number; // e.g., 15
};

export type GeneralAuditEvent = {
  id: string;
  at: string;
  actorUserId: string;
  before: GeneralSettings;
  after: GeneralSettings;
};

export type PricingAuditEvent = {
  id: string;
  at: string;
  actorUserId: string;
  action: 'create' | 'update' | 'delete';
  ruleBefore?: any;
  ruleAfter?: any;
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  private readonly baseKey = 'settings:sla';
  private readonly ttlSeconds: number;
  private readonly historyKey = 'settings:sla:history';
  private readonly historyTtlSeconds: number;
  private readonly generalKey = 'settings:general';
  private readonly generalHistoryKey = 'settings:general:history';
  private readonly pricingHistoryKey = 'settings:pricing:history';
  private readonly providerRadiusKeyPrefix = 'settings:provider:radius_km';

  constructor(
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {
    this.ttlSeconds = parseInt(
      this.config.get<string>('SETTINGS_TTL_SECONDS') || '2592000',
      10,
    ); // 30d
    this.historyTtlSeconds = parseInt(
      this.config.get<string>('SETTINGS_HISTORY_TTL_SECONDS') || '31536000',
      10,
    ); // 365d
  }

  private coerceInt(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }

  private async getNumber(key: string, fallback: number): Promise<number> {
    const v = await this.cache.get<number>(key);
    if (typeof v === 'number') return v;
    return fallback;
  }

  private async setNumber(key: string, value: number): Promise<void> {
    await this.cache.set<number>(key, value, this.ttlSeconds);
  }

  async getSlaSettings(): Promise<SlaSettings> {
    // Fallbacks from ENV (or hard defaults matching current policies/docs)
    const disputeDefaults: DisputeSlaConfig = {
      urgentHours: this.coerceInt(
        this.config.get('DISPUTE_SLA_URGENT_HOURS'),
        4,
      ),
      highHours: this.coerceInt(this.config.get('DISPUTE_SLA_HIGH_HOURS'), 8),
      mediumHours: this.coerceInt(
        this.config.get('DISPUTE_SLA_MEDIUM_HOURS'),
        24,
      ),
      lowHours: this.coerceInt(this.config.get('DISPUTE_SLA_LOW_HOURS'), 48),
    };
    const supportDefaults: SupportSlaConfig = {
      PAYMENT: 24,
      QUALITY: 48,
      APP: 72,
      OTHER: 48,
    };

    const disputes: DisputeSlaConfig = {
      urgentHours: await this.getNumber(
        `${this.baseKey}:dispute:urgent_hours`,
        disputeDefaults.urgentHours,
      ),
      highHours: await this.getNumber(
        `${this.baseKey}:dispute:high_hours`,
        disputeDefaults.highHours,
      ),
      mediumHours: await this.getNumber(
        `${this.baseKey}:dispute:medium_hours`,
        disputeDefaults.mediumHours,
      ),
      lowHours: await this.getNumber(
        `${this.baseKey}:dispute:low_hours`,
        disputeDefaults.lowHours,
      ),
    };

    const support: SupportSlaConfig = {
      PAYMENT: await this.getNumber(
        `${this.baseKey}:support:PAYMENT_hours`,
        supportDefaults.PAYMENT,
      ),
      QUALITY: await this.getNumber(
        `${this.baseKey}:support:QUALITY_hours`,
        supportDefaults.QUALITY,
      ),
      APP: await this.getNumber(
        `${this.baseKey}:support:APP_hours`,
        supportDefaults.APP,
      ),
      OTHER: await this.getNumber(
        `${this.baseKey}:support:OTHER_hours`,
        supportDefaults.OTHER,
      ),
    };

    return { disputes, support };
  }

  async updateSlaSettings(
    partial: Partial<SlaSettings>,
    actorUserId?: string,
  ): Promise<SlaSettings> {
    const current = await this.getSlaSettings();

    const next: SlaSettings = {
      disputes: { ...current.disputes },
      support: { ...current.support },
    };

    const validateHours = (n: unknown, field: string) => {
      const v = Number(n);
      if (!Number.isFinite(v) || v <= 0 || v > 168) {
        throw new BadRequestException(
          `Invalid hours for ${field}. Expected 1..168.`,
        );
      }
      return Math.floor(v);
    };

    if (partial.disputes) {
      if (partial.disputes.urgentHours != null) {
        next.disputes.urgentHours = validateHours(
          partial.disputes.urgentHours,
          'disputes.urgentHours',
        );
      }
      if (partial.disputes.highHours != null) {
        next.disputes.highHours = validateHours(
          partial.disputes.highHours,
          'disputes.highHours',
        );
      }
      if (partial.disputes.mediumHours != null) {
        next.disputes.mediumHours = validateHours(
          partial.disputes.mediumHours,
          'disputes.mediumHours',
        );
      }
      if (partial.disputes.lowHours != null) {
        next.disputes.lowHours = validateHours(
          partial.disputes.lowHours,
          'disputes.lowHours',
        );
      }
    }

    if (partial.support) {
      for (const key of ['PAYMENT', 'QUALITY', 'APP', 'OTHER'] as const) {
        const incoming = (partial.support as any)[key];
        if (incoming != null) {
          (next.support as any)[key] = validateHours(
            incoming,
            `support.${key}`,
          );
        }
      }
    }

    // Persist to cache (Redis)
    await this.setNumber(
      `${this.baseKey}:dispute:urgent_hours`,
      next.disputes.urgentHours,
    );
    await this.setNumber(
      `${this.baseKey}:dispute:high_hours`,
      next.disputes.highHours,
    );
    await this.setNumber(
      `${this.baseKey}:dispute:medium_hours`,
      next.disputes.mediumHours,
    );
    await this.setNumber(
      `${this.baseKey}:dispute:low_hours`,
      next.disputes.lowHours,
    );

    await this.setNumber(
      `${this.baseKey}:support:PAYMENT_hours`,
      next.support.PAYMENT,
    );
    await this.setNumber(
      `${this.baseKey}:support:QUALITY_hours`,
      next.support.QUALITY,
    );
    await this.setNumber(`${this.baseKey}:support:APP_hours`, next.support.APP);
    await this.setNumber(
      `${this.baseKey}:support:OTHER_hours`,
      next.support.OTHER,
    );

    // Append audit
    try {
      const event: SlaAuditEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        actorUserId: actorUserId || 'unknown',
        before: current,
        after: next,
      };
      const history =
        (await this.cache.get<SlaAuditEvent[]>(this.historyKey)) || [];
      history.unshift(event);
      // cap history
      while (history.length > 500) history.pop();
      await this.cache.set(this.historyKey, history, this.historyTtlSeconds);
    } catch (e) {
      this.logger.warn(`Failed to append SLA audit: ${(e as Error)?.message}`);
    }

    this.logger.log(
      `[SettingsService] SLA settings updated by ${actorUserId || 'unknown'}`,
    );
    return next;
  }

  // ================= Provider radius (km) =================
  async setProviderRadiusKm(providerId: string, km: number): Promise<void> {
    const key = `${this.providerRadiusKeyPrefix}:${providerId}`;
    const clamped = Math.max(1, Math.min(200, Math.floor(Number(km))));
    if (!Number.isFinite(clamped)) {
      throw new BadRequestException('serviceRadiusKm inválido');
    }
    await this.setNumber(key, clamped);
    this.logger.log(
      `[SettingsService] setProviderRadiusKm: provider=${providerId} radiusKm=${clamped}`,
    );
  }

  async getProviderRadiusKm(
    providerId: string,
    fallback: number = 15,
  ): Promise<number> {
    const key = `${this.providerRadiusKeyPrefix}:${providerId}`;
    const value = await this.getNumber(key, fallback);
    this.logger.debug(
      `[SettingsService] getProviderRadiusKm: provider=${providerId} -> ${value}`,
    );
    return value;
  }

  async getSlaHistory(
    limit = 50,
    cursor = 0,
  ): Promise<{ items: SlaAuditEvent[]; nextCursor: number | null }> {
    const history =
      (await this.cache.get<SlaAuditEvent[]>(this.historyKey)) || [];
    const start = Math.max(0, cursor | 0);
    const end = Math.min(
      history.length,
      start + Math.max(1, Math.min(200, limit)),
    );
    const items = history.slice(start, end);
    const nextCursor = end < history.length ? end : null;
    return { items, nextCursor };
  }

  // --- General (commission) ---
  async getGeneralSettings(): Promise<GeneralSettings> {
    const defaults: GeneralSettings = {
      commissionRatePercent: this.coerceInt(
        this.config.get('DEFAULT_COMMISSION_RATE_PERCENT'),
        15,
      ),
    };
    const stored = await this.cache.get<GeneralSettings>(this.generalKey);
    return stored ? { ...defaults, ...stored } : defaults;
  }

  async updateGeneralSettings(
    partial: Partial<GeneralSettings>,
    actorUserId?: string,
  ): Promise<GeneralSettings> {
    const current = await this.getGeneralSettings();
    const next: GeneralSettings = { ...current };
    if (partial.commissionRatePercent != null) {
      const n = Number(partial.commissionRatePercent);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        throw new BadRequestException(
          'commissionRatePercent must be between 0 and 100',
        );
      }
      next.commissionRatePercent = Math.round(n * 100) / 100;
    }
    await this.cache.set(this.generalKey, next, this.ttlSeconds);

    try {
      const event: GeneralAuditEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        actorUserId: actorUserId || 'unknown',
        before: current,
        after: next,
      };
      const history =
        (await this.cache.get<GeneralAuditEvent[]>(this.generalHistoryKey)) ||
        [];
      history.unshift(event);
      while (history.length > 500) history.pop();
      await this.cache.set(
        this.generalHistoryKey,
        history,
        this.historyTtlSeconds,
      );
    } catch (e) {
      this.logger.warn(
        `Failed to append General audit: ${(e as Error)?.message}`,
      );
    }

    return next;
  }

  async getGeneralHistory(
    limit = 50,
    cursor = 0,
  ): Promise<{ items: GeneralAuditEvent[]; nextCursor: number | null }> {
    const history =
      (await this.cache.get<GeneralAuditEvent[]>(this.generalHistoryKey)) || [];
    const start = Math.max(0, cursor | 0);
    const end = Math.min(
      history.length,
      start + Math.max(1, Math.min(200, limit)),
    );
    const items = history.slice(start, end);
    const nextCursor = end < history.length ? end : null;
    return { items, nextCursor };
  }

  // --- Pricing rules audit ---
  async appendPricingAudit(event: PricingAuditEvent): Promise<void> {
    const history =
      (await this.cache.get<PricingAuditEvent[]>(this.pricingHistoryKey)) || [];
    history.unshift(event);
    while (history.length > 1000) history.pop();
    await this.cache.set(
      this.pricingHistoryKey,
      history,
      this.historyTtlSeconds,
    );
  }

  async getPricingHistory(
    limit = 50,
    cursor = 0,
  ): Promise<{ items: PricingAuditEvent[]; nextCursor: number | null }> {
    const history =
      (await this.cache.get<PricingAuditEvent[]>(this.pricingHistoryKey)) || [];
    const start = Math.max(0, cursor | 0);
    const end = Math.min(
      history.length,
      start + Math.max(1, Math.min(200, limit)),
    );
    const items = history.slice(start, end);
    const nextCursor = end < history.length ? end : null;
    return { items, nextCursor };
  }
}
