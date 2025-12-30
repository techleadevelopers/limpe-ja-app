import { Logger } from '@nestjs/common';

const noop = (..._args: unknown[]): void => undefined;

Logger.log = noop;
Logger.debug = noop;
Logger.verbose = noop;

Logger.prototype.log = noop;
Logger.prototype.debug = noop;
Logger.prototype.verbose = noop;
