import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { Router } from 'expo-router';

import BookServiceButton from './BookServiceButton';
import { VerificationStatus } from '../../../../types/backend/auth';

const createRouter = (): Router => ({
  push: jest.fn(),
} as unknown as Router);

describe('BookServiceButton', () => {
  const baseProps = {
    providerId: 'provider-1',
    router: createRouter(),
    bookNowButtonAnim: new Animated.Value(1),
    servicePrice: 120,
    isAuthenticated: true,
    verificationStatus: VerificationStatus.APPROVED,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows scheduling when provider is approved', () => {
    const router = createRouter();
    const { getByTestId } = render(
      <BookServiceButton
        {...baseProps}
        router={router}
        verificationStatus={VerificationStatus.APPROVED}
      />,
    );

    fireEvent.press(getByTestId('book-service-button'));
    expect(router.push).toHaveBeenCalled();
  });

  it('blocks scheduling and surfaces notice when provider is pending', () => {
    const router = createRouter();
    const { getByTestId, getByText } = render(
      <BookServiceButton
        {...baseProps}
        router={router}
        verificationStatus={VerificationStatus.PENDING_MANUAL_REVIEW}
      />,
    );

    const button = getByTestId('book-service-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(button);
    expect(router.push).not.toHaveBeenCalled();

    expect(getByText('Em verificação')).toBeTruthy();
    fireEvent.press(getByText('Entenda a verificação'));
    expect(router.push).toHaveBeenCalledWith('/client/explore/security');
  });
});
