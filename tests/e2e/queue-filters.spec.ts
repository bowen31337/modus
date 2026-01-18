/**
 * E2E Test: Queue Filtering and Sorting
 *
 * Test Steps:
 * 1. Navigate to the dashboard URL
 * 2. Verify filter controls are visible
 * 3. Test category filtering
 * 4. Test status filtering
 * 5. Test priority filtering
 * 6. Test search functionality
 * 7. Test sort functionality
 * 8. Test combined filters
 */

import { expect, test } from '@playwright/test';

test.describe('Queue Filtering and Sorting', () => {
  test.beforeEach(async ({ page }) => {
    // First authenticate by logging in (this sets the demo session cookie)
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible (not loading skeleton)
    await expect(page.locator('[data-testid="queue-container"]')).toBeVisible();
  });

  test('should display filter and sort controls', async ({ page }) => {
    // Verify filter button is visible
    const filterButton = page.locator('button:has-text("Filters")');
    await expect(filterButton).toBeVisible();

    // Verify sort button is visible
    const sortButton = page.locator('button:has-text("Sort")');
    await expect(sortButton).toBeVisible();

    // Verify search input is visible
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should filter posts by category', async ({ page }) => {
    // Get initial post count
    const initialPosts = page.locator('[data-testid="queue-container"] button[type="button"]');
    const initialCount = await initialPosts.count();
    expect(initialCount).toBeGreaterThan(0);

    // Open filter dropdown
    await page.locator('button:has-text("Filters")').first().click();

    // Wait for dropdown to appear
    await expect(page.locator('text=Category')).toBeVisible();

    // Click on Category dropdown to expand
    await page.locator('button:has-text("Category")').first().click();

    // Select "Bug Reports" category
    await page.locator('button:has-text("Bug Reports")').nth(0).click();

    // Wait for filtering to apply
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredPosts = page.locator('[data-testid="queue-container"] button[type="button"]');
    const filteredCount = await filteredPosts.count();

    // Should have fewer posts after filtering
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify at least one visible post has "Bug Reports" category
    if (filteredCount > 0) {
      const categoryText = await filteredPosts
        .first()
        .locator('span')
        .filter({ hasText: 'Bug Reports' })
        .count();
      expect(categoryText).toBeGreaterThan(0);
    }
  });

  test('should filter posts by status', async ({ page }) => {
    // Open filter dropdown
    await page.locator('button:has-text("Filters")').first().click();

    // Click on Status dropdown to expand
    await page.locator('button:has-text("Status")').first().click();

    // Select "In Progress" status - use the dropdown container to scope the selector
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("In Progress")').click();

    // Wait for filtering to apply
    await page.waitForTimeout(500);

    // Verify filtered results show only "In Progress" posts
    const inProgressPosts = page.locator('[data-testid="queue-container"] [role="button"][tabindex="0"]');
    const count = await inProgressPosts.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const post = inProgressPosts.nth(i);
      const statusBadge = post.locator('span:has-text("In Progress")');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should filter posts by priority', async ({ page }) => {
    // Open filter dropdown
    await page.locator('button:has-text("Filters")').first().click();

    // Click on Priority dropdown to expand
    await page.locator('button:has-text("Priority")').first().click();

    // Select "P1" priority - use the dropdown container to scope the selector
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("P1")').click();

    // Wait for filtering to apply
    await page.waitForTimeout(500);

    // Verify filtered results show only P1 posts
    const p1Posts = page.locator('[data-testid="queue-container"] [role="button"][tabindex="0"]');
    const count = await p1Posts.count();

    expect(count).toBeGreaterThan(0);

    // Check first post has P1 badge
    const priorityBadge = p1Posts.first().locator('span:has-text("P1")');
    await expect(priorityBadge).toBeVisible();
  });

  test('should search posts by title and content', async ({ page }) => {
    // Get initial post count
    const searchInput = page.locator('input[type="search"]');

    // Search for "password"
    await searchInput.fill('password');
    await page.waitForTimeout(500);

    // Verify filtered results
    const searchResults = page.locator('[data-testid="queue-container"] [role="button"][tabindex="0"]');
    const count = await searchResults.count();

    expect(count).toBeGreaterThan(0);

    // Verify at least one result contains "password" in title or excerpt
    let foundMatch = false;
    for (let i = 0; i < count; i++) {
      const postText = await searchResults.nth(i).textContent();
      if (postText?.toLowerCase().includes('password')) {
        foundMatch = true;
        break;
      }
    }
    expect(foundMatch).toBeTruthy();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Verify all posts are shown again
    const allPosts = page.locator('[data-testid="queue-container"] [role="button"][tabindex="0"]');
    const totalCount = await allPosts.count();
    expect(totalCount).toBeGreaterThan(count);
  });

  test('should sort posts by priority', async ({ page }) => {
    // Open sort dropdown
    await page.locator('button:has-text("Sort")').first().click();

    // Verify sort by priority is available
    await expect(page.locator('text=Sort by')).toBeVisible();

    // Click Priority to sort (default is already priority desc, but click to ensure)
    // The sort dropdown is in a z-50 container
    const sortDropdown = page.locator('div.z-50');
    await sortDropdown.locator('button:has-text("Priority")').first().click();

    // Wait for sorting to apply
    await page.waitForTimeout(500);

    // Get all posts and check that P1 posts come first (descending order)
    const posts = page.locator('[data-testid="queue-container"] [role="button"][tabindex="0"]');
    const postCount = await posts.count();
    expect(postCount).toBeGreaterThan(0);

    // Check that the first visible post has P1 priority (since P1 is highest priority)
    // We need to find the first post that contains P1 in its text
    let foundP1 = false;
    for (let i = 0; i < Math.min(postCount, 5); i++) {
      const post = posts.nth(i);
      const postText = await post.textContent();
      if (postText?.includes('P1')) {
        foundP1 = true;
        break;
      }
    }
    expect(foundP1).toBeTruthy();
  });

  test('should clear all filters', async ({ page }) => {
    // Get initial post count
    const initialPosts = page.locator('[data-testid="queue-container"] button[type="button"]');
    const initialCount = await initialPosts.count();

    // Open filter dropdown
    await page.locator('button:has-text("Filters")').first().click();

    // Apply a filter
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify filter is applied (badge count should be visible)
    const filterButton = page.locator('button:has-text("Filters")').first();
    const badgeCount = filterButton.locator('span').filter({ hasText: /^\d+$/ });
    await expect(badgeCount).toBeVisible();

    // Click "Clear all"
    await page.locator('button:has-text("Clear all")').click();

    // Verify badge is gone - wait for it to disappear
    const badgeCountAfter = filterButton.locator('span').filter({ hasText: /^\d+$/ });
    await expect(badgeCountAfter).toHaveCount(0, { timeout: 10000 });

    // Wait for posts to reload after clearing filters
    await expect(page.locator('[data-testid="queue-container"]')).toBeVisible();

    // Verify all posts are shown again
    const allPosts = page.locator('[data-testid="queue-container"] button[type="button"]');
    await expect(allPosts).toHaveCount(initialCount, { timeout: 10000 });
  });

  test('should show no results message when filters match nothing', async ({ page }) => {
    // Search for non-existent content
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('nonexistent content that should not match any posts');
    await page.waitForTimeout(500);

    // Verify "no posts match your filters" message is shown
    await expect(page.locator('text=No posts match your filters')).toBeVisible();
    await expect(page.locator('text=Try adjusting your search or filters')).toBeVisible();
  });

  test('should display post count in filter dropdown', async ({ page }) => {
    // Open filter dropdown
    await page.locator('button:has-text("Filters")').first().click();

    // Verify post count is shown
    await expect(page.locator('text=/posts? found/')).toBeVisible();
  });

  test('should combine multiple filters', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("Bug Reports")').click();
    await page.waitForTimeout(500);

    // Apply status filter
    await dropdown.locator('button:has-text("Status")').click();
    await dropdown.locator('button:has-text("Open")').click();
    await page.waitForTimeout(500);

    // Verify filters are combined (badge should show 2)
    const filterButton = page.locator('button:has-text("Filters")').first();
    const badgeCount = filterButton.locator('span').filter({ hasText: /^2$/ });
    await expect(badgeCount).toBeVisible();
  });
});
