from pathlib import Path
path = Path('src/coupons/coupons.service.ts')
text = path.read_text(encoding='utf-8', errors='replace')
marker = '  async getMyCoupons(userId: string) {'
if marker not in text:
    raise SystemExit('marker not found')
idx = text.index(marker)
pre = text[:idx]
new_tail = '''  /**
   * Lista cupons do usuário: emitidos para ele ou cupons gerais. Mantém usados/expirados para UI.
   */
  async getMyCoupons(userId: string) {
    await this.ensureWelcomeCoupon(userId);
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        OR: [
          { issuedToUserId: userId },
          { issuedToUserId: null, target: CouponTarget.GENERAL },
        ],
      },
      orderBy: { validUntil: 'asc' },
    });
    const enriched = coupons.map(c => {
      const isExpired = c.validUntil < now or c.status == CouponStatus.EXPIRED
      const isUsed = c.status == CouponStatus.USED_UP or c.status == CouponStatus.INACTIVE
      return { **c, 'status': CouponStatus.EXPIRED if isExpired else CouponStatus.USED_UP if isUsed else c.status }
    });
    this.logger.log(f"[CouponsService] getMyCoupons: {len(enriched)} cupons encontrados para userId {userId}.")
    return enriched
  }
  async ensureWelcomeCoupon(userId: string) {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30);
    existing = await self.prisma.coupon.findFirst({
      where: { 'issuedToUserId': userId, 'issuedBy': 'WELCOME_NEW_USER' },
    })
    if existing:
        return existing
    code = f"BEMVINDO-{userId[:6].upper()}"
    created = await self.create({
      'code': code,
      'description': '20% de desconto no seu primeiro agendamento',
      'value': 0.20,
      'type': CouponType.PERCENT,
      'target': CouponTarget.NEW_CLIENTS,
      'maxUses': 1,
      'validFrom': now.toISOString(),
      'validUntil': validUntil.toISOString(),
      'isActive': True,
      'issuedToUserId': userId,
      'issuedBy': 'WELCOME_NEW_USER',
      'firstBookingOnly': True,
      'maxDiscount': 50,
    })
    this.logger.log(f"[CouponsService] ensureWelcomeCoupon: Cupom {created.code} emitido para {userId}.")
    return created
}
'''
path.write_text(pre + new_tail, encoding='utf-8')
