import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { findRateLimitRule } from './rate-limit.config';

type Counter = { count: number; resetAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Counter>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const path = req.path ?? req.url?.split('?')[0] ?? '';
    const method = req.method ?? 'GET';
    const ip = req.ip ?? 'unknown';
    const rule = findRateLimitRule(method, path);
    if (!rule) return true;

    const key = `${method}:${path}:${ip}`;
    const now = Date.now();
    const current = this.store.get(key);

    if (!current || now >= current.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + rule.windowMs });
      return true;
    }

    if (current.count >= rule.limit) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      const res = context.switchToHttp().getResponse<any>();
      if (res?.setHeader) res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    return true;
  }
}
