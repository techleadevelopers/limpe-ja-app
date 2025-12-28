import {
  applyTransition,
  assertTransition,
  canTransition,
} from './payment.state-machine';

describe('Payment state machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('CREATED', 'PENDING')).toBe(true);
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    assertTransition('PENDING', 'CONFIRMED');
    expect(applyTransition('CREATED', 'PENDING')).toBe('PENDING');
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('CREATED', 'CONFIRMED')).toBe(false);
    expect(() => assertTransition('CREATED', 'CONFIRMED')).toThrow(
      'Invalid transition CREATED -> CONFIRMED',
    );
  });

  it('is idempotent when target equals current', () => {
    expect(applyTransition('CONFIRMED', 'CONFIRMED')).toBe('CONFIRMED');
    expect(() => assertTransition('CONFIRMED', 'CONFIRMED')).not.toThrow();
  });
});
