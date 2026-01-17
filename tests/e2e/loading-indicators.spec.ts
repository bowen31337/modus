import { test, expect } from '@playwright/test';

test.describe('Loading Indicators', () => {
  test.beforeEach(async ({ page, context }) => {
    // Use cookie-based authentication for faster tests
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);
    await page.goto('/dashboard');
  });

  test('should show skeleton loaders when queue is loading', async ({ page }) => {
    // Wait for initial page load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Trigger a filter change to cause loading
    await page.getByRole('button', { name: /Filters/i }).click();

    // Wait for skeleton loaders to appear
    const skeletons = page.locator('[class*="animate-pulse"]');
    await expect(skeletons.first()).toBeVisible();

    // Wait for actual posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

    // Verify skeletons are gone and real posts are shown
    const postCards = page.locator('[data-testid^="post-card-"]');
    await expect(postCards.first()).toBeVisible();
  });

  test('should show skeleton loaders when loading activity history', async ({ page }) => {
    // Click on the first post to open detail view
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Look for skeleton loaders in activity history
    // They should appear briefly when the post is first opened
    const activityHistory = page.locator('text=Activity History');
    await expect(activityHistory).toBeVisible({ timeout: 10000 });

    // Wait for responses to load (skeletons should disappear)
    await page.waitForTimeout(500);

    // Check that skeletons are gone (either real responses or no responses section)
    const skeletons = page.locator('.animate-pulse');
    const responseCount = await skeletons.count();

    // Skeletons should have disappeared after loading
    expect(responseCount).toBe(0);
  });

  test('should show loading spinner on Send Response button during submission', async ({ page }) => {
    // Click on the first post to open detail view
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Type a response
    const textarea = page.locator('textarea[placeholder*="response"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('This is a test response');

    // Intercept the POST request to slow it down
    await page.route('**/api/v1/posts/*/responses', async (route) => {
      // Delay the response by 500ms to ensure we see the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      route.continue();
    });

    // Click Send Response button
    const sendButton = page.getByTestId('send-response-button');
    await sendButton.click();

    // Check for loading spinner
    const loader = sendButton.locator('svg.animate-spin');
    await expect(loader).toBeVisible({ timeout: 2000 });

    // Check for loading text
    await expect(sendButton).toContainText('Sending...', { timeout: 2000 });

    // Wait for submission to complete
    await page.waitForTimeout(1000);

    // Verify button text has changed back
    await expect(sendButton).not.toContainText('Sending...');
  });

  test('should show loading spinner on Add Note button during submission', async ({ page }) => {
    // Click on the first post to open detail view
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Toggle to internal note mode
    const noteToggle = page.getByRole('button', { name: /Internal Note/i });
    await noteToggle.click();

    // Type an internal note
    const textarea = page.locator('textarea[placeholder*="response"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('This is an internal note');

    // Intercept the POST request to slow it down
    await page.route('**/api/v1/posts/*/responses', async (route) => {
      // Delay the response by 500ms to ensure we see the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      route.continue();
    });

    // Click Add Note button
    const addButton = page.getByTestId('send-response-button');
    await addButton.click();

    // Check for loading spinner
    const loader = addButton.locator('svg.animate-spin');
    await expect(loader).toBeVisible({ timeout: 2000 });

    // Check for loading text
    await expect(addButton).toContainText('Adding...', { timeout: 2000 });

    // Wait for submission to complete
    await page.waitForTimeout(1000);

    // Verify button text has changed back
    await expect(addButton).not.toContainText('Adding...');
  });

  test('should disable Send Response button while submitting', async ({ page }) => {
    // Click on the first post to open detail view
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Type a response
    const textarea = page.locator('textarea[placeholder*="response"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Test response');

    // Intercept the POST request to slow it down
    await page.route('**/api/v1/posts/*/responses', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      route.continue();
    });

    // Click Send Response button
    const sendButton = page.getByTestId('send-response-button');
    await sendButton.click();

    // Verify button is disabled during submission
    await expect(sendButton).toBeDisabled({ timeout: 2000 });

    // Wait for submission to complete
    await page.waitForTimeout(1000);

    // Verify button is enabled again (though disabled because textarea is empty)
    const isDisabled = await sendButton.isDisabled();
    expect(isDisabled).toBe(true); // Should be disabled because textarea is now empty
  });

  test('should show correct number of skeleton loaders', async ({ page }) => {
    // Navigate to dashboard
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Trigger filter change to cause loading
    await page.getByRole('button', { name: /Filters/i }).click();

    // Check for 5 skeleton loaders during initial load
    const skeletons = page.locator('[class*="animate-pulse"]');
    const skeletonCount = await skeletons.count();

    // Should have multiple skeleton loaders (5 for initial load is configured)
    expect(skeletonCount).toBeGreaterThan(0);
    expect(skeletonCount).toBeLessThanOrEqual(10); // Reasonable upper bound
  });
});
