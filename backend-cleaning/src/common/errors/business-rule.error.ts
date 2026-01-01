import { BadRequestException } from '@nestjs/common';

export class BusinessRuleError extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}
