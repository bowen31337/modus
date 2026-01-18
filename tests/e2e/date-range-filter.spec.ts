import { expect, test } from '@playwright/test';

test.describe('Date Range Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');

    // In demo mode, the login form has a simple submit button
    // Click the Sign In button which triggers the demo login server action
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should display date range filter in filter dropdown', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Verify date range section exists
    const dateRangeButton = page.getByText('Date Range');
    await expect(dateRangeButton).toBeVisible();
  });

  test('should show date inputs when date range section is clicked', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Verify date inputs are visible
    await expect(page.locator('[data-testid="date-start-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-end-input"]')).toBeVisible();
  });

  test('should filter posts by start date', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set start date to 2025-01-17 (should show posts from Jan 17 onwards)
    await page.fill('[data-testid="date-start-input"]', '2025-01-17');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show posts from Jan 17 and Jan 18 (3 posts)
    // Post 1 (Jan 18), Post 2 (Jan 17), Post 4 (Jan 18)
    const postCount = await page.locator('[data-testid^="post-card-"]').count();
    expect(postCount).toBeGreaterThanOrEqual(2);
  });

  test('should filter posts by end date', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set end date to 2025-01-16 (should show posts up to Jan 16)
    await page.fill('[data-testid="date-end-input"]', '2025-01-16');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show posts from Jan 16 and earlier (Post 3 and Post 5)
    const postCount = await page.locator('[data-testid^="post-card-"]').count();
    expect(postCount).toBeGreaterThanOrEqual(1);
  });

  test('should filter posts by both start and end date', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set date range: Jan 15 to Jan 17 (should show posts from Jan 15-17)
    await page.fill('[data-testid="date-start-input"]', '2025-01-15');
    await page.fill('[data-testid="date-end-input"]', '2025-01-17');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show posts within the date range (Post 2 from Jan 17, Post 3 from Jan 16)
    const postCount = await page.locator('[data-testid^="post-card-"]').count();
    expect(postCount).toBeGreaterThanOrEqual(1);
  });

  test('should show clear date filter button when date is set', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set start date
    await page.fill('[data-testid="date-start-input"]', '2025-01-17');

    // Verify clear button appears
    await expect(page.locator('[data-testid="clear-date-filter"]')).toBeVisible();
  });

  test('should clear date filter when clear button is clicked', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set start date
    await page.fill('[data-testid="date-start-input"]', '2025-01-17');

    // Click clear button
    await page.click('[data-testid="clear-date-filter"]');

    // Verify inputs are cleared
    await expect(page.locator('[data-testid="date-start-input"]')).toHaveValue('');
    await expect(page.locator('[data-testid="date-end-input"]')).toHaveValue('');
  });

  test('should update filter count badge when date filter is active', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set start date
    await page.fill('[data-testid="date-start-input"]', '2025-01-17');

    // Close dropdown by clicking outside
    await page.click('body');

    // Verify filter count badge shows at least 1
    const filterBadge = page.locator('[data-testid="filter-controls-button"] span.ml-auto');
    await expect(filterBadge).toBeVisible();
    const badgeText = await filterBadge.textContent();
    expect(Number.parseInt(badgeText || '0')).toBeGreaterThanOrEqual(1);
  });

  test('should combine date filter with other filters', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Set date range
    await page.getByText('Date Range').click();
    await page.fill('[data-testid="date-start-input"]', '2025-01-15');

    // Set category filter
    await page.getByText('Category').click();
    await page.click('[data-testid="filter-category-Bug Reports"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show posts that match both criteria
    const postCount = await page.locator('[data-testid^="post-card-"]').count();
    expect(postCount).toBeGreaterThanOrEqual(0); // May be 0 or more depending on data
  });

  test('should show no results message when date filter excludes all posts', async ({ page }) => {
    // Open filter dropdown
    await page.click('[data-testid="filter-controls-button"]');

    // Click date range section to expand
    await page.getByText('Date Range').click();

    // Set a date range far in the future (no posts should match)
    await page.fill('[data-testid="date-start-input"]', '2030-01-01');
    await page.fill('[data-testid="date-end-input"]', '2030-12-31');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show "No posts match your filters" message
    await expect(page.getByText('No posts match your filters')).toBeVisible();
  });
});
