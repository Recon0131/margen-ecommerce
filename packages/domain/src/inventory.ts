export type ReserveStockInput = { sku: string; requestedQuantity: number; onHand: number; reserved: number };
export type ReserveStockResult = { ok: true; sku: string; quantity: number; nextReserved: number } | { ok: false; sku: string; reason: 'insufficient_stock'; available: number };
function validQuantity(value: number): boolean { return Number.isSafeInteger(value) && value >= 0; }
export function reserveStock(input: ReserveStockInput): ReserveStockResult {
  if (!input.sku || !Number.isSafeInteger(input.requestedQuantity) || input.requestedQuantity <= 0 || !validQuantity(input.onHand) || !validQuantity(input.reserved)) throw new RangeError('stock quantities must be safe integers and requestedQuantity must be positive');
  const available = input.onHand - input.reserved;
  if (input.requestedQuantity > available) return { ok: false, sku: input.sku, reason: 'insufficient_stock', available: Math.max(0, available) };
  return { ok: true, sku: input.sku, quantity: input.requestedQuantity, nextReserved: input.reserved + input.requestedQuantity };
}
