import { test, expect, Page } from '@playwright/test';

const API = 'http://localhost:3001';
const PASSWORD = 'Password123';

async function registerAndLogin(page: Page, email: string) {
  const reg = await page.request.post(API + '/v1/auth/register', { data: { email, password: PASSWORD } });
  expect(reg.status()).toBe(201);
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

test('creating a delivery does not error with Invalid order data', async ({ page }) => {
  const email = 'ordercreate' + Date.now() + '@example.com';
  await registerAndLogin(page, email);

  await page.goto('/catalogo');
  await page.locator('a[href^="/producto/"]').first().click();
  const badge = page.getByTestId('cart-badge');
  await expect(async () => {
    await page.getByRole('button', { name: /Añadir al carrito/i }).click();
    await expect(badge).toHaveText('1', { timeout: 2000 });
  }).toPass({ timeout: 20000 });

  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'Crear pedido' })).toBeVisible();
  await page.fill('#recipient', 'Test User');
  await page.fill('#line1', 'Av. Test 123');
  await page.fill('#district', 'Miraflores');
  await page.fill('#city', 'Lima');
  await page.fill('#customerDoc', '12345678');

  // Creating a delivery must redirect to the (mock) payment gateway page.
  // Reaching the redirect implies createOrder succeeded (no "Invalid order data").
  await page.getByRole('button', { name: 'Crear pedido' }).click();

  await page.waitForURL(/\/pasarela-pago/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Pasarela de pago' })).toBeVisible();
  await page.fill('#card-number', '4242424242424242');
  await page.fill('#card-expiry', '1230');
  await page.fill('#card-cvv', '123');
  await page.getByRole('button', { name: 'Pagar' }).click();
  await expect(page.getByText('Pago procesado correctamente')).toBeVisible();
});
