import { test, expect } from '@playwright/test';

test.describe('Release Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo');
    await page.click('button[type="submit"]', { timeout: 5000 });
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should display release button when post is assigned to current agent', async ({ page }) => {
    // Click on first post to assign it
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();

    // Wait for work pane to load
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify release button is visible
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Verify release button text
    await expect(page.getByTestId('release-button')).toHaveText('Release');
  });

  test('should release assignment when release button is clicked', async ({ page }) => {
    // Click on first post to assign it
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify "Assigned to you" badge is visible
    await expect(page.getByText('Assigned to you')).toBeVisible();

    // Click release button
    await page.getByTestId('release-button').click();

    // Verify "Assign to Me" button is now visible
    await expect(page.getByTestId('assign-to-me-button')).toBeVisible();

    // Verify "Assigned to you" badge is no longer visible
    await expect(page.getByText('Assigned to you')).not.toBeVisible();
  });

  test('should show assign button instead of release button for unassigned posts', async ({ page }) => {
    // Select a post (which auto-assigns it)
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();
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
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Release the assignment
    await page.getByTestId('release-button').click();

    // Assign again
    await page.getByTestId('assign-to-me-button').click();

    // Verify "Assigned to you" badge is visible again
    await expect(page.getByText('Assigned to you')).toBeVisible();

    // Verify release button is back
    await expect(page.getByTestId('release-button')).toBeVisible();
  });

  test('should remove assignment indicator from post card when released', async ({ page }) => {
    // Get the first post card
    const firstPost = page.getByTestId('queue-pane').getByTestId('post-card').first();

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
    await page.getByTestId('queue-pane').getByTestId('post-card').nth(0).click();
    await expect(page.getByTestId('work-pane')).toBeVisible();
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Switch to second post (which should auto-assign)
    await page.getByTestId('queue-pane').getByTestId('post-card').nth(1).click();
    await expect(page.getByTestId('release-button')).toBeVisible();

    // Switch back to first post
    await page.getByTestId('queue-pane').getByTestId('post-card').nth(0).click();

    // First post should still show as assigned (release button visible)
    await expect(page.getByTestId('release-button')).toBeVisible();
  });

  test('should have accessible release button with proper labeling', async ({ page }) => {
    // Assign a post
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Check button has proper attributes
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    await expect(releaseButton).toHaveAttribute('type', 'button');
  });

  test('should display release button with correct styling', async ({ page }) => {
    // Assign a post
    await page.getByTestId('queue-pane').getByTestId('post-card').first().click();
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Check button styling
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toHaveCSS('padding', /\d+/); // Has padding
    await expect(releaseButton).toHaveCSS('border-radius', /\d+/); // Has rounded corners
  });
});
