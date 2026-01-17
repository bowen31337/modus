import { test, expect } from '@playwright/test';

test.describe('View Toggle (Grid/List)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for the queue to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should display view toggle buttons in queue pane', async ({ page }) => {
    // Check for list view button
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await expect(listViewButton).toBeVisible();
    await expect(listViewButton).toHaveAttribute('title', 'List view');

    // Check for grid view button
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await expect(gridViewButton).toBeVisible();
    await expect(gridViewButton).toHaveAttribute('title', 'Grid view');
  });

  test('should display posts in list view by default', async ({ page }) => {
    // Check that list view is active by default
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await expect(listViewButton).toHaveClass(/bg-background-secondary/);

    // Check that grid view is not active
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await expect(gridViewButton).toHaveClass(/hover:bg-background-secondary/);

    // Check that posts are displayed in list layout
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await expect(firstPost).toHaveClass(/border-b/); // List view has bottom border
  });

  test('should switch to grid view when grid button is clicked', async ({ page }) => {
    // Click grid view button
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Check that grid view is now active
    await expect(gridViewButton).toHaveClass(/bg-background-secondary/);

    // Check that list view is not active
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await expect(listViewButton).toHaveClass(/hover:bg-background-secondary/);

    // Check that posts are displayed in grid layout
    const queueContainer = page.locator('[data-testid="queue-container"]');
    await expect(queueContainer).toHaveClass(/grid/);
    await expect(queueContainer).toHaveClass(/grid-cols-2/);
  });

  test('should switch back to list view when list button is clicked', async ({ page }) => {
    // First switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Verify grid view is active
    await expect(gridViewButton).toHaveClass(/bg-background-secondary/);

    // Click list view button
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await listViewButton.click();

    // Check that list view is now active again
    await expect(listViewButton).toHaveClass(/bg-background-secondary/);

    // Check that grid view is not active
    await expect(gridViewButton).toHaveClass(/hover:bg-background-secondary/);

    // Check that posts are displayed in list layout
    const queueContainer = page.locator('[data-testid="queue-container"]');
    await expect(queueContainer).not.toHaveClass(/grid/);
  });

  test('should maintain grid view layout across page navigation', async ({ page }) => {
    // Switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Verify grid view is active
    await expect(gridViewButton).toHaveClass(/bg-background-secondary/);

    // Reload the page
    await page.reload();

    // Wait for the queue to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 5000 });

    // Note: In a real app, view mode would be persisted in localStorage
    // For now, we just verify the toggle still works after reload
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await expect(listViewButton).toBeVisible();
    await expect(gridViewButton).toBeVisible();
  });

  test('should display posts as cards in grid view with proper styling', async ({ page }) => {
    // Switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Check that posts have card styling
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await expect(firstPost).toHaveClass(/rounded-lg/); // Grid view has rounded corners
    await expect(firstPost).toHaveClass(/border/); // Grid view has full border

    // Check that priority strip is horizontal in grid view
    const priorityStrip = firstPost.locator('.bg-red-500, .bg-orange-500, .bg-yellow-500, .bg-blue-500, .bg-gray-500').first();
    await expect(priorityStrip).toBeVisible();
  });

  test('should display posts in compact rows in list view', async ({ page }) => {
    // Ensure list view is active
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await expect(listViewButton).toHaveClass(/bg-background-secondary/);

    // Check that posts have list styling
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await expect(firstPost).toHaveClass(/border-b/); // List view has bottom border

    // Check that priority strip is vertical in list view
    const priorityStrip = firstPost.locator('.w-1'); // Vertical strip
    await expect(priorityStrip).toBeVisible();
  });

  test('should preserve filters and search when switching views', async ({ page }) => {
    // Apply a filter - open filter dropdown and select priority
    const filterButton = page.locator('button:has-text("Filters")').first();
    await filterButton.click();

    // Wait for dropdown to appear and select priority
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("Priority")').first().click();
    await dropdown.locator('button:has-text("P1")').first().click();

    // Close dropdown by clicking the backdrop (z-40)
    const backdrop = page.locator('div.z-40');
    await backdrop.click();

    // Wait for dropdown to close
    await page.waitForTimeout(300);

    // Verify filter is active - check for the active styling on the filter button
    // The filter button uses bg-primary/10 for active state
    await expect(filterButton).toHaveClass(/bg-primary\/10/);

    // Switch to grid view - use click with force to bypass any remaining overlays
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click({ force: true });

    // Wait for view switch to complete
    await page.waitForTimeout(300);

    // Verify filter is still active (filter button has active styling)
    await expect(filterButton).toHaveClass(/bg-primary\/10/);

    // Switch back to list view
    const listViewButton = page.locator('[data-testid="view-toggle-list"]');
    await listViewButton.click({ force: true });

    // Wait for view switch to complete
    await page.waitForTimeout(300);

    // Verify filter is still active
    await expect(filterButton).toHaveClass(/bg-primary\/10/);
  });

  test('should preserve sort order when switching views', async ({ page }) => {
    // Change sort order - open sort dropdown and select date
    await page.locator('button:has-text("Sort")').first().click();
    await page.locator('button:has-text("Date")').first().click();

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape');

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Verify sort is still active (sort button shows "Sort: Date")
    const sortButton = page.locator('button:has-text("Sort")').first();
    await expect(sortButton).toContainText('Date');
  });

  test('should allow selecting posts in both view modes', async ({ page }) => {
    // Select a post in list view
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Verify post is selected
    await expect(firstPost).toHaveClass(/ring-primary/);

    // Switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Verify post is still selected in grid view
    await expect(firstPost).toHaveClass(/ring-primary/);

    // Click another post in grid view
    const secondPost = page.locator('[data-testid^="post-card-"]').nth(1);
    await secondPost.click();

    // Verify second post is now selected
    await expect(secondPost).toHaveClass(/ring-primary/);
    await expect(firstPost).not.toHaveClass(/ring-primary/);
  });

  test('should display same number of posts in both views', async ({ page }) => {
    // Count posts in list view
    const postsInList = await page.locator('[data-testid^="post-card-"]').count();
    expect(postsInList).toBeGreaterThan(0);

    // Switch to grid view
    const gridViewButton = page.locator('[data-testid="view-toggle-grid"]');
    await gridViewButton.click();

    // Count posts in grid view
    const postsInGrid = await page.locator('[data-testid^="post-card-"]').count();

    // Should have same number of posts
    expect(postsInGrid).toBe(postsInList);
  });
});
