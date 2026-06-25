import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FeatureFlagKey =
  | 'payments'
  | 'invites'
  | 'realtime'
  | 'auditLogs'
  | 'rateLimiting';

@Injectable()
export class FeatureFlagsService {
  constructor(private config: ConfigService) {}

  isEnabled(flag: FeatureFlagKey): boolean {
    const envKey = `FEATURE_${flag.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    const value = this.config.get<string>(envKey);
    if (value === undefined) {
      return true;
    }
    return value === 'true' || value === '1';
  }

  getAll(): Record<FeatureFlagKey, boolean> {
    return {
      payments: this.isEnabled('payments'),
      invites: this.isEnabled('invites'),
      realtime: this.isEnabled('realtime'),
      auditLogs: this.isEnabled('auditLogs'),
      rateLimiting: this.isEnabled('rateLimiting'),
    };
  }
}
