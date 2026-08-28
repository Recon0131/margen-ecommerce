# Incident Response

Process for responding to security or availability incidents on the Margen platform.

## Severity levels

| Level | Examples | Response SLA |
|-------|----------|--------------|
| SEV-1 | Payment data breach, credential exposure, service down, oversell | Immediate / 15 min |
| SEV-2 | Partial outage, rate-limit bypass, abuse spike | 1 hour |
| SEV-3 | Minor misconfiguration, cosmetic leak | 1 business day |

## Roles & contacts

- **On-call engineer**: first responder, triages and mitigates.
- **App owner**: decides on disabling features or revoking integrations.
- **Communications**: drafts customer/SUNAT-facing notices if required.
- Escalation path documented in the deployment notes; page contacts via the operational
  messaging channel.

## Detection

- CI `pnpm audit` and `gitleaks` (on push).
- Uptime/health probe of `GET /health`.
- Audit events written by `AuditService` (login, order, payment, invoice actions).
- Bulk-error monitoring of the API exception log (correlation id present).

## Triage & containment (first responder)

1. Confirm severity (SEV-1 or SEV-2).
2. Contain: for an exposed secret, revoke immediately; for a payment/abuse issue,
   consider pausing checkout (`POST /v1/payments/checkout`) and webhook processing.
3. Collect evidence: exact timestamps (UTC), request IDs (correlation id), affected
   orders/invoices, log excerpts. Do not delete logs.
4. If customer payment data may be affected, record which orders/attempts are
   involved and their `PaymentAttempt` idempotency keys.

## Eradication & recovery

- Apply the fix (patch, rotate secret, restrict CORS, add rate-limit rule) on a branch,
  run the relevant test suites (`security-controls`, `webhook-fuzz`, `concurrency-load`,
  `identity-security`), then deploy.
- Restore from backup if data was corrupted (see `security-runbook.md` → backups; use
  the tested restore procedure).

## Post-incident

- Within 48h write an incident report: timeline, root cause, containment, remediation,
  prevention, and follow-up tasks.
- Update `security-runbook.md` and this document with any new control or runbook step.

## Communication

- Internal: post to the ops channel with severity, scope, and status.
- External: comply with local law and payment/sunat requirements; route customer-facing
  notices through the communications owner.

## Testing (readiness)

- At least once per quarter run a tabletop exercise: simulate an exposed
  `MP_WEBHOOK_SECRET` and a malicious webhook, and verify the checklist above.
- Verify a backup restore from cold storage at least quarterly.
