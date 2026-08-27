import { canTransition, OrderStatus } from '../src';

describe('Order state transitions', () => {
  it('allows created → pending_payment', () => {
    expect(canTransition('created', 'pending_payment')).toBe(true);
  });

  it('allows created → cancelled', () => {
    expect(canTransition('created', 'cancelled')).toBe(true);
  });

  it('rejects created → delivered', () => {
    expect(canTransition('created', 'delivered')).toBe(false);
  });

  it('allows pending_payment → paid', () => {
    expect(canTransition('pending_payment', 'paid')).toBe(true);
  });

  it('allows pending_payment → payment_failed', () => {
    expect(canTransition('pending_payment', 'payment_failed')).toBe(true);
  });

  it('allows pending_payment → expired', () => {
    expect(canTransition('pending_payment', 'expired')).toBe(true);
  });

  it('allows paid → fulfilled', () => {
    expect(canTransition('paid', 'fulfilled')).toBe(true);
  });

  it('allows fulfilled → shipped', () => {
    expect(canTransition('fulfilled', 'shipped')).toBe(true);
  });

  it('allows shipped → delivered', () => {
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });

  it('allows delivered → refunded', () => {
    expect(canTransition('delivered', 'refunded')).toBe(true);
  });

  it('rejects delivered → pending_payment', () => {
    expect(canTransition('delivered', 'pending_payment')).toBe(false);
  });

  it('rejects expired → any transition', () => {
    expect(canTransition('expired', 'pending_payment')).toBe(false);
    expect(canTransition('expired', 'paid')).toBe(false);
    expect(canTransition('expired', 'cancelled')).toBe(false);
  });

  it('rejects refunded → any transition', () => {
    expect(canTransition('refunded', 'paid')).toBe(false);
    expect(canTransition('refunded', 'cancelled')).toBe(false);
  });

  it('rejects cancelled → any transition', () => {
    expect(canTransition('cancelled', 'created')).toBe(false);
    expect(canTransition('cancelled', 'pending_payment')).toBe(false);
  });
});
