// progress.service.ts
@Injectable()
export class MissionProgressService {
  constructor(private prisma: PrismaService) {}

  async onEvent(userId: string, eventName: string, meta?: any) {
    await this.prisma.missionEvent.create({ data: { userId, name: eventName, meta } });

    // selecionar missões ativas que usam esse evento
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true, eventName },
    });

    for (const m of missions) {
      const where = { userId_missionId: { userId, missionId: m.id } };
      let prog = await this.prisma.missionProgress.findUnique({ where });

      // janela de tempo (opcional)
      const withinWindow = async (): Promise<boolean> => {
        if (!m.timeWindowDays) return true;
        if (!prog?.lastEventAt) return true; // inicia contagem
        const since = addDays(prog.lastEventAt, m.timeWindowDays);
        return new Date() <= since;
      };

      if (!prog) {
        prog = await this.prisma.missionProgress.create({
          data: { userId, missionId: m.id, currentValue: 0, status: 'ACTIVE' },
        });
      }

      if (prog.status !== 'ACTIVE') continue;
      if (!(await withinWindow())) {
        // janela resetada
        await this.prisma.missionProgress.update({
          where: { id: prog.id },
          data: { currentValue: 0 },
        });
      }

      const next = prog.currentValue + 1;
      const isCompleted = next >= m.targetValue;

      await this.prisma.missionProgress.update({
        where: { id: prog.id },
        data: {
          currentValue: next,
          lastEventAt: new Date(),
          ...(isCompleted ? { status: 'COMPLETED', completedAt: new Date() } : {}),
        },
      });
    }
  }
}
