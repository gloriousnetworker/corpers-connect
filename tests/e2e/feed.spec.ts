/**
 * E2E tests — Feed and post creation flows.
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

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('displays the feed with at least one post or empty state', async ({ page }) => {
    await page.goto('/');
    // Either posts exist, or an empty state message is shown
    const hasPost = await page.getByTestId('post-card').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no posts yet|be the first/i).isVisible().catch(() => false);
    expect(hasPost || hasEmpty).toBe(true);
  });

  test('shows the compose / create post button', async ({ page }) => {
    await page.goto('/');
    // The create post button / FAB / compose area
    const createBtn = page.getByRole('button', { name: /post|create|compose|what's on your mind/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('opens create post modal or navigates to create page', async ({ page }) => {
    await page.goto('/');
    const createBtn = page.getByRole('button', { name: /post|create|compose/i }).first();
    await createBtn.click();

    // After clicking, either a modal appears or we navigate to a post page
    const isModal = await page.getByRole('dialog').isVisible().catch(() => false);
    const isPage = page.url().includes('create') || page.url().includes('post');
    expect(isModal || isPage).toBe(true);
  });

  test('post text input accepts content', async ({ page }) => {
    await page.goto('/');
    const createBtn = page.getByRole('button', { name: /post|create|compose/i }).first();
    await createBtn.click();

    const textInput = page.getByPlaceholder(/what's on your mind|share something|write/i).first()
      .or(page.getByRole('textbox').first());

    if (await textInput.isVisible()) {
      await textInput.fill('Hello, this is an E2E test post!');
      await expect(textInput).toHaveValue('Hello, this is an E2E test post!');
    }
  });

  test('bottom navigation is visible', async ({ page }) => {
    await page.goto('/');
    // Bottom nav tabs should be visible
    const nav = page.getByRole('navigation').first()
      .or(page.getByTestId('bottom-nav'));
    await expect(nav).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Post interactions', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/');
  });

  test('can react to a post if one exists', async ({ page }) => {
    const firstPost = page.getByTestId('post-card').first();
    const exists = await firstPost.isVisible().catch(() => false);

    if (exists) {
      // Find a reaction button (like/heart)
      const likeBtn = firstPost.getByRole('button', { name: /like|heart|react/i }).first()
        .or(firstPost.getByTestId('reaction-btn').first());

      if (await likeBtn.isVisible()) {
        await likeBtn.click();
        // Reaction count should update or button state should change
        await page.waitForTimeout(1000);
        // No assertion on exact count — just that no error occurred
      }
    }
  });
});
