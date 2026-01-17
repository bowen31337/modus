import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation - Queue', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate down in queue with J key', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // Get the first post card
    const firstPost = page.locator('[data-testid="post-card-1"]');
    await expect(firstPost).toBeVisible();

    // Press J to navigate down
    await page.keyboard.press('J');

    // The second post should now be focused (have ring styling)
    const secondPost = page.locator('[data-testid="post-card-2"]');
    await expect(secondPost).toBeVisible();

    // Verify the focused post has the keyboard focus ring
    const secondPostClass = await secondPost.getAttribute('class');
    expect(secondPostClass).toContain('ring-primary');
  });

  test('should navigate up in queue with K key', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // Press J twice to go down
    await page.keyboard.press('J');
    await page.keyboard.press('J');

    // Press K to navigate up
    await page.keyboard.press('K');

    // Should be on the second post (index 1)
    const secondPost = page.locator('[data-testid="post-card-2"]');
    const secondPostClass = await secondPost.getAttribute('class');
    expect(secondPostClass).toContain('ring-primary');
  });

  test('should open post with Enter key', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // Press Enter to open the first post
    await page.keyboard.press('Enter');

    // Verify work pane shows the post detail
    await page.waitForSelector('[data-testid="work-pane"]');
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();
  });

  test('should wrap navigation at end of list', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // There are 5 posts, press J 6 times to wrap around
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('J');
    }

    // Should be back at the first post (index 0)
    const firstPost = page.locator('[data-testid="post-card-1"]');
    const firstPostClass = await firstPost.getAttribute('class');
    expect(firstPostClass).toContain('ring-primary');
  });

  test('should not navigate when typing in input field', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // Focus on the search input
    const searchInput = page.locator('input[type="search"]');
    await searchInput.click();

    // Type in the search field
    await searchInput.type('test');

    // Press J - should type 'j' instead of navigating
    await page.keyboard.press('J');

    // Verify the search input contains 'testj' (J was typed, not navigation)
    await expect(searchInput).toHaveValue('testj');
  });

  test('should reset focus when filters change', async ({ page }) => {
    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]');

    // Navigate down
    await page.keyboard.press('J');
    await page.keyboard.press('J');

    // Apply a filter
    await page.locator('[data-testid="filter-controls-button"]').click();
    await page.locator('[data-testid="filter-category-Account Issues"]').click();

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // The first post should be focused again
    const firstPost = page.locator('[data-testid="post-card-1"]');
    const firstPostClass = await firstPost.getAttribute('class');
    expect(firstPostClass).toContain('ring-primary');
  });
});
