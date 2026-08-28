import { Injectable, NestMiddleware } from '@nestjs/common';

type Res = { setHeader(name: string, value: string): void };
type Next = () => void;
type Req = Record<string, unknown>;

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Req, res: Res, next: Next): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    );
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), battery=()',
    );
    next();
  }
}
