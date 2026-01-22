import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ObservabilityModule } from './observability.module';
import { ObservabilityService } from './observability.service';

@Controller('latency-check')
class LatencyCheckController {
  @Get('ping')
  ping() {
    return { status: 'ok' };
  }
}

describe('Observability latency integration', () => {
  let app: INestApplication;
  let service: ObservabilityService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              observability: {
                latency: {
                  enabled: true,
                  sampleRateDefault: 1,
                  sampleRateCritical: 1,
                },
              },
            }),
          ],
        }),
        ObservabilityModule,
      ],
      controllers: [LatencyCheckController],
    }).compile();

    service = moduleRef.get(ObservabilityService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('populates latency series after traffic', async () => {
    await request(app.getHttpServer()).get('/latency-check/ping').expect(200);
    const series = service.getLatencySeries('/latency-check/ping');
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((entry) => entry.latencyMs >= 0)).toBe(true);
  });
});
