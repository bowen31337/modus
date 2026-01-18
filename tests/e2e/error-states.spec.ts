import { expect, test } from '@playwright/test';

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
    // Intercept the posts API call and make it fail (must be set up BEFORE navigation)
    await page.route('**/api/v1/posts**', (route) => {
      route.abort('failed');
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for error state to appear (target the ErrorState component specifically, not Next.js route announcer)
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 5000 });

    // Verify error message is displayed (use data-testid to avoid Next.js route announcer conflict)
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Failed to load posts');

    // Verify retry button is present
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Verify error icon is visible (AlertCircle icon from lucide-react)
    // The error icon is the first SVG inside the error state (before the button's refresh icon)
    const errorState = page.locator('[data-testid="error-state"]');
    await expect(errorState.locator('svg').first()).toBeVisible();
  });

  test('should allow retrying after error', async ({ page }) => {
    let attemptCount = 0;

    // Intercept the posts API call (must be set up BEFORE navigation)
    await page.route('**/api/v1/posts**', (route) => {
      attemptCount++;

      // Fail first attempt, succeed second
      if (attemptCount === 1) {
        route.abort('failed');
      } else {
        // Continue with normal request on retry
        route.continue();
      }
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for error state to appear
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 5000 });

    // Verify error state is showing
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Failed to load posts');

    // Click retry button
    await page.click('button:has-text("Try Again")');

    // Wait for posts to load successfully
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    // Verify posts are now displayed
    const postCards = page.locator('[data-testid^="post-card-"]');
    await expect(postCards.first()).toBeVisible();

    // Verify error state is gone
    await expect(page.locator('[data-testid="error-state"]')).not.toBeVisible();
  });

  test('should show inline error when response loading fails', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    // Intercept responses API to make it fail
    await page.route('**/api/v1/posts/*/responses', (route) => {
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
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    // Click on first post to open it
    await page.locator('[data-testid^="post-card-"]').first().click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Intercept response submission to make it fail
    await page.route('**/api/v1/posts/*/responses', async (route) => {
      if (route.request().method() === 'POST') {
        // Abort the POST request
        route.abort('failed');
      } else {
        // Let GET requests through
        route.continue();
      }
    });

    // Type response content
    await page.fill('[data-testid="response-textarea"]', 'This is a test response');

    // Click Send Response button
    await page.click('button:has-text("Send Response")');

    // Wait for error message to appear
    await page.waitForSelector('text=Failed to send response', { timeout: 5000 });

    // Verify error message is displayed
    await expect(page.locator('text=Failed to send response')).toBeVisible();
  });

  test('should maintain error state styling and accessibility', async ({ page }) => {
    // Intercept the posts API call and make it fail (must be set up BEFORE navigation)
    await page.route('**/api/v1/posts**', (route) => {
      route.abort('failed');
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for error state
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 5000 });

    // Check ARIA attributes for accessibility
    const alert = page.locator('[data-testid="error-state"]');
    await expect(alert).toHaveAttribute('aria-live', 'polite');

    // Verify error icon has proper aria-hidden (first SVG is the alert icon)
    const errorState = page.locator('[data-testid="error-state"]');
    const icon = errorState.locator('svg').first();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');

    // Verify retry button is keyboard accessible
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Test keyboard navigation to retry button
    await retryButton.focus();
    await expect(retryButton).toBeFocused();
  });

  test('should clear error state when filters change', async ({ page }) => {
    let requestCount = 0;

    // Intercept the posts API call (must be set up BEFORE navigation)
    await page.route('**/api/v1/posts**', (route) => {
      requestCount++;

      // Fail first request
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        // Succeed on filter change
        route.continue();
      }
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for error state
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 5000 });

    // Verify error is shown
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Failed to load posts');

    // Open filter dropdown and change priority filter to trigger new request
    await page.click('[data-testid="filter-controls-button"]');
    await page.click('button:has-text("Priority")');
    await page.click('button:has-text("P2")');

    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    // Verify error state is cleared
    await expect(page.locator('[data-testid="error-state"]')).not.toBeVisible();
  });
});
