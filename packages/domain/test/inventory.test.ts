import { reserveStock } from '../src';

describe('reserveStock', () => {
  it('returns a reservation delta without mutating the supplied inventory snapshot', () => {
    const input = { sku: 'HUB-01', requestedQuantity: 2, onHand: 5, reserved: 1 };

    expect(reserveStock(input)).toEqual({ ok: true, sku: 'HUB-01', quantity: 2, nextReserved: 3 });
    expect(input.reserved).toBe(1);
  });

  it('rejects a request that would oversell available stock', () => {
    expect(reserveStock({ sku: 'HUB-01', requestedQuantity: 5, onHand: 5, reserved: 1 })).toEqual({
      ok: false, sku: 'HUB-01', reason: 'insufficient_stock', available: 4,
    });
  });
});
