import { calculateTotals, TaxPolicy } from '../src';

const noTax: TaxPolicy = { rateBps: 0 };

describe('calculateTotals', () => {
  it('adds PEN minor units without floating point', () => {
    expect(calculateTotals([{ unitAmountMinor: 1099n, quantity: 2 }], noTax).totalMinor).toBe(2198n);
  });

  it('applies discounts and a configurable basis-point tax policy exactly', () => {
    expect(calculateTotals([
      { unitAmountMinor: 1000n, quantity: 3, discountAmountMinor: 100n },
    ], { rateBps: 1800 })).toEqual({
      subtotalMinor: 3000n,
      discountMinor: 300n,
      taxMinor: 486n,
      totalMinor: 3186n,
      currency: 'PEN',
    });
  });
});
