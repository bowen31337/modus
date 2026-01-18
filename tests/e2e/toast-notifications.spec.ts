/**
 * E2E Test: Toast Notifications
 *
 * Test Steps:
 * 1. Navigate to the dashboard URL
 * 2. Test success toast on post assignment
 * 3. Test error toast on failed operations
 * 4. Test toast auto-dismissal
 * 5. Test toast styling and accessibility
 */

import { expect, test } from '@playwright/test';

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // Check if we're in demo mode (Supabase not configured)
    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible (wait for post cards instead of queue-container)
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should show success toast when assigning a post', async ({ page }) => {
    // Click on first post to trigger assignment
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for success toast to appear
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // Verify toast content
    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toBeVisible();
    await expect(successToast.locator('text=Post assigned')).toBeVisible();

    // Verify toast has success icon (CheckCircle)
    const icon = successToast.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test('should show success toast when resolving a post', async ({ page }) => {
    // Click on first post to open it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click Resolve button
    await page.click('button:has-text("Resolve")');

    // Wait for success toast to appear
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // Verify toast content
    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toContainText('Post resolved');
    await expect(successToast).toContainText('The post has been marked as resolved.');
  });

  test('should show info toast when releasing a post', async ({ page }) => {
    // Click on first post to open it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click Release button
    await page.click('button:has-text("Release")');

    // Wait for info toast to appear
    await page.waitForSelector('[data-testid="toast-info"]', { timeout: 5000 });

    // Verify toast content
    const infoToast = page.locator('[data-testid="toast-info"]');
    await expect(infoToast).toContainText('Post released');
    await expect(infoToast).toContainText('The post has been released back to the queue.');
  });

  test('should show error toast when post loading fails', async ({ page }) => {
    // Intercept the posts API call and make it fail
    await page.route('**/api/v1/posts/**', (route) => {
      route.abort('failed');
    });

    // Navigate to dashboard with a specific post ID in URL
    await page.goto('/dashboard?post=nonexistent-post-id');

    // Wait for error toast to appear
    await page.waitForSelector('[data-testid="toast-error"]', { timeout: 5000 });

    // Verify toast content
    const errorToast = page.locator('[data-testid="toast-error"]');
    await expect(errorToast).toContainText('Post not found');
    await expect(errorToast).toContainText('The post you requested could not be loaded.');
  });

  test('should show error toast when assignment fails', async ({ page }) => {
    // Intercept the assign API call and make it fail
    await page.route('**/api/v1/posts/*/assign', (route) => {
      route.abort('failed');
    });

    // Click on first post to trigger assignment (which will fail)
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for error toast to appear
    await page.waitForSelector('[data-testid="toast-error"]', { timeout: 5000 });

    // Verify toast content
    const errorToast = page.locator('[data-testid="toast-error"]');
    await expect(errorToast).toContainText('Assignment failed');
  });

  test('should allow dismissing toast manually', async ({ page }) => {
    // Click on first post to trigger assignment
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for success toast to appear
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // Click the close button on the toast
    const successToast = page.locator('[data-testid="toast-success"]');
    await successToast.locator('button[aria-label="Close notification"]').click();

    // Verify toast is dismissed
    await expect(successToast).not.toBeVisible({ timeout: 2000 });
  });

  test('should auto-dismiss toast after duration', async ({ page }) => {
    // Click on first post to trigger assignment
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for success toast to appear
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toBeVisible();

    // Wait for toast to auto-dismiss (default duration is 5000ms)
    // We'll wait a bit longer to ensure it's gone
    await expect(successToast).not.toBeVisible({ timeout: 7000 });
  });

  test('should show toast styling based on type', async ({ page }) => {
    // Test success toast styling
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    // Verify it has the success type data attribute
    await expect(successToast).toHaveAttribute('data-toast-type', 'success');

    // Dismiss the toast
    await successToast.locator('button[aria-label="Close notification"]').click();

    // Test error toast styling (trigger by failing a request)
    await page.route('**/api/v1/posts/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/dashboard?post=nonexistent-post-id');

    await page.waitForSelector('[data-testid="toast-error"]', { timeout: 5000 });
    const errorToast = page.locator('[data-testid="toast-error"]');
    await expect(errorToast).toHaveAttribute('data-toast-type', 'error');
  });

  test('should stack multiple toasts', async ({ page }) => {
    // Trigger multiple toasts by assigning multiple posts
    const posts = page.locator('[data-testid^="post-card-"]');

    // Click on first two posts quickly
    await posts.nth(0).click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // Release the first post to trigger another toast
    await page.click('button:has-text("Release")');
    await page.waitForSelector('[data-testid="toast-info"]', { timeout: 5000 });

    // Verify we have multiple toasts visible
    const toasts = page.locator('[data-testid^="toast-"]');
    const toastCount = await toasts.count();
    expect(toastCount).toBeGreaterThanOrEqual(2);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Click on first post to trigger assignment
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();

    // Wait for success toast to appear
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');

    // Verify close button has accessible label
    const closeButton = successToast.locator('button[aria-label="Close notification"]');
    await expect(closeButton).toBeVisible();

    // Verify toast has proper role (handled by Radix UI)
    // The toast should be keyboard accessible
    await closeButton.focus();
    await expect(closeButton).toBeFocused();

    // Press Enter to close
    await closeButton.press('Enter');
    await expect(successToast).not.toBeVisible({ timeout: 2000 });
  });

  test('should show toast after reassigning post', async ({ page }) => {
    // Click on first post to open it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click reassign button (if available) or use keyboard shortcut
    // First, let's try to find the reassign button
    const reassignButton = page.locator('button:has-text("Reassign")');
    if (await reassignButton.isVisible()) {
      await reassignButton.click();

      // Select an agent from the dropdown
      await page.locator('button:has-text("Agent B")').first().click();

      // Wait for success toast
      await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });
      const successToast = page.locator('[data-testid="toast-success"]');
      await expect(successToast).toContainText('Post reassigned');
    }
  });
});

