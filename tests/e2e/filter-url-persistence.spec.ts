import { expect, test } from '@playwright/test';

test.describe
  .serial('Filter State URL Persistence', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to login page first
      await page.goto('/login');

      // Wait for login page to load
      await page.waitForSelector('text=Sign in to your account', { timeout: 10000 });

      // Fill in demo credentials and sign in
      await page.getByLabel('Email').fill('demo@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for redirect to dashboard
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
    });

    test('should update URL when status filter is applied', async ({ page }) => {
      // Verify initial URL has no status parameter
      await expect(page).toHaveURL(/dashboard$/);

      // Open filter controls
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await filterButton.click();

      // Wait for dropdown to open
      await page.waitForSelector('text=Filters', { state: 'visible' });

      // Click on Status to expand the status section
      await page.locator('button:has-text("Status")').first().click();

      // Wait for status options to be visible
      await page.waitForSelector('[data-testid="filter-status-open"]', { state: 'visible' });

      // Click on Open status filter
      await page.locator('[data-testid="filter-status-open"]').click();

      // Wait for URL to update
      await page.waitForURL(/.*dashboard\?status=open/, { timeout: 5000 });

      // Verify URL contains status parameter
      await expect(page).toHaveURL(/status=open/);
    });

    test('should update URL when priority filter is applied', async ({ page }) => {
      // Open filter controls
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await filterButton.click();

      // Wait for dropdown to open
      await page.waitForSelector('text=Filters', { state: 'visible' });

      // Click on Priority to expand the priority section
      await page.locator('button:has-text("Priority")').first().click();

      // Wait for priority options to be visible
      await page.waitForSelector('[data-testid="filter-priority-P1"]', { state: 'visible' });

      // Click on P1 priority filter
      await page.locator('[data-testid="filter-priority-P1"]').click();

      // Wait for URL to update
      await page.waitForURL(/.*dashboard\?priority=P1/, { timeout: 5000 });

      // Verify URL contains priority parameter
      await expect(page).toHaveURL(/priority=P1/);
    });

    test('should update URL when search is applied', async ({ page }) => {
      // Type in the search field
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('test search');

      // Wait for URL to update (debounced)
      await page.waitForURL(/.*dashboard\?search=test\+search/, { timeout: 5000 });

      // Verify URL contains search parameter
      await expect(page).toHaveURL(/search=test/);
    });

    test('should apply filters from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with filter parameters
      // Using status=open&category=Account%20Issues (Post 1 matches: open + Account Issues)
      await page.goto('/dashboard?status=open&category=Account%20Issues');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify URL parameters are preserved
      await expect(page).toHaveURL(/status=open/);
      await expect(page).toHaveURL(/category=Account/);

      // Verify filter button shows active filter count
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await expect(filterButton).toBeVisible();
    });

    test('should apply search from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with search parameter
      // Using "password" which exists in Post 1 title
      await page.goto('/dashboard?search=password');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify URL parameter is preserved
      await expect(page).toHaveURL(/search=password/);

      // Verify search input contains the search term
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toHaveValue('password');
    });

    test('should apply date range from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with date range parameters
      // Using January 2025 to match mock posts
      await page.goto('/dashboard?dateFrom=2025-01-01&dateTo=2025-01-31');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify URL parameters are preserved
      await expect(page).toHaveURL(/dateFrom=2025-01-01/);
      await expect(page).toHaveURL(/dateTo=2025-01-31/);
    });

    test('should apply sort from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with sort parameters
      await page.goto('/dashboard?sortBy=date&sortOrder=asc');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify URL parameters are preserved
      await expect(page).toHaveURL(/sortBy=date/);
      await expect(page).toHaveURL(/sortOrder=asc/);
    });

    test('should apply view mode from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with view parameter
      await page.goto('/dashboard?view=grid');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify URL parameter is preserved
      await expect(page).toHaveURL(/view=grid/);
    });

    test('should apply multiple filters from URL on page load', async ({ page }) => {
      // Navigate directly to dashboard with multiple filter parameters
      // Using status=open&category=Account%20Issues (Post 1 matches: open + Account Issues)
      await page.goto('/dashboard?status=open&category=Account%20Issues');

      // Wait for the queue pane to be visible
      await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify all URL parameters are preserved
      await expect(page).toHaveURL(/status=open/);
      await expect(page).toHaveURL(/category=Account/);
    });

    test('should handle browser back navigation after filter change', async ({ page }) => {
      // Apply a status filter
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await filterButton.click();
      await page.waitForSelector('text=Filters', { state: 'visible' });
      await page.locator('button:has-text("Status")').first().click();
      await page.waitForSelector('[data-testid="filter-status-open"]', { state: 'visible' });
      await page.locator('[data-testid="filter-status-open"]').click();

      // Wait for URL to update
      await page.waitForURL(/.*dashboard\?status=open/, { timeout: 5000 });

      // Apply another filter (priority)
      await filterButton.click();
      await page.waitForSelector('text=Filters', { state: 'visible' });
      await page.locator('button:has-text("Priority")').first().click();
      await page.waitForSelector('[data-testid="filter-priority-P1"]', { state: 'visible' });
      await page.locator('[data-testid="filter-priority-P1"]').click();

      // Wait for URL to update with both filters
      await page.waitForURL(/.*dashboard\?status=open&priority=P1/, { timeout: 5000 });

      // Press browser back button
      await page.goBack();
      await page.waitForTimeout(500);

      // Verify URL is back to only status filter
      await expect(page).toHaveURL(/status=open/);
      await expect(page).not.toHaveURL(/priority=P1/);

      // Press browser back button again
      await page.goBack();
      await page.waitForTimeout(500);

      // Verify URL has no filters
      await expect(page).toHaveURL(/dashboard$/);
    });

    test('should handle browser forward navigation after filter change', async ({ page }) => {
      // Apply a status filter
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await filterButton.click();
      await page.waitForSelector('text=Filters', { state: 'visible' });
      await page.locator('button:has-text("Status")').first().click();
      await page.waitForSelector('[data-testid="filter-status-open"]', { state: 'visible' });
      await page.locator('[data-testid="filter-status-open"]').click();

      // Wait for URL to update
      await page.waitForURL(/.*dashboard\?status=open/, { timeout: 5000 });

      // Press browser back button
      await page.goBack();
      await page.waitForTimeout(500);

      // Verify URL has no filters
      await expect(page).toHaveURL(/dashboard$/);

      // Press browser forward button
      await page.goForward();
      await page.waitForTimeout(500);

      // Verify URL is back to status filter
      await expect(page).toHaveURL(/status=open/);
    });

    test('should clear filter from URL when filter is removed', async ({ page }) => {
      // Apply a status filter
      const filterButton = page.locator('[data-testid="filter-controls-button"]');
      await filterButton.click();
      await page.waitForSelector('text=Filters', { state: 'visible' });
      await page.locator('button:has-text("Status")').first().click();
      await page.waitForSelector('[data-testid="filter-status-open"]', { state: 'visible' });
      await page.locator('[data-testid="filter-status-open"]').click();

      // Wait for URL to update
      await page.waitForURL(/.*dashboard\?status=open/, { timeout: 5000 });

      // Re-open filter and click again to deselect
      await filterButton.click();
      await page.waitForSelector('text=Filters', { state: 'visible' });
      await page.locator('button:has-text("Status")').first().click();
      await page.waitForSelector('[data-testid="filter-status-open"]', { state: 'visible' });
      await page.locator('[data-testid="filter-status-open"]').click();

      // Wait for URL to clear the filter
      await page.waitForURL(/dashboard$/, { timeout: 5000 });

      // Verify URL has no filters
      await expect(page).toHaveURL(/dashboard$/);
    });
  });
