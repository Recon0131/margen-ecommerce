import { Injectable, NestMiddleware } from '@nestjs/common';
import crypto from 'node:crypto';

type Req = { header(name: string): string | undefined } & Record<string, unknown>;
type Res = { setHeader(name: string, value: string): void };
type Next = () => void;

export const CORRELATION_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Req, res: Res, next: Next): void {
    const incoming = req.header(CORRELATION_HEADER);
    const id = incoming && incoming.length <= 64 ? incoming : crypto.randomUUID();
    (req as any).correlationId = id;
    res.setHeader(CORRELATION_HEADER, id);
    next();
  }
}
