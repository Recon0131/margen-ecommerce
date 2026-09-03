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

test('deleting the last cart item does not error (empty cart persists)', async ({ page }) => {
  const email = 'dellast' + Date.now() + '@example.com';
  await registerAndLogin(page, email);

  // add an item
  await page.goto('/catalogo');
  await page.locator('a[href^="/producto/"]').first().click();
  const badge = page.getByTestId('cart-badge');
  await expect(async () => {
    await page.getByRole('button', { name: /Añadir al carrito/i }).click();
    await expect(badge).toHaveText('1', { timeout: 2000 });
  }).toPass({ timeout: 20000 });

  // go to cart and verify the item is there
  await page.goto('/carrito');
  await expect(page.getByText('Eliminar', { exact: false }).first()).toBeVisible();

  // delete the item -> cart becomes empty
  await page.getByRole('button', { name: /Eliminar/i }).first().click();

  // empty state appears; no runtime error / "Invalid cart data"
  await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Invalid cart data')).toHaveCount(0);
});
