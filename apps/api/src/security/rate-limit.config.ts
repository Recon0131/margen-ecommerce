export type RateLimitRule = {
  method: string;
  pathPattern: RegExp;
  limit: number;
  windowMs: number;
};

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  { method: 'POST', pathPattern: /^\/v1\/auth\/login$/, limit: 5, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/auth\/register$/, limit: 10, windowMs: 60_000 },
  { method: 'GET', pathPattern: /^\/v1\/catalog\/products$/, limit: 60, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/cart$/, limit: 30, windowMs: 60_000 },
  { method: 'PATCH', pathPattern: /^\/v1\/cart\//, limit: 60, windowMs: 60_000 },
  { method: 'GET', pathPattern: /^\/v1\/cart\/quote/, limit: 60, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/orders$/, limit: 20, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/payments\/checkout$/, limit: 20, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/payments\/webhook$/, limit: 60, windowMs: 60_000 },
  { method: 'POST', pathPattern: /^\/v1\/invoices$/, limit: 30, windowMs: 60_000 },
];

export function findRateLimitRule(method: string, path: string): RateLimitRule | undefined {
  return RATE_LIMIT_RULES.find(
    (rule) => rule.method.toUpperCase() === method.toUpperCase() && rule.pathPattern.test(path),
  );
}
