# Security Runbook

Operational checklist for keeping the Margen API and storefront secure. This is the
operational counterpart of the OWASP ASVS requirements addressed in the code.

## Defense-in-depth controls (implemented)

| Control | Where | Verified by |
|---------|-------|-------------|
| CSP + security headers (nosniff, DENY framing, no-referrer, permissions-policy) | `SecurityHeadersMiddleware` | `security-controls` |
| Request correlation id (`x-request-id`) | `CorrelationIdMiddleware` | `security-controls` |
| Route-scoped rate limits (429 + Retry-After) | `RateLimitGuard` + `rate-limit.config` | `security-controls` |
| Non-revealing error shape `{code,message,correlationId}` | `GlobalExceptionFilter` | `security-controls` |
| CORS explicit origins | `main.ts` (`corsOrigins`) | env validation |
| Argon2id password hashing | `PasswordService` | `identity-security` |
| HttpOnly/SameSite session cookie | `SessionService` | `identity-security` |
| RBAC (admin) | `RbacGuard` + `@Roles()` | `authorization` |
| Atomic stock reservation (no oversell) | `InventoryService` | `concurrency-load`, `inventory.concurrency` |
| Webhook payload validation + idempotency | `PaymentsService` | `webhook-fuzz`, `payments` |
| SSRF allowlist for upstream fetch | `validateUpstreamUrl` | `security-controls` |
| Audit trail | `AuditService` | `identity-security` |

## Dependency hygiene (SCA)

Run monthly (and in CI on every push):

```bash
corepack pnpm install
corepack pnpm audit --audit-level=high
```

- Critical/high findings are fixed by upgrading the direct dependency or adding a pnpm
  `overrides` entry (see `package.json` `pnpm.overrides` for `multer`,
  `path-to-regexp`, `postcss`, `sharp`, `file-type`).
- Moderate findings are reviewed; remediated when a low-risk upgrade exists.

## Secret / leak scan (SAST)

`gitleaks` runs in CI. Before committing, always verify:

```bash
git diff --check
```

Never commit real Mercado Pago tokens, SUNAT credentials, or S3 secrets. Only commit
`.env.example` placeholders.

## Credential rotation

- Rotate `SESSION_SECRET` on any suspicion of exposure; rotating invalidates session
  signatures (production) and forces re-login.
- Rotate `MP_ACCESS_TOKEN` in the Mercado Pago dashboard; update `MP_WEBHOOK_SECRET`
  afterward and note that webhook signatures must be re-issued.
- Rotate S3 keys by creating a new key pair in the object store and updating
  `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`, then revoking the old pair after a
  soak window.

## Integration revocation

To immediately stop a compromised integration:
1. Revoke `MP_ACCESS_TOKEN` in Mercado Pago.
2. Rotate `MP_WEBHOOK_SECRET`.
3. Restrict `CORS_ORIGINS` to the canonical domain.
4. If the storefront cookie is suspected stolen, bump `SESSION_SECRET` and set cookie
   `Secure` via a trusted reverse proxy in production.

## Release gating

Before a release:

```bash
corepack pnpm lint && corepack pnpm typecheck
corepack pnpm --filter api test && corepack pnpm --filter domain test
corepack pnpm audit --audit-level=high
corepack pnpm build
corepack pnpm --filter storefront exec playwright test --project="Desktop Chrome"
git diff --check
```

A release is not green unless: no secrets detected, no uncommitted reviewed changes, no
critical/high audit findings, and the end-to-end journey (catalog → cart → reservation →
mock payment → webhook → invoice → admin) passes.
