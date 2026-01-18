import { test } from '@playwright/test';

test.describe('Debug Page Content', () => {
  test('check what page loads at /dashboard', async ({ page, context }) => {
    // Add the demo session cookie
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    console.log('Navigating to /dashboard...');
    await page.goto('/dashboard');

    // Wait a bit for any redirects
    await page.waitForTimeout(3000);

    // Get the current URL
    const url = page.url();
    console.log('Current URL:', url);

    // Get page content
    const bodyText = await page
      .locator('body')
      .textContent()
      .catch(() => 'Could not get body text');
    console.log('Page body text:', bodyText);

    // Check for any error messages
    const errorElements = await page
      .locator('[data-testid*="error"], .error, [class*="error"]')
      .count();
    console.log('Error elements found:', errorElements);

    // Check for login redirect
    if (url.includes('/login')) {
      console.log('Page redirected to login!');
    }

    // Try to find any visible elements
    const allElements = await page.locator('body *').count();
    console.log('Total elements on page:', allElements);
  });

  test('check if dashboard loads without cookie in dev mode', async ({ page }) => {
    // Don't add cookie - test dev mode bypass
    console.log('Navigating to /dashboard WITHOUT cookie...');
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('Current URL:', url);

    // Get page content
    const bodyText = await page
      .locator('body')
      .textContent()
      .catch(() => 'Could not get body text');
    console.log('Page body text:', bodyText);

    // Check for queue pane
    const queuePane = page.locator('[data-testid="queue-pane"]');
    const queuePaneCount = await queuePane.count();
    console.log('Queue pane elements found:', queuePaneCount);
  });
});
