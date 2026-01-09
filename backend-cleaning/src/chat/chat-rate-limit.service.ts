// src/chat/chat-rate-limit.service.ts
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

@Injectable()
export class ChatRateLimitService {
  private readonly logger = new Logger(ChatRateLimitService.name);
  private readonly limit = 10;
  private readonly windowMs = 60_000;
  private readonly inMemoryStore = new Map<string, RateLimitEntry>();

  constructor(@Optional() private readonly cacheService?: CacheService) {}

  private getKey(chatId: string, senderId: string): string {
    return `chat:rate:${chatId}:${senderId}`;
  }

  private async readEntry(key: string): Promise<RateLimitEntry | undefined> {
    const now = Date.now();
    if (this.cacheService) {
      const cached = await this.cacheService.get<RateLimitEntry>(key);
      if (cached && cached.expiresAt > now) {
        return cached;
      }
      return undefined;
    }

    const entry = this.inMemoryStore.get(key);
    if (entry && entry.expiresAt > now) {
      return entry;
    }

    this.inMemoryStore.delete(key);
    return undefined;
  }

  private async writeEntry(key: string, entry: RateLimitEntry): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    if (this.cacheService) {
      await this.cacheService.set(key, entry, ttlSeconds);
      return;
    }

    this.inMemoryStore.set(key, entry);
    setTimeout(() => this.inMemoryStore.delete(key), Math.max(entry.expiresAt - Date.now(), 0));
  }

  async consume(chatId: string, senderId: string): Promise<{
    allowed: boolean;
    retryAfterMs: number;
    limit: number;
    windowMs: number;
  }> {
    const key = this.getKey(chatId, senderId);
    const now = Date.now();
    const existing = await this.readEntry(key);

    if (existing && existing.count >= this.limit) {
      const retryAfterMs = Math.max(existing.expiresAt - now, 0);
      return {
        allowed: false,
        retryAfterMs,
        limit: this.limit,
        windowMs: this.windowMs,
      };
    }

    const nextEntry: RateLimitEntry = existing && existing.expiresAt > now
      ? { count: existing.count + 1, expiresAt: existing.expiresAt }
      : { count: 1, expiresAt: now + this.windowMs };

    await this.writeEntry(key, nextEntry);
    const retryAfterMs = Math.max(nextEntry.expiresAt - now, 0);
    return {
      allowed: nextEntry.count <= this.limit,
      retryAfterMs,
      limit: this.limit,
      windowMs: this.windowMs,
    };
  }
}
