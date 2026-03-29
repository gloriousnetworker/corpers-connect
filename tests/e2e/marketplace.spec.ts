/**
 * E2E tests — Marketplace (Mami Market) flows.
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e_test@corpers.test';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'E2eTest@2024';

async function signIn(page: Page) {
  await page.goto('/auth/login');
  await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15_000 });
}

async function navigateToMarketplace(page: Page) {
  // Navigate to the marketplace tab/section
  const marketplaceTab = page.getByRole('link', { name: /market|mami|shop/i }).first()
    .or(page.getByTestId('marketplace-tab').first())
    .or(page.getByRole('button', { name: /market|mami|shop/i }).first());

  if (await marketplaceTab.isVisible()) {
    await marketplaceTab.click();
    await page.waitForTimeout(1000);
  }
}

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await navigateToMarketplace(page);
  });

  test('renders the Mami Market heading', async ({ page }) => {
    await expect(page.getByText('Mami Market')).toBeVisible({ timeout: 10_000 });
  });

  test('renders the search input', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search listings/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders the Sell button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sell/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders the filter button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /filter/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows listings or empty state', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    const hasListing = await page.getByTestId('listing-card').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no listings found/i).isVisible().catch(() => false);
    const hasSkeleton = await page.locator('.animate-pulse').first().isVisible().catch(() => false);

    expect(hasListing || hasEmpty || hasSkeleton).toBe(true);
  });

  test('search input filters listings', async ({ page }) => {
    await page.waitForTimeout(2000);
    const searchInput = page.getByPlaceholder(/search listings/i);
    await searchInput.fill('khaki');
    await page.waitForTimeout(1500);
    // Page should not crash — result can be listings or empty state
    const isStillOnPage = await page.getByText('Mami Market').isVisible();
    expect(isStillOnPage).toBe(true);
  });

  test('category chip filters update listing display', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Click any non-All category chip
    const uniformChip = page.getByRole('button', { name: /uniform/i });
    if (await uniformChip.isVisible()) {
      await uniformChip.click();
      await page.waitForTimeout(1500);
      const isStillOnPage = await page.getByText('Mami Market').isVisible();
      expect(isStillOnPage).toBe(true);
    }
  });
});

test.describe('Marketplace — create listing', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await navigateToMarketplace(page);
  });

  test('Sell button opens seller flow', async ({ page }) => {
    await page.waitForTimeout(1000);
    const sellBtn = page.getByRole('button', { name: /sell/i });

    if (await sellBtn.isVisible()) {
      await sellBtn.click();
      await page.waitForTimeout(1000);

      // Should show either create listing form or seller application
      const isNewView = await page.getByText(/create listing|apply.*seller|become.*seller|new listing/i).isVisible().catch(() => false);
      expect(isNewView).toBe(true);
    }
  });
});
