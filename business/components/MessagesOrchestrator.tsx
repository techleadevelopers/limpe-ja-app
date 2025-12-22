import React, { useEffect, useState } from 'react';
import GiftSplash from './GiftSplash';
import CouponModal from './coupons/CouponModal';

export default function MessagesOrchestrator() {
  const [showGift, setShowGift] = useState(true);
  const [showCoupon, setShowCoupon] = useState(false);

  useEffect(() => {
    if (!showGift) {
      setTimeout(() => setShowCoupon(true), 500);
    }
  }, [showGift]);

  return (
    <>
      {showGift && <GiftSplash onFinish={() => setShowGift(false)} />}
      <CouponModal
        visible={showCoupon}
        couponImage="https://cdn.limpeja.com/coupons/limpeja-premium.svg"
        onClose={() => setShowCoupon(false)}
        onUseCoupon={() => {}}
      />
    </>
  );
}
