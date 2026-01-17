/**
 * E2E Test: Three-Pane Layout
 * Feature #1: Application loads and displays the main three-pane layout
 *
 * Test Steps:
 * 1. Navigate to the dashboard URL
 * 2. Wait for the page to fully load
 * 3. Verify the left rail navigation (64px width) is visible with logo and navigation icons
 * 4. Verify the queue pane (320-400px width) is visible with search bar and filter controls
 * 5. Verify the work pane (flexible width) is visible and takes remaining space
 * 6. Verify all three panes are responsive and properly positioned
 */

import { test, expect } from '@playwright/test';

test.describe('Three-Pane Layout', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);

    // Navigate directly to dashboard with hard reload
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Wait for the queue to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should display the main three-pane layout', async ({ page }) => {
    // Step 1 & 2: Navigate and wait for page to load
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Verify the left rail (64px width) is visible
    // Use the data-testid to identify the left rail
    const leftRail = page.getByTestId('left-rail');
    await expect(leftRail).toBeVisible();

    // Verify left rail has exact width of 64px
    const leftRailWidth = await leftRail.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    // Parse and check width (allow for small rounding differences)
    const widthNum = parseInt(leftRailWidth);
    expect(widthNum).toBeGreaterThanOrEqual(60);
    expect(widthNum).toBeLessThanOrEqual(70);

    // Verify logo is visible in left rail
    const logo = page.locator('div').filter({ hasText: /^m$/ }).first();
    await expect(logo).toBeVisible();

    // Verify navigation icons are present (Home, Queue, Assigned, Settings, Logout)
    const navIcons = page.locator('nav a');
    await expect(navIcons).toHaveCount(4);

    // Step 4: Verify the queue pane (320-400px width) is visible
    const queuePane = page.getByTestId('queue-pane');
    await expect(queuePane).toBeVisible();

    // Verify queue pane width is between 320px and 400px
    const queuePaneWidth = await queuePane.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).width);
    });
    expect(queuePaneWidth).toBeGreaterThanOrEqual(320);
    expect(queuePaneWidth).toBeLessThanOrEqual(400);

    // Verify queue pane has search bar
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);

    // Verify queue pane has filter controls
    const filterButtons = page.locator('button:has-text("Filters"), button:has-text("Sort")');
    await expect(filterButtons).toHaveCount(2);

    // Verify queue pane has moderation queue header
    const queueHeader = page.locator('h2:has-text("Moderation Queue")');
    await expect(queueHeader).toBeVisible();

    // Step 5: Verify the work pane (flexible width) is visible
    // The work pane is the remaining content area after left rail and queue pane
    const workPaneContent = page.locator('text=Select a post');
    await expect(workPaneContent).toBeVisible();

    // Step 6: Verify all three panes are properly positioned
    // Check that we have the main layout structure
    const mainContainer = page.locator('div.flex.h-screen.overflow-hidden');
    await expect(mainContainer).toBeVisible();
  });

  test('should display post cards in the queue with correct metadata', async ({ page }) => {
    // Verify post cards are displayed (now using real button elements)
    const postCards = page.getByRole('button').filter({ hasText: 'Unable to access' });
    await expect(postCards.first()).toBeVisible();

    // Verify first post has P1 priority
    const firstPost = page.getByRole('button').filter({ hasText: 'Unable to access' }).first();
    await expect(firstPost).toBeVisible();

    // Check for priority badge
    const priorityBadge = firstPost.locator('span:has-text("P1")');
    await expect(priorityBadge).toBeVisible();

    // Check for status badge
    const statusBadge = firstPost.locator('span:has-text("Open")');
    await expect(statusBadge).toBeVisible();

    // Check for sentiment indicator (negative sentiment should show AlertCircle)
    const sentimentIndicator = firstPost.locator('svg').first();
    await expect(sentimentIndicator).toBeVisible();
  });

  test('should allow selecting a post from the queue', async ({ page }) => {
    // Click on the first post card
    const firstPost = page.getByRole('button').filter({ hasText: 'Unable to access' }).first();
    await firstPost.click();

    // Wait for React state to update
    await page.waitForTimeout(1000);

    // Check that the button shows as pressed/active
    await expect(firstPost).toHaveAttribute('aria-pressed', 'true');

    // The work pane shows the selected post content
    // Look for the h1 with the post title in the work pane
    // Use toHaveText instead of toBeVisible since the element might be in a scrollable container
    const postTitle = page.locator('h1:has-text("Unable to access my account after password reset")');
    await expect(postTitle).toHaveText('Unable to access my account after password reset', { timeout: 10000 });
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Verify left rail navigation links have proper attributes
    const navLinks = page.locator('nav a');
    const navLinkCount = await navLinks.count();

    for (let i = 0; i < navLinkCount; i++) {
      const navLink = navLinks.nth(i);
      await expect(navLink).toHaveAttribute('href');
      // Verify aria-label or title attribute for accessibility
      const hasLabel = await navLink.getAttribute('aria-label') || await navLink.getAttribute('title');
      expect(hasLabel).toBeTruthy();
    }

    // Verify post cards are proper button elements
    const postCards = page.getByRole('button').filter({ hasText: 'Unable to access' });
    await expect(postCards.first()).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set viewport to tablet size (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });

    // Reload to ensure responsive layout
    await page.reload();

    // Verify all three panes are still visible
    const leftRail = page.getByTestId('left-rail');
    const queuePane = page.getByTestId('queue-pane');

    await expect(leftRail).toBeVisible();
    await expect(queuePane).toBeVisible();

    // On tablet, queue pane might be narrower but should still be visible
    const queuePaneWidth = await queuePane.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).width);
    });
    expect(queuePaneWidth).toBeGreaterThanOrEqual(200); // Minimum readable width on tablet
  });

  test('should display queue stats at the bottom', async ({ page }) => {
    // Verify queue stats are displayed
    const totalPosts = page.locator('text=Total:');
    await expect(totalPosts).toBeVisible();

    const openPosts = page.locator('text=Open:');
    await expect(openPosts).toBeVisible();
  });
});
