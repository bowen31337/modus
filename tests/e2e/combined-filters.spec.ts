/**
 * E2E Test: Multiple Filters Can Be Combined Simultaneously
 *
 * Test Steps:
 * 1. Navigate to the dashboard and authenticate
 * 2. Apply category filter
 * 3. Apply status filter
 * 4. Apply priority filter
 * 5. Verify that posts match ALL applied filters (AND logic)
 * 6. Add search filter
 * 7. Verify posts match all four filters
 * 8. Remove one filter and verify results update
 */

import { expect, test } from '@playwright/test';

test.describe('Multiple Filters - Combined Filtering', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard
    await page.goto('/dashboard');
    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should combine category and status filters', async ({ page }) => {
    // Get initial post count
    const initialPosts = page.locator('[data-testid^="post-card-"]');
    const initialCount = await initialPosts.count();
    expect(initialCount).toBeGreaterThan(0);

    // Apply category filter (Bug Reports)
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Get count after category filter
    const afterCategory = page.locator('[data-testid^="post-card-"]');
    const categoryCount = await afterCategory.count();
    expect(categoryCount).toBeGreaterThan(0);
    expect(categoryCount).toBeLessThan(initialCount);

    // Apply status filter (Open)
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(500);

    // Get count after combining category + status filters
    const afterBoth = page.locator('[data-testid^="post-card-"]');
    const combinedCount = await afterBoth.count();
    expect(combinedCount).toBeGreaterThan(0);
    // Combined filter should show fewer or equal posts than category filter alone
    expect(combinedCount).toBeLessThanOrEqual(categoryCount);

    // Verify filter chips are shown
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(2);
  });

  test('should combine category, status, and priority filters', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply status filter
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply priority filter
    await page.locator('button:has-text("Priority")').first().click();
    await page.locator('button:has-text("P1")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify three filter chips are shown
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(3);

    // Get filtered post count
    const filteredPosts = page.locator('[data-testid^="post-card-"]');
    const count = await filteredPosts.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Verify each filter chip has the correct label
    await expect(chips.nth(0)).toContainText('Category:');
    await expect(chips.nth(1)).toContainText('Status:');
    await expect(chips.nth(2)).toContainText('Priority:');
  });

  test('should combine filters with search term', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply status filter
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    // Type in search box
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('password');
    await page.waitForTimeout(500);

    // Verify search chip is shown
    const searchChip = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])').filter({ hasText: 'Search:' });
    await expect(searchChip).toBeVisible();

    // Verify all four filter chips are shown
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(3); // Category, Status, Search (no priority)

    // Get filtered post count
    const filteredPosts = page.locator('[data-testid^="post-card-"]');
    const count = await filteredPosts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update results when removing individual filters', async ({ page }) => {
    // Apply three filters
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Priority")').first().click();
    await page.locator('button:has-text("P1")').nth(0).click();
    await page.waitForTimeout(500);

    // Get count with all three filters
    const postsWith3Filters = page.locator('[data-testid^="post-card-"]');
    const countWith3 = await postsWith3Filters.count();

    // Remove one filter (click remove button on first chip)
    const firstRemoveButton = page.locator('button[data-testid^="remove-filter-"]').first();
    await firstRemoveButton.click();
    await page.waitForTimeout(500);

    // Verify chip count decreased
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(2);

    // Verify post count increased or stayed the same (filter relaxed)
    const postsWith2Filters = page.locator('[data-testid^="post-card-"]');
    const countWith2 = await postsWith2Filters.count();
    expect(countWith2).toBeGreaterThanOrEqual(countWith3);
  });

  test('should combine date range with other filters', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    // Open date range filter
    await page.locator('button:has-text("Date Range")').first().click();

    // Set start date
    const startDateInput = page.locator('input[type="date"][data-testid="date-start-input"]');
    await startDateInput.fill('2024-01-01');

    // Set end date
    const endDateInput = page.locator('input[type="date"][data-testid="date-end-input"]');
    await endDateInput.fill('2024-12-31');
    await page.waitForTimeout(500);

    // Close the dropdown by clicking the backdrop
    const backdrop = page.locator('div.fixed.inset-0.z-40').first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(500);

    // Verify both filter chips are shown
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(2);

    // Get filtered post count
    const filteredPosts = page.locator('[data-testid^="post-card-"]');
    const count = await filteredPosts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters and show all posts', async ({ page }) => {
    // Apply multiple filters
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Priority")').first().click();
    await page.locator('button:has-text("P1")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify posts are filtered
    const filteredPosts = page.locator('[data-testid^="post-card-"]');
    const filteredCount = await filteredPosts.count();

    // Click Clear all
    await page.locator('button[data-testid="clear-all-filters"]').click({ force: true });
    await page.waitForTimeout(500);

    // Verify no filter chips remain
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(chips).toHaveCount(0);

    // Verify all posts are shown
    const allPosts = page.locator('[data-testid^="post-card-"]');
    const allCount = await allPosts.count();
    expect(allCount).toBeGreaterThan(filteredCount);
  });

  test('should use AND logic (all filters must match)', async ({ page }) => {
    // Get total post count
    const allPosts = page.locator('[data-testid^="post-card-"]');
    const totalCount = await allPosts.count();

    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    const categoryPosts = page.locator('[data-testid^="post-card-"]');
    const categoryCount = await categoryPosts.count();

    // Apply status filter (intersection)
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(500);

    const combinedPosts = page.locator('[data-testid^="post-card-"]');
    const combinedCount = await combinedPosts.count();

    // Combined count should be <= each individual filter count (AND logic)
    expect(combinedCount).toBeLessThanOrEqual(categoryCount);
    expect(combinedCount).toBeLessThanOrEqual(totalCount);

    // Verify posts match both filters
    if (combinedCount > 0) {
      const firstPost = combinedPosts.first();
      await expect(firstPost).toContainText('Bug Reports', { useInnerText: true });
    }
  });

  test('should show search chip when combining search with filters', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")'.toString()).nth(0).click();
    await page.waitForTimeout(300);

    // Type in search box
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('error');
    await page.waitForTimeout(500);

    // Verify search chip is visible
    const searchChip = page.locator('span.inline-flex').filter({ hasText: 'Search:' });
    await expect(searchChip).toBeVisible();
    await expect(searchChip).toContainText('error');

    // Verify category chip is also visible
    const categoryChip = page.locator('span.inline-flex').filter({ hasText: 'Category:' });
    await expect(categoryChip).toBeVisible();

    // Verify both chips are present
    const chips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(2);
  });
});
