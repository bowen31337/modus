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

    // Wait for the page to load and keyboard listener to be attached
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for the keyboard listener marker to be present
    await page.waitForSelector('#cmd-k-listener-attached', { timeout: 10000 });
  });

  test('should capture console logs and check keyboard events', async ({ page }) => {
    // Collect ALL console logs (not just 'log' type)
    const logs: { type: string; text: string }[] = [];
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      logs.push({ type, text });
      console.log(`Browser console [${type}]:`, text);
    });

    // Wait for React to hydrate and useEffect to run
    await page.waitForTimeout(2000);
    console.log('Console logs after page load:', JSON.stringify(logs, null, 2));

    // Check if command palette is initially hidden
    const commandPalette = page.getByTestId('command-palette');
    const initiallyVisible = await commandPalette.isVisible().catch(() => false);
    console.log('Command palette initially visible:', initiallyVisible);

    // Press Cmd+K
    await page.keyboard.press('Meta+k');

    // Wait for React state update
    await page.waitForTimeout(1000);

    // Check logs after keyboard press
    console.log('Console logs after keyboard press:', JSON.stringify(logs, null, 2));

    // Check if command palette opened
    const isOpen = await commandPalette.isVisible().catch(() => false);
    console.log('Command palette is open after Cmd+K:', isOpen);
  });
});
