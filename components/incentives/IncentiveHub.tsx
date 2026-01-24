// components/incentives/IncentiveHub.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { getIncentivesForHome, dismissIncentive } from '../../services/incentiveService';
import type { IncentiveMessage } from '../../types/backend/incentives';

// ✅ Usamos APENAS o BottomSlideInCard
import BottomSlideInCard from '../common/BottomSlideInCard';

import { HtmlCouponCard } from '../coupons/HtmlCouponCard';
import { ReturnCouponCard } from '../coupons/ReturnCouponCard';
import { ReferralBanner } from '../referrals/ReferralBanner';
import { CouponPill } from '../coupons/CouponPill';

interface Props {
  onUseCoupon?: (code: string) => void;   // navegar para scheduling com couponCode
  onShareReferral?: (code: string) => void;
}

const IncentiveHub: React.FC<Props> = ({ onUseCoupon, onShareReferral }) => {
  const [items, setItems] = useState<IncentiveMessage[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    getIncentivesForHome().then(setItems).catch(() => setItems([]));
  }, []);

  const current = items[0];

  const handleDismiss = useCallback(async () => {
    if (current) await dismissIncentive(current.id, 48);
    setOpen(false); // mantém o pill para reabrir depois
  }, [current]);

  const handleUseNow = useCallback((code: string) => {
    onUseCoupon?.(code);
    void handleDismiss();
  }, [onUseCoupon, handleDismiss]);

  const body = useMemo(() => {
    if (!current) return null;

    switch (current.kind) {
      case 'COUPON_WELCOME': {
        const p = current.payload as any;
        return (
          <HtmlCouponCard
            code={p.code}
            title={current.title}
            subtitle={current.subtitle}
            expiresAt={p.expiresAt}
            onUseNow={handleUseNow}
            onDismiss={handleDismiss}
          />
        );
      }
      case 'COUPON_RETURN': {
        const p = current.payload as any;
        return (
          <ReturnCouponCard
            code={p.code}
            title={current.title}
            expiresAt={p.expiresAt}
            onRebookNow={handleUseNow}
          />
        );
      }
      case 'REFERRAL': {
        const p = current.payload as any;
        return (
          <ReferralBanner
            code={p.myCode}
            rewardReferrer={p.rewardReferrer}
            rewardReferred={p.rewardReferred}
            onShare={() => onShareReferral?.(p.myCode)}
            onHowItWorks={() => {}}
            onDismiss={handleDismiss}
          />
        );
      }
      case 'CASHBACK':
      case 'MISSION_PUSH': {
        // mensagem leve reutilizando o mesmo card visual
        return (
          <HtmlCouponCard
            code={'GANHE-30'}
            title={current.title}
            subtitle={current.subtitle}
            expiresAt={null}
            onUseNow={() => {}}
            onDismiss={handleDismiss}
          />
        );
      }
      default:
        return null;
    }
  }, [current, handleDismiss, handleUseNow, onShareReferral]);

  if (!current) return null;

  // 🔧 Compat: algumas versões do BottomSlideInCard usam `visible`,
  // outras `isVisible`. Também pode existir `onClose`.
  // Para não quebrar tipagem, espalhamos via `any`.
  const slideProps: any = {
    visible: open,
    isVisible: open,
    onClose: () => setOpen(false),
  };

  return (
    <>
      {/* Pill para reabrir se o usuário fechar o card */}
      {!open && current.kind !== 'REFERRAL' && (
        <CouponPill code="Ver oferta" onOpen={() => setOpen(true)} />
      )}

      <BottomSlideInCard {...slideProps}>
        {body}
      </BottomSlideInCard>
    </>
  );
};

export default IncentiveHub;
