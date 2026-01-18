import { test } from '@playwright/test';

test.describe('Command Palette - DOM Check', () => {
  test.beforeEach(async ({ page, context }) => {
    // Add demo session cookie to bypass login
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for the page to load and keyboard listener to be attached
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for the keyboard listener marker to be present (it's hidden with display: none)
    await page.waitForSelector('#cmd-k-listener-attached', { state: 'attached', timeout: 10000 });
  });

  test('should check if command-palette test-id exists in DOM', async ({ page }) => {
    // Check count of elements with command-palette test-id
    const count = await page.locator('[data-testid="command-palette"]').count();
    console.log('Command palette elements found:', count);

    // If count is 0, the component is not being rendered at all
    if (count === 0) {
      console.log('CommandPalette component is NOT rendered in the DOM');

      // Check if the component is rendered but with different test-id or structure
      const allTestIds = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map((el) => el.getAttribute('data-testid'));
      });

      console.log('All test-ids on page:', allTestIds.slice(0, 20)); // Show first 20
    }
  });

  test('should manually check React component rendering', async ({ page }) => {
    // Check if React has rendered the component
    const hasCommandPalette = await page.evaluate(() => {
      // Look for any element that might be the command palette
      const body = document.body.innerHTML;
      return body.includes('command-palette') || body.includes('CommandPalette');
    });

    console.log('Page contains command-palette text:', hasCommandPalette);
  });
});
