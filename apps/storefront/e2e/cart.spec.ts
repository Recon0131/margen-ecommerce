import { test, expect } from '@playwright/test';

test.describe('Cart and checkout', () => {
  test('customer can add a product to cart and see the cart page', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('a[href^="/producto/"]').first().click();

    const addButton = page.getByRole('button', { name: /Añadir al carrito/i });
    const badge = page.getByTestId('cart-badge');

    // The page is server-rendered; wait for React hydration by clicking
    // until the add actually registers in the header badge.
    await expect(async () => {
      await addButton.click();
      await expect(badge).toHaveText('1', { timeout: 1500 });
    }).toPass({ timeout: 15000 });

    await page.getByRole('link', { name: /Carrito/i }).click();
    await expect(page).toHaveURL(/\/carrito/);
    await expect(page.getByRole('heading', { name: 'Carrito' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Proceder al pago/i })).toBeVisible();
  });

  test('empty cart shows empty state', async ({ page }) => {
    await page.goto('/carrito');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole('heading', { name: /Tu carrito está vacío/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ir al catálogo/i })).toBeVisible();
  });

  test('cart add-to-cart persists across navigation', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('a[href^="/producto/"]').first().click();

    const addButton = page.getByRole('button', { name: /Añadir al carrito/i });
    const badge = page.getByTestId('cart-badge');

    await expect(async () => {
      await addButton.click();
      await expect(badge).toHaveText('1', { timeout: 1500 });
    }).toPass({ timeout: 15000 });

    await page.goto('/catalogo');
    await expect(badge).toHaveText('1');
  });
});
