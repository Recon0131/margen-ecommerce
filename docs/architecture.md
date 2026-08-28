# Margen — Architecture

Margen is a modular e-commerce platform for tech accessories in Peru (PEN). It is a
TypeScript monorepo organized with pnpm workspaces.

## Repo layout

```
apps/
  api/          NestJS 11 REST API (catalog, cart, orders, inventory, identity, admin,
                payments, invoicing, audit)
  storefront/   Next.js 15 App Router public storefront (catalog, cart, checkout, login)
  worker/       BullMQ worker (reserved; fulfillment jobs are enqueued from the API)
packages/
  domain/       Pure business logic (money, order-state, inventory reservation)
  contracts/    Zod schemas + shared types between API and storefront
  config/       Environment validation (AppConfig)
  ui/           Shared React UI primitives (Button, etc.)
infra/          docker-compose for local Postgres + Redis
.github/        CI workflow
```

## Component diagram

```
                         ┌─────────────────────────────┐
                         │     Storefront (Next.js)    │
                         │  /catalogo /carrito /checkout│
                         │  /login /registro /admin     │
                         └──────────────┬──────────────┘
                                        │ HTTPS (JSON + cookie)
                                        ▼
                 ┌───────────────────────────────┐
                 │            API (NestJS)       │
                 │  Security: CORS, CSP headers, │
                 │  rate limits, correlation-id, │
                 │  HttpOnly session cookie      │
                 └───┬──────┬──────┬──────┬──────┘
                     │      │      │      │
         ┌───────────┘      │      │      └──────────────┐
         ▼                  ▼      ▼                     ▼
   ┌──────────┐      ┌──────────┐ ┌────────┐     ┌──────────┐
   │ Postgres │      │   Redis  │ │ Mercado│     │ DummyJSON│
   │(Prisma)  │      │ (BullMQ) │ │ Pago   │     │ (upstream│
   └──────────┘      └──────────┘ └────────┘     │  catalog)│
                                                └──────────┘
```

## Key decisions

- **Money**: integer minor units (céntimos de sol, `bigint`) serialized as strings by a
  global `BigIntSerializerInterceptor`. Floating point is never used for currency.
- **Inventory**: atomic `UPDATE ... WHERE ("onHand" - "reserved") >= qty` prevents
  overselling under concurrency (verified by `concurrency-load` and
  `inventory.concurrency` tests). Stock reservations carry a 15-minute TTL and are
  released by `releaseExpiredReservations`.
- **Identity**: passwords hashed with Argon2id. Sessions are random tokens stored as
  hashes, delivered in an `HttpOnly; SameSite=Lax` cookie (`margen_session`), 24h TTL.
  RBAC via `UserRole` join table, enforced by `RbacGuard` + `@Roles()`.
- **Payments**: Mercado Pago via a `MercadoPagoClient` (mockable). Webhook endpoint is
  idempotent and pays no attention to unknown event types. `PaymentAttempt` records each
  attempt with an idempotency key.
- **Invoicing**: BOLETA (8-digit DNI) / FACTURA (11-digit RUC) with sequential numbering
  per series (`B001` / `F001`). `Invoice` is a fiscal record.
- **Audit**: `AuditService` records sanitized events (UTC timestamp, actor/service,
  action, resource, outcome, correlation id, severity).
- **Upstream SSRF guard**: `validateUpstreamUrl` only allows `https://dummyjson.com`
  and rejects private/loopback ranges.

## Environment variables

Required by `packages/config` (see `apps/api/.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string (BullMQ) |
| `SESSION_SECRET` | Signing secret (reserved for production signatures) |
| `APP_ORIGIN` | Canonical storefront origin |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `MP_ACCESS_TOKEN` | Mercado Pago access token |
| `MP_WEBHOOK_SECRET` | Mercado Pago webhook signing secret |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Object store (invoices) |

## Fiscal vs. authorized emission

- **Preview**: the `/v1/invoices` endpoint returns compiled invoice data with correct
  sequential numbering and per-series sequence seeds persisted in the DB. It is safe for
  a demo portfolio.
- **Authorized emission**: connecting a real SUNAT/SEE (or an authorized e-invoicing
  provider) must be done in a separate environment with real credentials. The demo only
  exercises the fiscal *structure* (BOLETA/FACTURA, DNI/RUC, series, numbering), not
  live SUNAT transmission.

## DummyJSON limits

- Upstream: `https://dummyjson.com`. Timeout 10s, 5 MB response cap, HTTPS + allowlist
  enforced, image hosts restricted to `cdn.dummyjson.com` / `dummyjson.com`.
- The catalog sync is a one-off import/refresh; it is not a synchronous dependency of
  the storefront at request time.
