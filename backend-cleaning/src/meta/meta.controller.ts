import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MetaService, MetaStatusesResponse } from './meta.service';

@ApiTags('meta')
@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('statuses')
  getStatuses(): MetaStatusesResponse {
    return this.metaService.getStatusMetadata();
  }
}
