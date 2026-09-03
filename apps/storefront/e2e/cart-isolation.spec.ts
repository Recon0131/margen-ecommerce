import { test, expect, BrowserContext } from '@playwright/test';

const API = 'http://localhost:3001';
const PASSWORD = 'Password123';

test('cart is isolated per account: account B does not see account A cart', async ({ browser }) => {
  const ctxA: BrowserContext = await browser.newContext();
  const ctxB: BrowserContext = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const emailA = 'isoA' + Date.now() + '@example.com';
  const emailB = 'isoB' + Date.now() + '@example.com';

  // Register + login A via its own context
  await pageA.goto('/');
  let r = await pageA.request.post(API + '/v1/auth/register', { data: { email: emailA, password: PASSWORD } });
  expect(r.status()).toBe(201);
  r = await pageA.request.post(API + '/v1/auth/login', { data: { email: emailA, password: PASSWORD } });
  expect(r.status()).toBe(200);
  await pageA.reload();
  await expect(pageA.locator('header').getByRole('link', { name: /Carrito/i })).toBeVisible();

  // A adds first product
  await pageA.goto('/catalogo');
  await pageA.locator('a[href^="/producto/"]').first().click();
  const addA = pageA.getByRole('button', { name: /Añadir al carrito/i });
  const badgeA = pageA.getByTestId('cart-badge');
  await expect(async () => {
    await addA.click();
    await expect(badgeA).toHaveText('1', { timeout: 1500 });
  }).toPass({ timeout: 15000 });

  // Register + login B via its own context
  await pageB.goto('/');
  r = await pageB.request.post(API + '/v1/auth/register', { data: { email: emailB, password: PASSWORD } });
  expect(r.status()).toBe(201);
  r = await pageB.request.post(API + '/v1/auth/login', { data: { email: emailB, password: PASSWORD } });
  expect(r.status()).toBe(200);
  await pageB.reload();
  await expect(pageB.locator('header').getByRole('link', { name: /Carrito/i })).toBeVisible();

  // B's cart must be empty (no badge) even though A has 1 item
  await pageB.goto('/carrito');
  await expect(pageB.getByRole('heading', { name: /Tu carrito está vacío/i })).toBeVisible();
  await expect(pageB.getByTestId('cart-badge')).toHaveCount(0);

  // A still sees their 1 item
  await pageA.goto('/carrito');
  await expect(pageA.getByTestId('cart-badge')).toHaveText('1');

  await ctxA.close();
  await ctxB.close();
});
