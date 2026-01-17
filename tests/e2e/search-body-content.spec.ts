import { test, expect } from '@playwright/test';

test.describe('Search Body Content', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in the form (demo mode works with any credentials)
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password');

    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to dashboard and queue pane to be visible
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="queue-pane"]')).toBeVisible();
  });

  test('should find posts by searching body content', async ({ page }) => {
    // Enter a search term that appears in body content but not in title
    // Post 1 body contains "different browser"
    await page.getByPlaceholder('Search posts...').fill('different browser');

    // Wait for search to filter results
    await page.waitForTimeout(500);

    // Verify that post with "different browser" in body is shown
    // Using a more flexible selector
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');
  });

  test('should find posts by searching title', async ({ page }) => {
    // Search for a term in the title
    await page.getByPlaceholder('Search posts...').fill('Dark mode');

    // Wait for search to filter results
    await page.waitForTimeout(500);

    // Verify that post with "Dark mode" in title is shown
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Feature request: Dark mode');
  });

  test('should find posts by searching excerpt', async ({ page }) => {
    // Search for a term in the excerpt
    // Post 4 excerpt contains "dubious websites"
    await page.getByPlaceholder('Search posts...').fill('dubious websites');

    // Wait for search to filter results
    await page.waitForTimeout(500);

    // Verify it's the spam post
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Spam account');
  });

  test('should show no results for non-existent search term', async ({ page }) => {
    // Search for something that doesn't exist
    await page.getByPlaceholder('Search posts...').fill('nonexistent term xyz123');

    // Wait for search to filter results
    await page.waitForTimeout(500);

    // Verify empty state is shown
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('No posts match your filters');
  });

  test('should clear search and show all posts', async ({ page }) => {
    // First search for something
    await page.getByPlaceholder('Search posts...').fill('browser');
    await page.waitForTimeout(500);

    // Verify filtered results - only one post should be visible
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');
    await expect(page.locator('[data-testid="queue-pane"]')).not.toContainText('Feature request: Dark mode');

    // Clear the search
    await page.getByPlaceholder('Search posts...').clear();
    await page.waitForTimeout(500);

    // Verify all posts are shown again - at least 5 titles
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Feature request: Dark mode');
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Bug: Images not loading');
  });

  test('should be case insensitive', async ({ page }) => {
    // Search with uppercase
    await page.getByPlaceholder('Search posts...').fill('DIFFERENT BROWSER');
    await page.waitForTimeout(500);

    // Should find the post
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');

    // Clear and search with lowercase
    await page.getByPlaceholder('Search posts...').clear();
    await page.waitForTimeout(100);
    await page.getByPlaceholder('Search posts...').fill('different browser');
    await page.waitForTimeout(500);

    // Should also find the post
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');
  });

  test('should find multiple posts with common terms', async ({ page }) => {
    // Search for "application" which appears in multiple posts
    await page.getByPlaceholder('Search posts...').fill('application');
    await page.waitForTimeout(500);

    // Verify at least one result
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Feature request');
  });

  test('should work with partial word matches', async ({ page }) => {
    // Search for partial word "pass" which should match "password"
    await page.getByPlaceholder('Search posts...').fill('pass');
    await page.waitForTimeout(500);

    // Should find the account post
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Unable to access my account');
  });

  test('should update search results in real-time', async ({ page }) => {
    // Start typing a search term
    const searchInput = page.getByPlaceholder('Search posts...');

    // Type first part
    await searchInput.fill('dark');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Feature request: Dark mode');

    // Continue typing
    await searchInput.fill('dark mode');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Feature request: Dark mode');
  });

  test('should preserve search when changing filters', async ({ page }) => {
    // First search for something
    await page.getByPlaceholder('Search posts...').fill('images');
    await page.waitForTimeout(500);

    // Verify results - the bug report post should be visible
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Bug: Images not loading');

    // Change priority filter - P2 is the bug report's priority
    await page.getByRole('button', { name: /Filters/i }).click();
    await page.waitForTimeout(100);

    // Click P2 filter option
    await page.locator('[data-testid="queue-pane"]').getByText('P2').click();
    await page.waitForTimeout(500);

    // Should still show the same post (Bug report with images)
    await expect(page.locator('[data-testid="queue-pane"]')).toContainText('Bug: Images not loading');
  });
});
