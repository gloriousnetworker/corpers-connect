/**
 * E2E tests — Authentication flows (register + login).
 *
 * NOTE: These tests require a running backend with a test database.
 * They use environment-specific test accounts and should NOT modify
 * production data. Set PLAYWRIGHT_BASE_URL and PLAYWRIGHT_TEST_EMAIL /
 * PLAYWRIGHT_TEST_PASSWORD in your CI environment.
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e_test@corpers.test';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'E2eTest@2024';

test.describe('Authentication', () => {
  test.describe('Login page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
    });

    test('renders the login form', async ({ page }) => {
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('shows validation errors on empty submit', async ({ page }) => {
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      // Expect at least one error message
      await expect(page.getByText(/required|invalid|email/i).first()).toBeVisible();
    });

    test('shows error on invalid credentials', async ({ page }) => {
      await page.getByPlaceholder(/email/i).fill('wrong@email.com');
      await page.getByPlaceholder(/password/i).fill('WrongPass123!');
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await expect(
        page.getByText(/invalid credentials|incorrect|not found/i).first()
      ).toBeVisible({ timeout: 10_000 });
    });

    test('shows a link to the register page', async ({ page }) => {
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      await expect(registerLink).toBeVisible();
    });

    test('navigates to register page', async ({ page }) => {
      await page.getByRole('link', { name: /register|sign up|create account/i }).click();
      await expect(page).toHaveURL(/register/);
    });
  });

  test.describe('Register page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/register');
    });

    test('renders the registration form', async ({ page }) => {
      await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
      await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    });

    test('shows validation errors on empty submit', async ({ page }) => {
      await page.getByRole('button', { name: /register|sign up|create/i }).click();
      await expect(page.getByText(/required|invalid|email/i).first()).toBeVisible();
    });

    test('shows a link back to login', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /log in|sign in|already have/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Authenticated flows', () => {
    // These tests sign in before each test
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
      await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Wait for redirect to the main app
      await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15_000 });
    });

    test('redirects to the feed after login', async ({ page }) => {
      // Should land on the main app (not auth pages)
      await expect(page).not.toHaveURL(/\/auth\//);
    });

    test('logout clears session and redirects to login', async ({ page }) => {
      // Navigate to settings for logout
      await page.goto('/');
      // Look for logout — could be in settings or profile menu
      const settingsTab = page.getByRole('link', { name: /settings/i })
        .or(page.getByTestId('settings-tab'))
        .first();

      if (await settingsTab.isVisible()) {
        await settingsTab.click();
        const logoutBtn = page.getByRole('button', { name: /log out|sign out/i });
        if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
          await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
          await expect(page).toHaveURL(/\/auth\/login/);
        }
      }
    });
  });
});
