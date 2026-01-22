import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';

describe('DisputeController', () => {
  it('returns pending dispute count', async () => {
    const disputeService = {
      countPendingDisputes: jest.fn().mockResolvedValue(12),
    } as unknown as DisputeService;

    const controller = new DisputeController(disputeService);
    await expect(controller.getPendingCount()).resolves.toEqual({ count: 12 });
    expect(disputeService.countPendingDisputes).toHaveBeenCalled();
  });
});
