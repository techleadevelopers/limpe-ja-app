import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

describe('SafetyController', () => {
  it('returns pending counts', async () => {
    const safetyService = {
      countPendingSafetyAlerts: jest.fn().mockResolvedValue(3),
    } as unknown as SafetyService;

    const controller = new SafetyController(safetyService);
    await expect(controller.getPendingCount()).resolves.toEqual({ count: 3 });
    expect(safetyService.countPendingSafetyAlerts).toHaveBeenCalled();
  });
});
