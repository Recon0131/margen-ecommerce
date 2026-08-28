# Margen — E-commerce demo (Peru / PEN)

A modular TypeScript e-commerce portfolio project for tech accessories sold in Peru
(currency PEN, decimal céntimos). Backed by a NestJS API, a Next.js storefront, a
BullMQ worker, PostgreSQL (Prisma), Redis, and a mockable Mercado Pago integration.

> Security controls follow OWASP ASVS (L2 baseline, several L3). See
> `docs/operations/security-runbook.md`, `docs/operations/incident-response.md`, and
> `docs/architecture.md`.

## Stack

- Monorepo: pnpm workspaces (`apps/api`, `apps/storefront`, `apps/worker`, `packages/*`)
- API: NestJS 11, Prisma 6, Postgres, Zod
- Storefront: Next.js 15 (App Router), client cart context, Mercado Pago mock
- Payments/resilience: BullMQ + Redis, merkado pago client (mockable)
- Quality: Jest (unit + e2e), Playwright (storefront E2E), gitleaks, `pnpm audit`

## Prerequisites

- Node 20–24, pnpm 9 (used via `corepack pnpm`)
- PostgreSQL running locally (role must be able to create the `margen` database)
- Redis for BullMQ jobs (optional at runtime; BullMQ tests skip gracefully when down)

## Setup

```bash
corepack pnpm install
```

Copy environment templates and set real values:
```bash
cp apps/api/.env.example apps/api/.env        # adjust DATABASE_URL etc.
cp apps/storefront/.env.local.example apps/storefront/.env.local
```

Apply migrations and seed the catalog:
```bash
corepack pnpm --filter api exec prisma migrate deploy
corepack pnpm --filter api exec prisma db seed
```

## Run locally

Build shared packages first (the API resolves them from `dist/`), then start apps:

```bash
corepack pnpm --filter "./packages/**" run build
corepack pnpm --filter api build
node apps/api/dist/main.js          # API on :3001 (never via tsx for DI metadata)
# in another terminal
cd apps/storefront && API_BASE_URL=http://127.0.0.1:3001 npx next dev -p 3000
```

## Demo journey (reproducible)

1. **Catalog** — `http://localhost:3000/catalogo` browse/search/filter products (seeded
   from DummyJSON; SKU `HUB-01` used by tests).
2. **Product** — open a product, **Añadir al carrito**; header badge updates.
3. **Cart** — `/carrito` edit quantities; quote shows server-side pricing.
4. **Checkout** — `/checkout` enter shipping and choose **BOLETA (DNI)** or
   **FACTURA (RUC)**; order is created (status `PENDING_PAYMENT`) and stock is reserved.
5. **Payment (mock)** — create a Mercado Pago preference via the API; webhook marks the
   order `PAID` (or `CANCELLED`) idempotently.
6. **Invoice** — `/v1/invoices` compiles a sequential BOLETA/FACTURA (see fiscal note).
7. **Admin** — `GET /v1/admin/users` requires an admin session (RBAC).

## Verify

```bash
corepack pnpm --filter api test          # unit + e2e (needs Postgres)
corepack pnpm --filter domain test
corepack pnpm --filter api typecheck
corepack pnpm --filter storefront typecheck
corepack pnpm audit --audit-level=high   # SCA
corepack pnpm build
# E2E (both servers running):
corepack pnpm --filter storefront exec playwright test --project="Desktop Chrome"
```

## Project notes

- Money is `bigint` minor units serialized as strings via `BigIntSerializerInterceptor`.
- Stock reservations are atomic SQL prevents overselling (see `concurrency-load`).
- Webhook payloads are validated; unknown event types are tolerated idempotently.
- Fiscal emission is a **structural demo** (BOLETA/FACTURA, DNI/RUC, series, numbering);
  live SUNAT transmission requires real credentials in a separate environment.
