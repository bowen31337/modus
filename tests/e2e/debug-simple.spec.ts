import { test } from '@playwright/test';

test.describe('Debug Simple', () => {
  test('check page source at /dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Get the current URL
    const url = page.url();
    console.log('Current URL:', url);

    // Get page HTML source
    const html = await page.content();
    console.log('Page HTML (first 2000 chars):', html.substring(0, 2000));

    // Check for any error messages in the HTML
    if (html.includes('missing required error components')) {
      console.log('FOUND: "missing required error components" error message');
    }
    if (html.includes('Error')) {
      console.log('FOUND: "Error" in page');
    }
  });
});
