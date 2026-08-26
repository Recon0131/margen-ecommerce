export const ORDER_STATUSES = ['created', 'pending_payment', 'paid', 'fulfilled', 'shipped', 'delivered', 'expired', 'cancelled', 'payment_failed', 'partially_refunded', 'refunded', 'chargeback'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
const transitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  created: ['pending_payment', 'cancelled'], pending_payment: ['paid', 'payment_failed', 'expired', 'cancelled'], paid: ['fulfilled', 'partially_refunded', 'refunded', 'chargeback'], fulfilled: ['shipped', 'partially_refunded', 'refunded', 'chargeback'], shipped: ['delivered', 'partially_refunded', 'refunded', 'chargeback'], delivered: ['partially_refunded', 'refunded', 'chargeback'], expired: [], cancelled: [], payment_failed: [], partially_refunded: ['refunded'], refunded: [], chargeback: [],
};
export function canTransition(from: OrderStatus, to: OrderStatus): boolean { return transitions[from].includes(to); }