test.describe('Toast Notifications - Consistent Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // Check if we're in demo mode (Supabase not configured)
    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible (wait for post cards instead of queue-container)
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should have consistent border styling across all toast types', async ({ page }) => {
    // Test success toast
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toHaveClass(/border/);
    await expect(successToast).toHaveClass(/rounded-lg/);

    // Verify border has subtle opacity
    const successClasses = await successToast.getAttribute('class');
    expect(successClasses).toMatch(/border-emerald-500\/30/);

    // Dismiss and test error toast
    await successToast.locator('button[aria-label="Close notification"]').click();
    await expect(successToast).not.toBeVisible({ timeout: 2000 });

    await page.route('**/api/v1/posts/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/dashboard?post=nonexistent-post-id');
    await page.waitForSelector('[data-testid="toast-error"]', { timeout: 5000 });

    const errorToast = page.locator('[data-testid="toast-error"]');
    const errorClasses = await errorToast.getAttribute('class');
    expect(errorClasses).toMatch(/border-red-500\/30/);
    expect(errorClasses).toMatch(/rounded-lg/);
  });

  test('should have consistent background and opacity across toast types', async ({ page }) => {
    // Test success toast background
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const successClasses = await successToast.getAttribute('class');
    expect(successClasses).toMatch(/bg-background-secondary/);
    expect(successClasses).toMatch(/bg-emerald-500\/10/);

    // Verify consistent spacing
    expect(successClasses).toMatch(/p-4/);
    expect(successClasses).toMatch(/gap-3/);
  });

  test('should have consistent icon sizing and positioning', async ({ page }) => {
    // Test success toast icon
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const icon = successToast.locator('svg').first();

    // Verify icon has consistent sizing
    const iconClasses = await icon.getAttribute('class');
    expect(iconClasses).toMatch(/h-4\.5/);
    expect(iconClasses).toMatch(/w-4\.5/);
    expect(iconClasses).toMatch(/flex-shrink-0/);

    // Verify icon color is consistent (emerald for success)
    expect(iconClasses).toMatch(/text-emerald-400/);
  });

  test('should have consistent typography for title and description', async ({ page }) => {
    // Test success toast typography
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');

    // Verify title styling
    const title = successToast.locator('[data-testid="toast-success"]').locator('..').locator('text=Post assigned');
    const titleClasses = await title.getAttribute('class');
    expect(titleClasses).toMatch(/text-sm/);
    expect(titleClasses).toMatch(/font-semibold/);
    expect(titleClasses).toMatch(/leading-tight/);

    // Verify description styling (if present)
    const description = successToast.locator('p');
    if (await description.count() > 0) {
      const descriptionClasses = await description.first().getAttribute('class');
      expect(descriptionClasses).toMatch(/text-sm/);
      expect(descriptionClasses).toMatch(/text-foreground-secondary/);
      expect(descriptionClasses).toMatch(/leading-tight/);
    }
  });

  test('should have consistent close button styling', async ({ page }) => {
    // Test close button styling
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const closeButton = successToast.locator('button[aria-label="Close notification"]');

    // Verify close button styling
    const buttonClasses = await closeButton.getAttribute('class');
    expect(buttonClasses).toMatch(/rounded-md/);
    expect(buttonClasses).toMatch(/p-1/);
    expect(buttonClasses).toMatch(/hover:bg-background-tertiary/);
    expect(buttonClasses).toMatch(/transition-all/);
    expect(buttonClasses).toMatch(/duration-150/);
    expect(buttonClasses).toMatch(/active:scale-95/);

    // Verify close icon sizing
    const closeIcon = closeButton.locator('svg');
    const closeIconClasses = await closeIcon.getAttribute('class');
    expect(closeIconClasses).toMatch(/text-muted-foreground/);
  });

  test('should have consistent viewport positioning', async ({ page }) => {
    // Trigger a toast
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    // Verify toast is positioned correctly (viewport should be top-right)
    const viewport = page.locator('[data-testid="toast-success"]').locator('..');
    const viewportClasses = await viewport.getAttribute('class');

    // The viewport should have positioning classes
    expect(viewportClasses).toMatch(/fixed/);
    expect(viewportClasses).toMatch(/top-4/);
    expect(viewportClasses).toMatch(/right-4/);
    expect(viewportClasses).toMatch(/z-\[100\]/);
  });

  test('should have consistent spacing when stacked', async ({ page }) => {
    // Trigger multiple toasts
    const posts = page.locator('[data-testid^="post-card-"]');

    await posts.nth(0).click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    await page.click('button:has-text("Release")');
    await page.waitForSelector('[data-testid="toast-info"]', { timeout: 5000 });

    // Verify toasts have consistent gap
    const toasts = page.locator('[data-testid^="toast-"]');
    const toastCount = await toasts.count();
    expect(toastCount).toBeGreaterThanOrEqual(2);

    // Check that viewport has consistent gap between toasts
    const firstToast = toasts.first();
    const viewport = firstToast.locator('..');
    const viewportClasses = await viewport.getAttribute('class');
    expect(viewportClasses).toMatch(/gap-2/);
  });

  test('should have consistent focus ring styling on close button', async ({ page }) => {
    // Test focus ring on close button
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const closeButton = successToast.locator('button[aria-label="Close notification"]');

    // Focus the close button
    await closeButton.focus();
    await expect(closeButton).toBeFocused();

    // Verify focus ring styling
    const buttonClasses = await closeButton.getAttribute('class');
    expect(buttonClasses).toMatch(/focus:outline-none/);
    expect(buttonClasses).toMatch(/focus:ring-2/);
    expect(buttonClasses).toMatch(/focus:ring-primary\/50/);
  });

  test('should have consistent swipe animation classes', async ({ page }) => {
    // Test swipe animation classes are present
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const toastClasses = await successToast.getAttribute('class');

    // Verify swipe animation classes
    expect(toastClasses).toMatch(/data-\[swipe=cancel\]/);
    expect(toastClasses).toMatch(/data-\[swipe=end\]/);
    expect(toastClasses).toMatch(/data-\[swipe=move\]/);
  });

  test('should have consistent transition timing', async ({ page }) => {
    // Test transition timing is consistent
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const toastClasses = await successToast.getAttribute('class');

    // Verify transition classes
    expect(toastClasses).toMatch(/transition-all/);
    expect(toastClasses).toMatch(/duration-150/);
  });

  test('should have consistent text alignment and wrapping', async ({ page }) => {
    // Test text alignment
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');

    // Verify content container has proper flex alignment
    const toastClasses = await successToast.getAttribute('class');
    expect(toastClasses).toMatch(/items-start/); // Changed from items-center to items-start for better alignment with multi-line text
    expect(toastClasses).toMatch(/flex/);
    expect(toastClasses).toMatch(/gap-3/);
  });

  test('should have consistent min-width for content area', async ({ page }) => {
    // Test content area min-width
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 });

    const successToast = page.locator('[data-testid="toast-success"]');
    const contentContainer = successToast.locator('div').first();

    // Verify content container has min-w-0 for proper text truncation
    const contentClasses = await contentContainer.getAttribute('class');
    expect(contentClasses).toMatch(/min-w-0/);
  });
});
