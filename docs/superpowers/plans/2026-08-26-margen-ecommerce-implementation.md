# MARGEN E-commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una tienda de accesorios tecnológicos para Perú (PEN) con catálogo, carrito, inventario transaccional, Mercado Pago Checkout Pro, comprobantes PDF y panel administrativo seguro.

**Architecture:** Monolito modular TypeScript en un monorepo pnpm. `apps/storefront` contiene Next.js, `apps/api` contiene NestJS sobre Fastify y `apps/worker` procesa colas BullMQ; PostgreSQL/Prisma es la fuente de verdad y Redis coordina reservas, webhooks y tareas asíncronas. Los módulos se comunican mediante casos de uso y contratos versionados, no mediante acceso directo a tablas ajenas.

**Tech Stack:** Node.js LTS, TypeScript strict, Next.js, NestJS, Fastify, PostgreSQL, Prisma, Redis, BullMQ, Zod, Vitest, Playwright, Mercado Pago SDK oficial, almacenamiento S3-compatible privado y motor de PDF aislado.

**Spec:** `docs/superpowers/specs/2026-08-26-margen-ecommerce-design.md`

## Global Constraints

- Todos los precios, impuestos y descuentos se recalculan en servidor y el dinero se representa en céntimos de PEN o decimal exacto; nunca `float`.
- La API pública DummyJSON solo sirve para poblar/sincronizar datos de demostración; PostgreSQL es la fuente de verdad de catálogo comercial, precios, stock, órdenes y facturas.
- JSON público: máximo 100 KB; cada endpoint puede imponer un límite menor; se rechazan campos desconocidos en comandos sensibles, parámetros repetidos ambiguos y prototipos controlados por el usuario.
- Node.js LTS, lockfile versionado, `npm ci`/instalación reproducible, TypeScript strict cuando sea compatible y dependencias revisadas por SCA.
- No se almacenan números de tarjeta, CVV, bandas magnéticas, tokens secretos, cookies ni headers de autorización en logs.
- Sesiones opacas en cookies `Secure`, `HttpOnly`, `SameSite` apropiado; CSRF para mutaciones; MFA obligatorio para administración, pagos, facturación y reembolsos.
- Argon2id para contraseñas; RBAC/ABAC con denegación por defecto y autorización por objeto.
- Inventario reservado atómicamente con TTL de 10–15 minutos, idempotencia, historial de movimientos y pruebas de concurrencia.
- Mercado Pago Checkout Pro se crea desde el servidor; la orden solo pasa a `paid` después de webhook/consulta server-to-server verificada.
- PDFs privados con nombre aleatorio, URL firmada de corta duración, `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff`.
- CSP restrictiva, `nosniff`, Referrer-Policy, Permissions-Policy, framing controlado, TLS, CORS explícito, rate limits por ruta y timeouts hacia dependencias.
- Interfaz MARGEN: fondo neutro casi blanco, tinta grafito, azul grisáceo desaturado, Geist Sans para UI, Newsreader solo para titulares, bordes de 1 px, radios 8–12 px, sin degradados ni sombras pesadas.
- Toda animación debe comunicar estado, durar 150–250 ms en UI y tener alternativa para `prefers-reduced-motion`.

## File Map

### Fundación y configuración

- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.env.example` y `.gitignore`: workspace, scripts y configuración no secreta.
- `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/storefront/app/layout.tsx`, `apps/worker/src/main.ts`: puntos de entrada.
- `packages/config/src/env.ts`, `packages/contracts/src/index.ts`, `packages/domain/src/index.ts`, `packages/ui/src/index.ts`: fronteras compartidas.
- `infra/docker-compose.yml`, `.github/workflows/ci.yml`: servicios locales y pipeline.

### Datos y dominio

- `apps/api/prisma/schema.prisma` y `apps/api/prisma/migrations/*`: persistencia versionada.
- `packages/domain/src/money.ts`, `order-state.ts`, `inventory.ts`: reglas puras de dinero, estados y reservas.

### Catálogo y tienda

- `apps/api/src/modules/catalog/*`: adaptador DummyJSON, mapeo, repositorio y endpoints.
- `apps/storefront/app/*`, `apps/storefront/components/*`, `packages/ui/src/*`: rutas y sistema visual.

### Compra y operaciones

- `apps/api/src/modules/cart/*`, `orders/*`, `inventory/*`: cotización, orden, reserva y movimientos.
- `apps/api/src/modules/identity/*`, `admin/*`, `audit/*`: cuentas, roles, MFA, panel y auditoría.

### Integraciones

- `apps/api/src/modules/payments/*`, `apps/worker/src/jobs/payment-webhook.ts`: Mercado Pago y eventos.
- `apps/api/src/modules/billing/*`, `apps/worker/src/jobs/invoice-pdf.ts`: documentos, PDF y adaptador fiscal.

### Pruebas

- `packages/domain/test/*`, `apps/api/test/*`, `apps/storefront/e2e/*`: unitarias, integración, contratos y recorrido completo.

---

### Task 1: Fundación reproducible y pipeline seguro

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.env.example`, `.gitignore`
- Create: `apps/api/package.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`
- Create: `apps/storefront/package.json`, `apps/storefront/app/layout.tsx`, `apps/storefront/app/page.tsx`
- Create: `apps/worker/package.json`, `apps/worker/src/main.ts`
- Create: `packages/config/package.json`, `packages/config/src/env.ts`
- Create: `packages/contracts/package.json`, `packages/contracts/src/index.ts`
- Create: `packages/domain/package.json`, `packages/domain/src/index.ts`
- Create: `packages/ui/package.json`, `packages/ui/src/index.ts`
- Create: `infra/docker-compose.yml`, `.github/workflows/ci.yml`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Produces `GET /health` con respuesta `{ status: "ok", version: string }`.
- Produces scripts raíz `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck` y `pnpm test`.
- `loadConfig(env: NodeJS.ProcessEnv): AppConfig` valida variables y nunca devuelve secretos al cliente.

- [ ] **Step 1: Escribir el test de health que falla**

```ts
it('returns a stable health response', async () => {
  const response = await request(app.getHttpServer()).get('/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
  expect(typeof response.body.version).toBe('string');
});
```

- [ ] **Step 2: Ejecutar el test para confirmar el fallo**

Run: `pnpm --filter api test -- health.e2e-spec.ts`

Expected: FAIL porque aún no existen la aplicación Nest ni `/health`.

- [ ] **Step 3: Crear workspace, apps, paquetes y configuración**

Definir `packageManager`, Node LTS mínimo, scripts compartidos, TypeScript strict, alias de paquetes y `.env.example` con nombres sin valores reales: `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `APP_ORIGIN` y `CORS_ORIGINS`.

- [ ] **Step 4: Implementar `/health` y validación de ambiente**

`loadConfig` debe rechazar ambiente inválido al arrancar y `/health` debe devolver solo estado y versión, sin URL de base de datos, secretos ni stack trace.

- [ ] **Step 5: Ejecutar verificaciones**

Run: `pnpm lint && pnpm typecheck && pnpm --filter api test -- health.e2e-spec.ts`

Expected: PASS en los tres comandos.

- [ ] **Step 6: Configurar CI y commit**

CI ejecuta instalación reproducible, lint, typecheck, unitarias y build; añadir secret scanning y SCA. Commit: `chore: bootstrap secure monorepo`.

### Task 2: Dominio, contratos y esquema de persistencia

**Files:**
- Create: `packages/domain/src/money.ts`, `packages/domain/src/order-state.ts`, `packages/domain/src/inventory.ts`, `packages/domain/src/index.ts`
- Create: `packages/contracts/src/catalog.ts`, `cart.ts`, `orders.ts`, `payments.ts`, `billing.ts`, `packages/contracts/src/index.ts`
- Create: `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`
- Create: `apps/api/src/database/prisma.service.ts`, `apps/api/src/database/prisma.module.ts`
- Test: `packages/domain/test/money.test.ts`, `order-state.test.ts`, `inventory.test.ts`
- Test: `apps/api/test/prisma-schema.int-spec.ts`

**Interfaces:**
- `type Money = { amountMinor: bigint; currency: 'PEN' }`.
- `calculateTotals(lines: PricedLine[], taxPolicy: TaxPolicy): Totals` devuelve subtotal, descuentos, impuesto y total exactos.
- `canTransition(from: OrderStatus, to: OrderStatus): boolean`.
- `reserveStock(input: ReserveStockInput): ReserveStockResult` es pura y la transacción Prisma la aplica posteriormente.
- Contratos Zod exportan `ProductQuerySchema`, `CartLineSchema`, `CreateOrderSchema`, `PaymentWebhookSchema` e `InvoiceRequestSchema`.

- [ ] **Step 1: Escribir pruebas de dinero y estados**

```ts
const noTax: TaxPolicy = { rateBps: 0 };

it('adds PEN minor units without floating point', () => {
  expect(calculateTotals([{ unitAmountMinor: 1099n, quantity: 2 }], noTax).totalMinor).toBe(2198n);
});

it('rejects a delivery transition before shipping', () => {
  expect(canTransition('pending_payment', 'delivered')).toBe(false);
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter domain test`

Expected: FAIL con exports y funciones inexistentes.

- [ ] **Step 3: Implementar reglas puras y esquemas estrictos**

Rechazar cantidades no enteras, negativas, `NaN`, infinitos, strings fuera de longitud, URLs fuera de allowlist y propiedades desconocidas en comandos sensibles. Mantener la tasa de impuesto como política configurable, no como constante legal embebida.

- [ ] **Step 4: Crear schema Prisma y migración**

Modelar `Product`, `ProductVariant`, `Category`, `Cart`, `CartLine`, `InventoryItem`, `InventoryMovement`, `StockReservation`, `Order`, `OrderLine`, `PaymentAttempt`, `WebhookEvent`, `Invoice`, `CreditNote`, `User`, `Session`, `Role` y `AuditEvent`; añadir ULID/UUID, claves únicas, checks de cantidades no negativas y estados válidos.

El seed debe incluir al menos el producto demo `usb-c-hub-01` con SKU `HUB-01` para que el recorrido E2E sea reproducible.

- [ ] **Step 5: Ejecutar migración, seed y pruebas**

Run: `pnpm --filter api prisma migrate dev --name init && pnpm --filter api prisma db seed && pnpm --filter api test -- prisma-schema.int-spec.ts && pnpm --filter domain test`

Expected: PASS; el seed crea solo productos de demostración sin datos reales.

- [ ] **Step 6: Commit**

Commit: `feat: add domain contracts and persistence schema`.

### Task 3: Catálogo interno y adaptador DummyJSON

**Files:**
- Create: `apps/api/src/modules/catalog/catalog.module.ts`, `catalog.controller.ts`, `catalog.service.ts`
- Create: `apps/api/src/modules/catalog/catalog.repository.ts`, `dummyjson.client.ts`, `dummyjson.mapper.ts`, `catalog.schemas.ts`
- Create: `apps/api/src/modules/catalog/catalog.sync.ts`
- Create: `apps/api/src/modules/catalog/__tests__/dummyjson.mapper.spec.ts`, `catalog.service.spec.ts`
- Create: `apps/api/test/catalog.e2e-spec.ts`

**Interfaces:**
- `CatalogRepository.list(query: ProductQuery): Promise<Page<ProductSummary>>`.
- `CatalogRepository.findBySlug(slug: string): Promise<ProductDetail | null>`.
- `DummyJsonClient.listProducts(params: { limit: number; skip: number; category?: string; query?: string }): Promise<unknown>`.
- `mapDummyJsonProduct(input: unknown): InternalProduct` convierte un payload validado en el modelo interno.
- `validateUpstreamUrl(url: string): void` rechaza cualquier host o esquema excepto el allowlist de DummyJSON.
- `syncDummyJsonCatalog(): Promise<{ imported: number; rejected: number }>`.

- [ ] **Step 1: Escribir pruebas del mapper y fallback**

```ts
it('maps a valid upstream product to an internal PEN product', () => {
  const product = mapDummyJsonProduct(validFixture);
  expect(product.currency).toBe('PEN');
  expect(product.sku).toMatch(/^[A-Z0-9-]{4,32}$/);
});

it('serves the last valid catalog when upstream is unavailable', async () => {
  upstream.rejects(new Error('timeout'));
  await expect(service.list({ limit: 10, skip: 0 })).resolves.toMatchObject({ source: 'database' });
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter api test -- catalog`

Expected: FAIL porque el adaptador, repositorio y servicio no existen.

- [ ] **Step 3: Implementar cliente allowlisted y validación upstream**

Permitir únicamente `https://dummyjson.com`, aplicar timeout, límite de respuesta, AbortController y schema Zod. No interpolar URLs recibidas del usuario; construir query params desde listas permitidas.

- [ ] **Step 4: Implementar mapper, repositorio y sincronización**

Convertir precio a una política PEN interna, generar SKU estable si el upstream no es suficiente, guardar imágenes como URLs permitidas y registrar productos rechazados sin persistir payloads completos.

- [ ] **Step 5: Exponer endpoints y verificar contrato**

Implementar `GET /v1/catalog/products`, `GET /v1/catalog/products/:slug` y `GET /v1/catalog/categories` con paginación, filtros, `400/422` consistentes y cache-control seguro. Ejecutar `pnpm --filter api test -- catalog` y esperar PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add internal catalog backed by DummyJSON sync`.

### Task 4: Storefront MARGEN y experiencia de catálogo

**Files:**
- Create: `packages/ui/src/tokens.css`, `packages/ui/src/Button.tsx`, `ProductIndex.tsx`, `FormField.tsx`, `StatusMessage.tsx`
- Create: `apps/storefront/app/globals.css`, `app/page.tsx`, `app/catalogo/page.tsx`, `app/producto/[slug]/page.tsx`
- Create: `apps/storefront/components/ProductIndex.tsx`, `CatalogFilters.tsx`, `ProductDetail.tsx`, `SiteHeader.tsx`
- Create: `apps/storefront/lib/api-client.ts`, `lib/product-types.ts`
- Create: `apps/storefront/e2e/test-helpers.ts`
- Test: `apps/storefront/e2e/catalog.spec.ts`, `accessibility.spec.ts`

**Interfaces:**
- `apiClient.getProducts(query: ProductQuery): Promise<Page<ProductSummary>>`.
- `ProductIndex` recibe `{ featured: ProductDetail; items: ProductSummary[] }`.
- `Button` expone `variant`, `loading`, `disabled` y `type` sin aceptar HTML arbitrario.
- `expectNoSeriousAxeViolations(page): Promise<void>` es el helper compartido de accesibilidad.

- [ ] **Step 1: Escribir pruebas E2E de navegación y accesibilidad**

```ts
test('customer can search and open a product', async ({ page }) => {
  await page.goto('/catalogo');
  await page.getByRole('searchbox').fill('hub');
  await expect(page.getByRole('link', { name: /hub/i }).first()).toBeVisible();
  await page.getByRole('link', { name: /hub/i }).first().click();
  await expect(page).toHaveURL(/\/producto\//);
});

test('catalog has visible focus and no serious axe violations', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.locator(':focus-visible')).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});
```

- [ ] **Step 2: Ejecutar E2E para confirmar el fallo**

Run: `pnpm --filter storefront exec playwright test e2e/catalog.spec.ts`

Expected: FAIL porque las rutas y componentes aún no existen.

- [ ] **Step 3: Implementar tokens y componentes accesibles**

Usar fondo neutro, grafito, azul grisáceo, Geist Sans, Newsreader solo en titulares, bordes 1 px, radios 8–12 px, sin degradados ni iconos genéricos de línea. Añadir estados hover/foco/activo/deshabilitado/carga/error y `prefers-reduced-motion`.

- [ ] **Step 4: Implementar rutas y consumo de la API propia**

El cliente solo llamará a `/v1`; nunca a DummyJSON desde el navegador. Resolver estados de loading con skeleton, vacío con instrucciones y error con reintento explícito.

- [ ] **Step 5: Ejecutar E2E y revisión visual**

Run: `pnpm --filter storefront exec playwright test e2e/catalog.spec.ts e2e/accessibility.spec.ts`

Expected: PASS en viewport móvil y desktop; validar que no haya overflow horizontal ni headings truncados.

- [ ] **Step 6: Commit**

Commit: `feat: build Margen catalog storefront`.

### Task 5: Carrito, cotización, órdenes e inventario atómico

**Files:**
- Create: `apps/api/src/modules/cart/cart.module.ts`, `cart.controller.ts`, `cart.service.ts`
- Create: `apps/api/src/modules/orders/orders.module.ts`, `orders.controller.ts`, `orders.service.ts`, `order-state.policy.ts`
- Create: `apps/api/src/modules/inventory/inventory.module.ts`, `inventory.service.ts`, `inventory.repository.ts`, `inventory.worker.ts`
- Create: `apps/api/src/modules/orders/__tests__/orders.service.spec.ts`, `apps/api/src/modules/inventory/__tests__/inventory.concurrency.int-spec.ts`
- Create: `apps/api/test/helpers/authenticated-request.ts`
- Create: `apps/worker/src/jobs/release-expired-reservations.ts`
- Test: `apps/api/test/checkout-quote.e2e-spec.ts`

**Interfaces:**
- `quoteCart(input: QuoteCartInput): Promise<OrderQuote>`.
- `createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<OrderCreated>`.
- `reserveOrderStock(orderId: string, lines: OrderLineInput[]): Promise<Reservation>`.
- `releaseExpiredReservations(now: Date): Promise<number>`.
- `asCustomer(userId: string): AuthenticatedTestClient` construye el cliente de prueba con una sesión aislada.

- [ ] **Step 1: Escribir pruebas de cotización, transición y carrera**

```ts
it('ignores client-provided price and recalculates from catalog', async () => {
  const quote = await quoteCart({ lines: [{ sku: 'HUB-01', quantity: 1, unitPriceMinor: 1n }] });
  expect(quote.lines[0].unitPriceMinor).toBe(8990n);
});

it('allows only one buyer to reserve the last unit', async () => {
  const results = await Promise.all([
    reserveOrderStock('order-a', [{ sku: 'LAST-01', quantity: 1 }]),
    reserveOrderStock('order-b', [{ sku: 'LAST-01', quantity: 1 }]),
  ]);
  expect(results.filter((result) => result.status === 'reserved')).toHaveLength(1);
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter api test -- orders.service inventory.concurrency`

Expected: FAIL porque aún no existen casos de uso ni transacciones.

- [ ] **Step 3: Implementar carrito y cotización server-side**

Aceptar solo SKU y cantidad; validar límites, estado publicado y propiedad del carrito. Rechazar precios, impuestos, moneda y campos desconocidos enviados por el cliente.

- [ ] **Step 4: Implementar transacción de reserva**

Usar transacción Prisma con bloqueo/versión de fila, `StockReservation` única por orden/SKU, TTL configurable de 10–15 minutos e historial `InventoryMovement`. No usar un `if (stock > 0)` fuera de la transacción.

- [ ] **Step 5: Implementar orden idempotente y worker de expiración**

Persistir `created` → `pending_payment`, guardar snapshot de líneas y devolver el mismo resultado ante la misma clave. El worker libera reservas vencidas y registra el motivo.

- [ ] **Step 6: Ejecutar pruebas y commit**

Run: `pnpm --filter api test -- orders.service inventory.concurrency checkout-quote.e2e-spec.ts`

Expected: PASS, sin sobreventa, precios manipulables ni doble orden.

Commit: `feat: add transactional cart orders and inventory`.

### Task 6: Identidad, sesiones y panel administrativo

**Files:**
- Create: `apps/api/src/modules/identity/identity.module.ts`, `auth.controller.ts`, `auth.service.ts`, `password.service.ts`, `session.service.ts`, `mfa.service.ts`
- Create: `apps/api/src/modules/admin/admin.module.ts`, `admin.controller.ts`, `rbac.guard.ts`
- Create: `apps/api/src/modules/audit/audit.service.ts`, `audit.interceptor.ts`
- Create: `apps/storefront/app/cuenta/page.tsx`, `app/admin/page.tsx`, `components/AdminInventoryView.tsx`, `components/OrderStatusView.tsx`
- Test: `apps/api/test/identity-security.e2e-spec.ts`, `authorization.e2e-spec.ts`

**Interfaces:**
- `registerCustomer(input): Promise<PublicUser>` y `authenticate(input): Promise<SessionResult>`.
- `requirePermission(actor, permission, resource): void`.
- `createMfaChallenge(userId): Promise<MfaChallenge>` y `verifyMfa(code): Promise<void>`.
- `AuditService.record(event: AuditEventInput): Promise<void>`.

- [ ] **Step 1: Escribir pruebas de seguridad de identidad**

```ts
it('does not reveal whether an email exists during recovery', async () => {
  const known = await request(app).post('/v1/auth/recovery').send({ email: 'known@example.com' });
  const unknown = await request(app).post('/v1/auth/recovery').send({ email: 'unknown@example.com' });
  expect(known.status).toBe(202);
  expect(unknown.status).toBe(202);
  expect(known.body).toEqual(unknown.body);
});

it('blocks a customer from reading another order', async () => {
  const response = await asCustomer('user-a').get('/v1/orders/order-owned-by-user-b');
  expect(response.status).toBe(404);
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter api test -- identity-security authorization`

Expected: FAIL porque no existen sesiones, guards ni endpoints.

- [ ] **Step 3: Implementar Argon2id, email verification y recuperación**

Usar salt único por contraseña, token de un solo uso con expiración corta, respuesta indistinguible y rate limit por IP/cuenta/dispositivo. No guardar contraseña, token ni payload sensible en logs.

- [ ] **Step 4: Implementar sesión opaca y CSRF**

Regenerar sesión al autenticar o elevar privilegios; cookies con nombre no predeterminado, `Secure`, `HttpOnly`, `SameSite`, expiración absoluta y 30 minutos de inactividad para admin. Añadir CSRF y comprobación de `Origin`/`Referer` en mutaciones.

- [ ] **Step 5: Implementar RBAC, MFA y auditoría**

Roles iniciales: `admin`, `operations`, `support`, `customer`; MFA obligatorio para los tres primeros. Autorizar por objeto en órdenes, inventario, reembolsos y facturas. Auditar login, cambios de permisos, stock, precio, estados y descargas.

- [ ] **Step 6: Ejecutar pruebas y commit**

Run: `pnpm --filter api test -- identity-security authorization`

Expected: PASS; después commit `feat: add secure identity and admin authorization`.

### Task 7: Mercado Pago Checkout Pro y webhooks

**Files:**
- Create: `apps/api/src/modules/payments/payments.module.ts`, `mercadopago.client.ts`, `payments.service.ts`, `payments.controller.ts`, `webhook.controller.ts`
- Create: `apps/worker/src/jobs/payment-webhook.ts`, `apps/worker/src/queues.ts`
- Create: `apps/api/src/modules/payments/__tests__/payments.service.spec.ts`, `webhook.signature.spec.ts`
- Test: `apps/api/test/payment-flow.e2e-spec.ts`

**Interfaces:**
- `createCheckout(orderId: string, idempotencyKey: string): Promise<{ checkoutUrl: string; providerOrderId: string }>`.
- `verifyMercadoPagoWebhook(rawBody: Buffer, signature: string, requestId: string): VerifiedWebhook`.
- `processPaymentEvent(eventId: string): Promise<PaymentProcessResult>`.

- [ ] **Step 1: Escribir pruebas de idempotencia, firma y estado**

```ts
it('returns the same provider order for a repeated idempotency key', async () => {
  const first = await service.createCheckout('order-1', 'key-1');
  const second = await service.createCheckout('order-1', 'key-1');
  expect(second.providerOrderId).toBe(first.providerOrderId);
});

it('does not process an invalid or duplicate webhook', async () => {
  await expect(verifyMercadoPagoWebhook(Buffer.from('{}'), 'bad-signature', 'request-1')).rejects.toMatchObject({ status: 401 });
  await processPaymentEvent('event-1');
  await expect(processPaymentEvent('event-1')).resolves.toMatchObject({ duplicate: true });
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter api test -- payments.service webhook.signature`

Expected: FAIL porque no existe el adaptador ni el procesador.

- [ ] **Step 3: Implementar cliente server-side con credenciales de ambiente**

Usar SDK oficial de Mercado Pago en backend, claves de prueba separadas de producción y `X-Idempotency-Key`. Crear preferencia/orden únicamente desde `pending_payment` persistida, con PEN, order ID y metadatos mínimos.

- [ ] **Step 4: Implementar webhook raw-body y cola**

Conservar el cuerpo crudo hasta verificar firma y timestamp; guardar `WebhookEvent` único; responder rápido y encolar el procesamiento. Rechazar replay, firma inválida, importe/moneda/orden discordantes.

- [ ] **Step 5: Implementar estados y retorno seguro**

El retorno del navegador muestra `pending_payment`, `paid` o `payment_failed` provisional; solo el worker confirmado puede consumir reserva, avanzar la orden y disparar facturación.

- [ ] **Step 6: Ejecutar pruebas y commit**

Run: `pnpm --filter api test -- payments.service webhook.signature payment-flow.e2e-spec.ts`

Expected: PASS en modo mock; commit `feat: integrate Mercado Pago Checkout Pro safely`.

### Task 8: Comprobantes PDF y adaptador fiscal

**Files:**
- Create: `apps/api/src/modules/billing/billing.module.ts`, `billing.service.ts`, `billing.controller.ts`, `invoice-numbering.service.ts`
- Create: `apps/api/src/modules/billing/pdf-renderer.ts`, `fiscal-provider.port.ts`, `demo-fiscal-provider.ts`
- Create: `apps/worker/src/jobs/invoice-pdf.ts`
- Create: `apps/api/src/modules/billing/templates/invoice.hbs`
- Create: `apps/api/src/modules/billing/__tests__/billing.service.spec.ts`, `pdf-renderer.security.spec.ts`
- Test: `apps/api/test/invoice-access.e2e-spec.ts`

**Interfaces:**
- `issueInvoice(orderId: string, documentType: 'BOLETA' | 'FACTURA'): Promise<Invoice>`.
- `FiscalProvider.issue(input: FiscalInvoiceInput): Promise<FiscalIssueResult>`.
- `renderInvoicePdf(snapshot: InvoiceSnapshot): Promise<Buffer>`.
- `getSignedInvoiceUrl(actor, invoiceId): Promise<string>`.
- `updateInvoice(invoiceId: string, patch: unknown): Promise<never>` siempre rechaza con `INVOICE_IMMUTABLE`.

- [ ] **Step 1: Escribir pruebas de inmutabilidad, totales y autorización**

```ts
it('issues only from a paid order and freezes its snapshot', async () => {
  await expect(issueInvoice('pending-order', 'BOLETA')).rejects.toMatchObject({ code: 'ORDER_NOT_PAID' });
  const invoice = await issueInvoice('paid-order', 'BOLETA');
  expect(invoice.snapshot.lines).toHaveLength(1);
  await expect(updateInvoice(invoice.id, { totalMinor: 1n })).rejects.toMatchObject({ code: 'INVOICE_IMMUTABLE' });
});

it('does not sign a URL for another customer', async () => {
  await expect(getSignedInvoiceUrl(customerA, invoiceOwnedByB)).rejects.toMatchObject({ status: 404 });
});
```

- [ ] **Step 2: Ejecutar pruebas para confirmar el fallo**

Run: `pnpm --filter api test -- billing.service pdf-renderer invoice-access`

Expected: FAIL porque no existen emisión, renderer ni control de acceso.

- [ ] **Step 3: Implementar snapshot, numeración y política fiscal**

Congelar productos, precios, descuentos, impuestos, moneda, comprador y dirección. Asignar serie/número en transacción sin reutilización. `BOLETA` será para consumidor final y `FACTURA` requerirá RUC; la tasa IGV será configuración validada externamente.

- [ ] **Step 4: Implementar PDF seguro y storage privado**

Usar plantilla controlada por servidor, encoding contextual, límites de tamaño/tiempo/fuentes/imágenes, sin URLs remotas y sin HTML/CSS del usuario. Guardar con nombre aleatorio fuera del web root y servir solo mediante URL firmada de corta duración.

- [ ] **Step 5: Implementar proveedor demo y contrato PSE/SUNAT**

El proveedor demo marcará el documento como `preview_non_fiscal`; el adaptador de producción podrá devolver `issued`, `rejected` o `voided` sin permitir editar silenciosamente el original. Crear endpoint de descarga con autorización por objeto y auditoría.

- [ ] **Step 6: Ejecutar pruebas y commit**

Run: `pnpm --filter api test -- billing.service pdf-renderer invoice-access`

Expected: PASS; commit `feat: add private invoice generation pipeline`.

### Task 9: Integración de storefront, panel y recorrido de compra

**Files:**
- Modify: `apps/storefront/app/carrito/page.tsx`, `app/checkout/page.tsx`, `app/pedido/[id]/page.tsx`, `app/cuenta/page.tsx`
- Modify: `apps/storefront/components/SiteHeader.tsx`, `ProductDetail.tsx`
- Create: `apps/storefront/components/CartSummary.tsx`, `CheckoutForm.tsx`, `PaymentStatus.tsx`, `InvoiceDownload.tsx`
- Modify: `apps/storefront/app/admin/page.tsx`, `components/AdminInventoryView.tsx`, `components/OrderStatusView.tsx`
- Test: `apps/storefront/e2e/checkout-demo.spec.ts`, `apps/storefront/e2e/admin-flow.spec.ts`

**Interfaces:**
- `cartClient.addLine(sku: string, quantity: number): Promise<Cart>`.
- `checkoutClient.createOrder(input: CustomerCheckoutInput, key: string): Promise<{ orderId: string; checkoutUrl: string }>`.
- `orderClient.getOrder(id: string): Promise<AuthorizedOrderView>`.

- [ ] **Step 1: Escribir E2E del recorrido completo**

```ts
test('customer can reserve, start payment and see pending order', async ({ page }) => {
  await page.goto('/producto/usb-c-hub-01');
  await page.getByRole('button', { name: /agregar al carrito/i }).click();
  await page.goto('/carrito');
  await page.getByRole('link', { name: /continuar al checkout/i }).click();
  await page.getByLabel(/correo/i).fill('buyer@example.com');
  await page.getByRole('button', { name: /pagar con mercado pago/i }).click();
  await expect(page).toHaveURL(/checkout|mercadopago/);
});
```

- [ ] **Step 2: Ejecutar E2E para confirmar el fallo**

Run: `pnpm --filter storefront exec playwright test e2e/checkout-demo.spec.ts e2e/admin-flow.spec.ts`

Expected: FAIL porque las vistas y clientes aún no están conectados.

- [ ] **Step 3: Implementar carrito y checkout**

Mostrar resumen del servidor, reserva informativa, campos de entrega, selector boleta/factura y estados loading/error. No incluir inputs de tarjeta; el botón navega a `checkoutUrl` recibido del backend.

- [ ] **Step 4: Implementar estado de pedido y comprobante**

Mostrar estados asincrónicos, refresco seguro, mensajes no filtrantes y enlace de PDF solo si la API autoriza al actor. No confiar en query params para revelar pago.

- [ ] **Step 5: Implementar panel operativo**

Crear vistas de inventario, movimientos, órdenes, pagos y documentos con estados vacíos, filtros, foco visible y permisos. Ocultar datos fiscales y personales innecesarios en listados.

- [ ] **Step 6: Ejecutar E2E y commit**

Run: `pnpm --filter storefront exec playwright test e2e/checkout-demo.spec.ts e2e/admin-flow.spec.ts`

Expected: PASS usando Mercado Pago mock y webhook de prueba; commit `feat: connect storefront checkout and admin flows`.

### Task 10: Endurecimiento, observabilidad y entrega de portafolio

**Files:**
- Create: `apps/api/src/security/security-headers.ts`, `rate-limit.config.ts`, `correlation-id.ts`, `error-filter.ts`
- Create: `apps/api/test/security-controls.e2e-spec.ts`, `apps/api/test/webhook-fuzz.e2e-spec.ts`, `apps/api/test/concurrency-load.spec.ts`
- Create: `docs/operations/security-runbook.md`, `docs/operations/incident-response.md`, `docs/architecture.md`
- Modify: `.github/workflows/ci.yml`, `README.md`, `infra/docker-compose.yml`

**Interfaces:**
- Cada respuesta de error pública sigue `{ code: string; message: string; correlationId: string }`.
- `SecurityHeadersMiddleware` añade CSP, `nosniff`, Referrer-Policy, Permissions-Policy y framing policy.
- `AuditService.record` acepta eventos sanitizados con timestamp UTC, actor/servicio, acción, recurso, resultado, IP mínima, correlation ID y severidad.

- [ ] **Step 1: Escribir pruebas de controles y abuso**

```ts
it('returns 429 after route-specific login limit', async () => {
  for (let i = 0; i < 8; i++) await request(app).post('/v1/auth/login').send(validLogin);
  await expect(request(app).post('/v1/auth/login').send(validLogin)).resolves.toMatchObject({ status: 429 });
});

it('rejects an upstream URL outside the allowlist', async () => {
  expect(() => validateUpstreamUrl('http://127.0.0.1:8080/internal')).toThrow('UPSTREAM_NOT_ALLOWED');
});
```

- [ ] **Step 2: Ejecutar controles para confirmar el fallo**

Run: `pnpm --filter api test -- security-controls webhook-fuzz concurrency-load`

Expected: FAIL en los controles aún no configurados.

- [ ] **Step 3: Implementar headers, rate limits, timeouts y errores**

Configurar CORS con orígenes explícitos, límites por login/registro/búsqueda/carrito/checkout/reembolso/webhook, timeout de conexión/lectura/escritura y filtro de excepciones que no revele internals.

- [ ] **Step 4: Ejecutar SAST, SCA, secret scan, DAST y carga**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm audit --audit-level=high`; ejecutar DAST contra staging, fuzzing de JSON/webhooks y prueba concurrente de último SKU. Corregir hallazgos críticos/altos antes de continuar.

- [ ] **Step 5: Preparar backups, restauración y respuesta a incidentes**

Documentar backups cifrados, retención, restauración probada, rotación de secretos, revocación de integraciones, contactos y comunicación. Realizar un ejercicio de incidente antes del lanzamiento.

- [ ] **Step 6: Documentar arquitectura y demo**

Añadir diagrama de componentes, decisiones de seguridad, variables de ambiente, límites de DummyJSON, flujo Mercado Pago, diferencia entre preview fiscal y emisión autorizada, y recorrido de demo reproducible.

- [ ] **Step 7: Ejecutar aceptación y commit final**

Run: `pnpm build && pnpm test && pnpm --filter storefront exec playwright test && git diff --check`

Expected: PASS sin secretos detectados, sin cambios sin revisar y con el recorrido catálogo → carrito → reserva → pago mock → webhook → comprobante → admin funcionando.

Commit: `chore: harden and document Margen portfolio demo`.

## Orden de ejecución y checkpoints

1. Ejecutar Tasks 1–2 y verificar fundación/dominio antes de crear UI.
2. Ejecutar Tasks 3–4 y validar catálogo con datos persistidos y responsive.
3. Ejecutar Task 5; no iniciar pagos hasta que las pruebas de concurrencia pasen.
4. Ejecutar Task 6; no exponer panel sin autorización por objeto y MFA administrativo.
5. Ejecutar Tasks 7–8 con proveedores mock; activar credenciales reales solo en un ambiente separado.
6. Ejecutar Task 9 para el recorrido integrado.
7. Ejecutar Task 10 como gate de lanzamiento.

Cada task termina con un commit pequeño y un reporte de pruebas. Si un requisito fiscal o de proveedor cambia, actualizar primero la especificación y luego el task afectado.
