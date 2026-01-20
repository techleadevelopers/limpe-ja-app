import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export type LeakType = 'PHONE' | 'EMAIL' | 'LINK';

export interface ContactLeakResult {
  type: LeakType;
  matches: string[];
  hasLeak: boolean;
}

@Injectable()
export class ContactLeakDetector {
  private readonly phoneRegex =
    /(?:\+55[\s-]*)?(?:\(?\d{2}\)?[\s-]*)?(?:9\d{4}[\s-]?\d{4}|[2-8]\d{3}[\s-]?\d{4})/g;
  private readonly emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  private readonly linkRegex =
    /\b(?:https?:\/\/|whatsapp\.me\/|wa\.me\/|bit\.ly\/)[^\s]{5,}\b/gi;

  detect(content: string): ContactLeakResult | null {
    const normalized = content || '';
    const orderedChecks: Array<{ type: LeakType; matches: string[] }> = [
      { type: 'PHONE', matches: this.extractPhoneMatches(normalized) },
      {
        type: 'EMAIL',
        matches: this.extractMatches(this.emailRegex, normalized),
      },
      {
        type: 'LINK',
        matches: this.extractMatches(this.linkRegex, normalized),
      },
    ];

    for (const candidate of orderedChecks) {
      if (candidate.matches.length) {
        return {
          type: candidate.type,
          matches: [...new Set(candidate.matches)],
          hasLeak: true,
        };
      }
    }

    return null;
  }

  hashMatch(value: string): string {
    const normalized = value || '';
    const hash = createHash('sha256').update(normalized).digest('hex');
    return hash.slice(0, 16);
  }

  private extractMatches(regex: RegExp, content: string): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (match[0]) {
        matches.push(match[0].trim());
      }
    }
    regex.lastIndex = 0;
    return matches;
  }

  private extractPhoneMatches(content: string): string[] {
    const phoneMatches = this.extractMatches(this.phoneRegex, content);
    return phoneMatches.filter((candidate) => {
      const digits = candidate.replace(/\D/g, '');
      return digits.length >= 11;
    });
  }
}
