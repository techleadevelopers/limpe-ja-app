from pathlib import Path
p=Path("src/bookings/bookings.service.ts")
text=p.read_text(encoding="utf-8")
old="""  async completeService(bookingId: string, providerUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true, paymentIntent: true },
    });
    if (!booking) throw new NotFoundException('Agendamento nao encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode concluir.');
    if (booking.status !== BookingStatus.IN_PROGRESS)
      throw new BadRequestException('Status inválido para concluir.');
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento nao confirmado.');

    const expectedEnd = this.getExpectedEnd(booking);
    if (new Date() < expectedEnd)
      throw new BadRequestException('Ainda nao atingiu o horário final.');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        completedAt: new Date(),
        status: BookingStatus.COMPLETED,
        completedByUserId: providerUserId,
      },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        paymentIntent: true,
      },
    });
  }
"""
new="""  async completeService(bookingId: string, providerUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        client: { include: { user: true } },
        paymentIntent: true,
      },
    });
    if (!booking) throw new NotFoundException('Agendamento nao encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode concluir.');
    if (booking.status !== BookingStatus.IN_PROGRESS)
      throw new BadRequestException('Status inválido para concluir.');
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento nao confirmado.');

    const expectedEnd = this.getExpectedEnd(booking);
    if (new Date() < expectedEnd)
      throw new BadRequestException('Ainda nao atingiu o horário final.');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        completedAt: new Date(),
        status: BookingStatus.COMPLETED,
        completedByUserId: providerUserId,
      },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        paymentIntent: true,
      },
    });

    try {
      if (updated.client?.userId) {
        await this.queuesService.addNotificationJob('send-notification', {
          userId: updated.client.userId,
          kind: 'booking_completed',
          title: 'Serviço concluído',
          body: `Seu atendimento com ${updated.provider?.user?.fullName || 'prestador'} foi concluído.`,
          deeplink: `/(client)/bookings/${updated.id}`,
          priority: 1,
          idempotencyKey: `notif:booking_completed:client:${updated.id}`,
        });
      }
      if (updated.provider?.userId) {
        await this.queuesService.addNotificationJob('send-notification', {
          userId: updated.provider.userId,
          kind: 'booking_completed',
          title: 'Serviço concluído',
          body: `Atendimento ${updated.id} marcado como concluído.`,
          deeplink: `/(provider)/active-booking/${updated.id}`,
          priority: 1,
          idempotencyKey: `notif:booking_completed:provider:${updated.id}`,
        });
      }
    } catch (e):
      this.logger.warn(
        `[BookingsService] Falha ao notificar conclusão do booking ${updated.id}: ${e?.message || e}`,
      );

    return updated;
  }
"""
if old not in text:
    raise SystemExit('block not found')
p.write_text(text.replace(old,new), encoding='utf-8')
