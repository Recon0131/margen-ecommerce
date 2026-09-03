import { test, expect } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './test-helpers';

test.describe('Catalog browsing', () => {
  test('customer can see the product catalog', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });

  test('customer can search and open a product', async ({ page }) => {
    await page.goto('/catalogo');
    const searchbox = page.getByRole('searchbox');
    await searchbox.fill('hub');
    await searchbox.press('Enter');
    await expect(page).toHaveURL(/q=hub/);
    await expect(page.getByRole('link', { name: /hub/i }).first()).toBeVisible();
    await page.getByRole('link', { name: /hub/i }).first().click();
    await expect(page).toHaveURL(/\/producto\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('customer can filter by category', async ({ page }) => {
    await page.goto('/catalogo');
    const categoryLink = page.getByRole('link', { name: /electronics|smartphones|laptops/i }).first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    }
  });

  test('catalog page shows empty state when no results', async ({ page }) => {
    await page.goto('/catalogo?q=zzzznonexistent999');
    await expect(page.getByText(/no.*encontr|sin.*resultado/i)).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('catalog has visible focus and no serious axe violations', async ({ page }) => {
    await page.goto('/catalogo');
    await page.keyboard.press('Tab');
    await expectNoSeriousAxeViolations(page);
  });

  test('product detail has no serious axe violations', async ({ page }) => {
    await page.goto('/catalogo');
    const firstProduct = page.getByRole('link', { name: /producto|product/i }).first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page).toHaveURL(/\/producto\//);
      await expectNoSeriousAxeViolations(page);
    }
  });
});
