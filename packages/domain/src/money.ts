export type Currency = 'PEN';
export type Money = { amountMinor: bigint; currency: Currency };
export type PricedLine = { unitAmountMinor: bigint; quantity: number; discountAmountMinor?: bigint };
export type TaxPolicy = { rateBps: number };
export type Totals = { subtotalMinor: bigint; discountMinor: bigint; taxMinor: bigint; totalMinor: bigint; currency: Currency };
const BPS_DENOMINATOR = 10_000n;
function requireNonNegativeBigInt(value: bigint, name: string): void { if (value < 0n) throw new RangeError(`${name} must be non-negative`); }
function requirePositiveInteger(value: number, name: string): void { if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive safe integer`); }
export function calculateTotals(lines: readonly PricedLine[], taxPolicy: TaxPolicy): Totals {
  if (!Number.isSafeInteger(taxPolicy.rateBps) || taxPolicy.rateBps < 0 || taxPolicy.rateBps > 10_000) throw new RangeError('taxPolicy.rateBps must be an integer between 0 and 10000');
  let subtotalMinor = 0n; let discountMinor = 0n;
  for (const line of lines) {
    requireNonNegativeBigInt(line.unitAmountMinor, 'unitAmountMinor'); requirePositiveInteger(line.quantity, 'quantity');
    const lineSubtotal = line.unitAmountMinor * BigInt(line.quantity); const lineDiscount = line.discountAmountMinor ?? 0n;
    requireNonNegativeBigInt(lineDiscount, 'discountAmountMinor'); if (lineDiscount > line.unitAmountMinor) throw new RangeError('discountAmountMinor cannot exceed unitAmountMinor');
    subtotalMinor += lineSubtotal; discountMinor += lineDiscount * BigInt(line.quantity);
  }
  const taxableMinor = subtotalMinor - discountMinor; const taxMinor = (taxableMinor * BigInt(taxPolicy.rateBps)) / BPS_DENOMINATOR;
  return { subtotalMinor, discountMinor, taxMinor, totalMinor: taxableMinor + taxMinor, currency: 'PEN' };
}
