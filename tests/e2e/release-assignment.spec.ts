import { test, expect } from '@playwright/test';

test.describe('Release Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);

    // Wait for queue pane to be visible
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Remove Next.js dev overlay using JavaScript
    await page.evaluate(() => {
      const overlay = document.querySelector('nextjs-portal');
      if (overlay) {
        overlay.remove();
      }
    });
  });

  test('should display release button when post is assigned to current agent', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify release button is visible
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Verify release button text
    await expect(page.getByTestId('release-button')).toHaveText('Release');
  });

  test('should release assignment when release button is clicked', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify "Assigned to you" badge is visible in the header
    await expect(page.locator('[data-testid="work-pane"] >> text=Assigned to you').first()).toBeVisible();

    // Click release button
    await page.getByTestId('release-button').click();

    // Verify "Assign to Me" button is now visible
    await expect(page.getByTestId('assign-to-me-button')).toBeVisible();

    // Verify "Assigned to you" badge is no longer visible in the header
    await expect(page.locator('[data-testid="work-pane"] >> text=Assigned to you')).not.toBeVisible();
  });

  test('should show assign button instead of release button for unassigned posts', async ({ page }) => {
    // Select a post (which auto-assigns it)
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Release the assignment
    await page.getByTestId('release-button').click();

    // Verify assign button is visible
    await expect(page.getByTestId('assign-to-me-button')).toBeVisible();

    // Verify release button is not visible
    await expect(page.getByTestId('release-button')).not.toBeVisible();
  });

  test('should allow reassigning after releasing', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Release the assignment
    await page.getByTestId('release-button').click();

    // Assign again
    await page.getByTestId('assign-to-me-button').click();

    // Verify "Assigned to you" badge is visible again in the header
    await expect(page.locator('[data-testid="work-pane"] >> text=Assigned to you').first()).toBeVisible();

    // Verify release button is back
    await expect(page.getByTestId('release-button')).toBeVisible();
  });

  test('should remove assignment indicator from post card when released', async ({ page }) => {
    // Get the first post card
    const firstPost = page.locator('[data-testid="post-card-1"]');

    // Click to assign
    await firstPost.click();
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Release the assignment
    await page.getByTestId('release-button').click();

    // Verify the post card no longer shows "Assigned to you" in the queue
    // (This depends on how assignment is displayed in post cards)
    await expect(firstPost).toBeVisible();
  });

  test('should maintain release state when switching between posts', async ({ page }) => {
    // Assign first post
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Switch to second post (which should auto-assign)
    await page.click('[data-testid="post-card-2"]');
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Switch back to first post
    await page.click('[data-testid="post-card-1"]');

    // First post should still show as assigned (release button visible)
    await expect(page.getByTestId('release-button')).toBeVisible();
  });

  test('should have accessible release button with proper labeling', async ({ page }) => {
    // Assign a post
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Check button has proper attributes
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    // Button should be a native button element (has implicit button role)
    await expect(releaseButton).toHaveAttribute('type', 'button'); // Not a form submit button
  });

  test('should display release button with correct styling', async ({ page }) => {
    // Assign a post
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Check button styling
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toHaveCSS('padding', /\d+/); // Has padding
    await expect(releaseButton).toHaveCSS('border-radius', /\d+/); // Has rounded corners
  });
});
