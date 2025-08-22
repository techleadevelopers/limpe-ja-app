// missions.service.ts
@Injectable()
export class MissionsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    // pega todas as missões ativas e junta com progresso do usuário
    const missions = await this.prisma.mission.findMany({ where: { isActive: true } });
    const progress = await this.prisma.missionProgress.findMany({ where: { userId } });
    const map = new Map(progress.map(p => [p.missionId, p]));
    return missions.map(m => {
      const p = map.get(m.id);
      return {
        ...m,
        currentValue: p?.currentValue ?? 0,
        status: p?.status ?? 'ACTIVE',
      };
    });
  }

  async claim(userId: string, missionId: string) {
    const prog = await this.prisma.missionProgress.findUnique({ where: { userId_missionId: { userId, missionId } }, include: { mission: true } });
    if (!prog || prog.status !== 'COMPLETED') throw new BadRequestException('Missão não concluída.');
    // entregar recompensa
    if (prog.mission.rewardType === 'COUPON') {
      await this.issueCoupon(userId, prog.mission);
    } else if (prog.mission.rewardType === 'POINTS') {
      await this.grantPoints(userId, prog.mission.rewardValue);
    }
    return this.prisma.missionProgress.update({
      where: { id: prog.id },
      data: { status: 'CLAIMED', claimedAt: new Date() },
    });
  }

  private async issueCoupon(userId: string, mission: Mission) {
    // integrar com seu módulo de coupons (já há services/couponService.ts no FE). :contentReference[oaicite:3]{index=3}
    // ex.: criar cupom único p/ esse usuário baseado em template
    await this.prisma.coupon.create({
      data: {
        code: `${mission.code}-${userId}`.slice(0, 24),
        percentOff: mission.rewardValue,
        userId,
        expiresAt: addDays(new Date(), 30),
        source: 'MISSION',
        missionId: mission.id,
      }
    });
  }

  private async grantPoints(userId: string, points: number) {
    // se já tiver módulo loyalty, some pontos; se não, crie uma tabela simples LoyaltyBalance.
    await this.prisma.loyaltyBalance.upsert({
      where: { userId },
      update: { points: { increment: points } },
      create: { userId, points },
    });
  }
}
