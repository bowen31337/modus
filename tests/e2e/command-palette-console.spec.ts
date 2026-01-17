import { test, expect } from '@playwright/test';

test.describe('Command Palette - Console Debug', () => {
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

    // Wait for the page to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should capture console logs and check keyboard events', async ({ page }) => {
    // Collect console logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
        console.log('Browser console:', msg.text());
      }
    });

    // Verify listener is attached
    await page.waitForTimeout(1000);
    console.log('Console logs after page load:', logs);

    // Press Cmd+K
    await page.keyboard.press('Meta+k');

    // Wait for potential state updates
    await page.waitForTimeout(500);

    // Check logs
    console.log('Console logs after keyboard press:', logs);

    // Check if command palette opened
    const commandPalette = page.getByTestId('command-palette');
    const isOpen = await commandPalette.isVisible().catch(() => false);

    console.log('Command palette is open:', isOpen);
  });
});
