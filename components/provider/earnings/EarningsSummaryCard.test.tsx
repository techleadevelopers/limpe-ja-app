import React from 'react';
import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';
import EarningsSummaryCard from './EarningsSummaryCard';

describe('EarningsSummaryCard', () => {
  it('exibe o saldo disponível usando availableForWithdrawal', () => {
    const animation = new Animated.Value(1);
    const { getByText } = render(
      <EarningsSummaryCard
        dashboardData={null}
        earningsData={{
          availableForWithdrawal: 123.45,
          pendingWithdrawals: 50.0,
          totalEarnings: 173.45,
        }}
        animation={animation}
      />,
    );

    expect(getByText('Saldo liberado')).toBeTruthy();
    expect(getByText('R$ 123,45')).toBeTruthy();
  });
});
