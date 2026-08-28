---
name: margen
description: Working on the MARGEN e-commerce platform (Next.js, NestJS, Prisma, PostgreSQL, Redis, BullMQ). Use when building features, fixing bugs, running tests, or making any changes to the MARGEN codebase. Tracks architecture, conventions, progress, and gotchas.
---

# MARGEN E-Commerce Platform

## Quick Reference

- **Worktree:** `D:\E-Commerce\.worktrees\margen-ecommerce`
- **Branch:** `feat/margen-ecommerce`
- **Package manager:** `corepack pnpm` (NOT plain pnpm)
- **DB:** PostgreSQL at `127.0.0.1:5432/margen`, user `postgres`/`postgres`
- **Prisma URL:** `postgresql://postgres:postgres@127.0.0.1:5432/margen`
- **API port:** 3001 | **Storefront port:** 3000

## Architecture

Monorepo with pnpm workspaces. Modular monolith pattern — modules communicate via services, not direct table access.

```
apps/api/          NestJS REST API (controllers → services → repositories → Prisma)
apps/storefront/   Next.js 15 App Router (server components, fetches from API)
apps/worker/       BullMQ job processor (not yet implemented)
packages/config/   Zod-validated environment config
packages/contracts/ Zod schemas shared between API and frontend
packages/domain/   Pure business logic (money, order-state, inventory)
packages/ui/       Shared React components + CSS tokens
```

## Tech Stack & Versions

- TypeScript strict, Node.js LTS
- NestJS 11, Next.js 15, Prisma 6.2, Zod 3.24
- Jest 30 + ts-jest (API tests), Playwright + axe-core (storefront E2E)
- tsx 4.20 (dev runner), tsc (build via `tsconfig.build.json`)

## Critical Conventions

### Money
- **Always bigint minor units** (céntimos PEN). Never floats.
- `priceMinor: bigint` in Prisma, serialized as string in JSON.
- `BigIntSerializerInterceptor` wires globally in `apps/api/src/interceptors/`.
- `formatPrice()` in `apps/storefront/lib/product-types.ts` renders `S/ X.XX`.

### Security (OWASP ASVS L2/L3)
- Specs in `parametros-seguridad-ecommerce-node.md` (root)
- No secrets in logs, no card numbers stored, CSP restrictive
- Session cookies: `Secure`, `HttpOnly`, `SameSite`
- Rate limits, CORS explicit origins, input validation via Zod

### Module Pattern (NestJS)
Each feature module follows:
```
modules/<name>/
  <name>.module.ts        NestJS module wiring
  <name>.controller.ts    HTTP endpoints, Zod validation
  <name>.service.ts       Business logic
  <name>.repository.ts    Prisma data access (optional)
  __tests__/              Unit/integration tests
```
Controller validates with Zod schemas from `@margen/contracts`.
Service contains business logic, never raw Prisma in controllers.
Module exports service for cross-module consumption.

### Testing
- **API unit tests:** `corepack pnpm --filter api test`
- **Domain tests:** `corepack pnpm --filter domain test`
- **Storefront E2E:** `corepack pnpm --filter storefront exec playwright test --project="Desktop Chrome"`
- **Typecheck:** `corepack pnpm --filter api typecheck`
- Jest auto-loads `.env` via `test/jest-setup.cjs`
- E2E tests need API running at port 3001

### Build
- API build: `corepack pnpm --filter api build` (uses `tsconfig.build.json`)
- Package builds output to `packages/*/dist/`
- `tsx` does NOT handle `emitDecoratorMetadata` — run compiled dist via `node dist/main.js`

## Current Progress

| Task | Commit | Status |
|------|--------|--------|
| 1. Monorepo bootstrap | `5943263`, `8597db5` | Done |
| 2. Domain, contracts, schema | `77ba78e` | Done |
| 3. Catalog + DummyJSON | `6006223` | Done |
| 4. Storefront + catalog UI | `bf3fe69` | Done |
| 5. Cart, orders, inventory | `5c8fe10` | Done |
| 6. Identity, sessions, admin | `04a7f43` | Done |
| 7. Mercado Pago + webhooks | `b4b37cb` | Done |
| 8. PDF invoices + fiscal | `a8a5385` | Done |
| 9. Storefront integration | — | **Next (done, uncommitted)** |
| 10. Hardening + docs | — | Pending |

## Test Counts (as of Task 8-9)

- API: 69/69 (health, env, catalog, checkout, inventory concurrency, identity, authorization, payments, bullmq, invoices, mappers, services, prisma schema)
- Domain: 18/18 (money, order-state, inventory)
- Storefront E2E: 9/9 (catalog×6, cart×3)
- Storefront build: OK

## Storefront Pages

- `/catalogo` — server component, search/filter
- `/producto/[slug]` — server component, AddToCart button
- `/carrito` — client, cart context + server quote
- `/checkout` — client, creates order (shipping + BOLETA/FACTURA)
- `/login`, `/registro` — client auth forms
- Cart state: `lib/cart-context.tsx` (localStorage `margen_cart`)
- Cart header badge: `components/CartButton.tsx`
- Auth requires `credentials: 'include'` (cross-origin cookies): `jsonRequestWithCookies`

## Running E2E (needs both servers)

```bash
# API (from dist, NOT tsx)
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/margen PORT=3001 NODE_ENV=test node dist/main.js
# Storefront
#   API_BASE_URL=http://127.0.0.1:3001 next dev -p 3000
corepack pnpm --filter storefront exec playwright test --project="Desktop Chrome"
```

## Gotchas

- **Build order**: `pnpm -r --filter "./packages/**" run build` BEFORE `pnpm --filter api build` (packages resolve from dist/ in node_modules).
- **Stale `.env`**: `apps/api/.env` must use `postgresql://postgres:postgres@127.0.0.1:5432/margen` (NOT localhost, NOT margen user).
- **Migrations**: Run `pnpm --filter api prisma migrate deploy` to apply pending migrations; `migrate dev` also works.
- **Redis**: BullMQ is lazy-initialized; bullmq tests skip gracefully when Redis (6379) is down.
- **Playwright hydration**: product pages are server-rendered; click add-to-cart needs a hydration retry (use `.toPass()` poll on cart badge).

## Plan & Specs

- **Implementation plan:** `docs/superpowers/plans/2026-08-26-margen-ecommerce-implementation.md`
- **Security params:** `parametros-seguridad-ecommerce-node.md`
- **Tracking dir:** `.superpowers/sdd/2026-08-26-margen-ecommerce-implementation/` (gitignored)

## Running the Stack

```bash
# Start API (from dist)
cd apps/api; $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/margen"; $env:NODE_ENV="test"; $env:PORT="3001"; node dist/main.js

# Start storefront
cd apps/storefront; npx next dev -p 3000

# Run all tests
corepack pnpm --filter api test; corepack pnpm --filter domain test; corepack pnpm --filter storefront exec playwright test --project="Desktop Chrome"
```
