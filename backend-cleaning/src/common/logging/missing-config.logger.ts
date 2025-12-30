import { Logger } from '@nestjs/common';

const loggedMissingConfig = new Set<string>();

export function logMissingConfigOnce(key: string, message: string): void {
  if (loggedMissingConfig.has(key)) {
    return;
  }

  loggedMissingConfig.add(key);
  new Logger('Config').warn(message);
}
