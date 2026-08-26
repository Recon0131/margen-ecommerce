import { canTransition } from '../src';

describe('canTransition', () => {
  it('rejects a delivery transition before shipping', () => {
    expect(canTransition('pending_payment', 'delivered')).toBe(false);
  });

  it('allows the normal fulfilled to shipped transition', () => {
    expect(canTransition('fulfilled', 'shipped')).toBe(true);
  });
});
