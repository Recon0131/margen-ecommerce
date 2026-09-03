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
  await expect(page.locator('header').getByRole('link', { name: /Carrito/i })).toBeVisible();
}

async function clickAddToCartUntilLogin(page: Page) {
  const addButton = page.getByRole('button', { name: /Añadir al carrito/i });
  await expect(async () => {
    await addButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 1500 });
  }).toPass({ timeout: 15000 });
}

test.describe('Cart requires login', () => {
  test('logged-out add-to-cart redirects to login', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('a[href^="/producto/"]').first().click();
    await clickAddToCartUntilLogin(page);
  });

  test('logged-out user has no cart icon in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByRole('link', { name: /Carrito/i })).toHaveCount(0);
  });

  test('logged-out /carrito redirects to login', async ({ page }) => {
    await page.goto('/carrito');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logged-in user can add to cart and it persists server-side', async ({ page }) => {
    const email = 'cart' + Date.now() + '@example.com';
    await registerAndLogin(page, email);

    await page.goto('/catalogo');
    await page.locator('a[href^="/producto/"]').first().click();

    const addButton = page.getByRole('button', { name: /Añadir al carrito/i });
    const badge = page.getByTestId('cart-badge');

    await expect(async () => {
      await addButton.click();
      await expect(badge).toHaveText('1', { timeout: 1500 });
    }).toPass({ timeout: 15000 });

    await page.goto('/catalogo');
    await page.locator('a[href^="/producto/"]').first().click();
    await expect(badge).toHaveText('1');
  });
});
