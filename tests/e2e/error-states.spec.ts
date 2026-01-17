import { test, expect } from '@playwright/test';

test.describe('Error States', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode cookie to bypass login
    await page.context().addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should show error state when post loading fails', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Intercept the posts API call and make it fail
    await page.route('**/api/v1/posts**', route => {
      route.abort('failed');
    });

    // Wait for error state to appear
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Verify error message is displayed
    await expect(page.locator('role=alert')).toContainText('Failed to load posts');

    // Verify retry button is present
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Verify error icon is visible
    await expect(page.locator('svg[data-icon="alert-circle"]')).toBeVisible();
  });

  test('should allow retrying after error', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    let attemptCount = 0;

    // Intercept the posts API call
    await page.route('**/api/v1/posts**', route => {
      attemptCount++;

      // Fail first attempt, succeed second
      if (attemptCount === 1) {
        route.abort('failed');
      } else {
        // Continue with normal request on retry
        route.continue();
      }
    });

    // Wait for error state to appear
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Verify error state is showing
    await expect(page.locator('role=alert')).toContainText('Failed to load posts');

    // Click retry button
    await page.click('button:has-text("Try Again")');

    // Wait for posts to load successfully
    await page.waitForSelector('[data-testid="post-card-"]', { timeout: 5000 });

    // Verify posts are now displayed
    const postCards = page.locator('[data-testid^="post-card-"]');
    await expect(postCards.first()).toBeVisible();

    // Verify error state is gone
    await expect(page.locator('role=alert')).not.toBeVisible();
  });

  test('should show inline error when response loading fails', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card-"]', { timeout: 5000 });

    // Intercept responses API to make it fail
    await page.route('**/api/v1/posts/*/responses', route => {
      route.abort('failed');
    });

    // Click on first post to open it
    await page.locator('[data-testid^="post-card-"]').first().click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Wait for inline error to appear
    await page.waitForSelector('text=Failed to load responses', { timeout: 5000 });

    // Verify inline error message
    await expect(page.locator('text=Failed to load responses')).toBeVisible();

    // Verify retry link/button in inline error
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should show error message when response submission fails', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card-"]', { timeout: 5000 });

    // Click on first post to open it
    await page.locator('[data-testid^="post-card-"]').first().click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Intercept response submission to make it fail
    await page.route('**/api/v1/posts/*/responses', async route => {
      if (route.request().method() === 'POST') {
        // Abort the POST request
        route.abort('failed');
      } else {
        // Let GET requests through
        route.continue();
      }
    });

    // Type response content
    await page.fill('[data-testid="response-editor"]', 'This is a test response');

    // Click Send Response button
    await page.click('button:has-text("Send Response")');

    // Wait for error message to appear
    await page.waitForSelector('text=Failed to send response', { timeout: 5000 });

    // Verify error message is displayed
    await expect(page.locator('text=Failed to send response')).toBeVisible();
  });

  test('should maintain error state styling and accessibility', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Intercept the posts API call and make it fail
    await page.route('**/api/v1/posts**', route => {
      route.abort('failed');
    });

    // Wait for error state
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Check ARIA attributes for accessibility
    const alert = page.locator('[role="alert"]');
    await expect(alert).toHaveAttribute('aria-live', 'polite');

    // Verify error icon has proper aria-hidden
    const icon = page.locator('svg').first();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');

    // Verify retry button is keyboard accessible
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Test keyboard navigation to retry button
    await retryButton.focus();
    await expect(retryButton).toBeFocused();
  });

  test('should clear error state when filters change', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    let requestCount = 0;

    // Intercept the posts API call
    await page.route('**/api/v1/posts**', route => {
      requestCount++;

      // Fail first request
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        // Succeed on filter change
        route.continue();
      }
    });

    // Wait for error state
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Verify error is shown
    await expect(page.locator('role=alert')).toContainText('Failed to load posts');

    // Change filter to trigger new request
    await page.click('button:has-text("Priority")');
    await page.click('button:has-text("P2")');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card-"]', { timeout: 5000 });

    // Verify error state is cleared
    await expect(page.locator('role=alert')).not.toBeVisible();
  });
});
