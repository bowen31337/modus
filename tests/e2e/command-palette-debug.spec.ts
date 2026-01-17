import { test, expect } from '@playwright/test';

test.describe('Command Palette Debug', () => {
  test('check if useEffect marker is present', async ({ page, context }) => {
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for the keyboard listener marker to be present (it's hidden with display: none)
    await page.waitForSelector('#cmd-k-listener-attached', { state: 'attached', timeout: 10000 });

    // Check if the marker element exists (added by useEffect)
    const markerExists = await page.evaluate(() => {
      return !!document.getElementById('cmd-k-listener-attached');
    });

    console.log('Cmd+K listener marker exists:', markerExists);

    // Also check if command palette is initially hidden
    const commandPalette = page.getByTestId('command-palette');
    const initiallyVisible = await commandPalette.isVisible().catch(() => false);
    console.log('Command palette initially visible:', initiallyVisible);

    expect(markerExists).toBe(true);
  });

  test('test cmd+k with marker verification', async ({ page, context }) => {
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for the keyboard listener marker to be present (it's hidden with display: none)
    await page.waitForSelector('#cmd-k-listener-attached', { state: 'attached', timeout: 10000 });

    // Verify the marker exists (useEffect has run)
    const markerExists = await page.evaluate(() => {
      return !!document.getElementById('cmd-k-listener-attached');
    });
    console.log('Marker exists before Cmd+K:', markerExists);

    // Press Cmd+K
    await page.keyboard.press('Meta+k');

    // Wait for React state update
    await page.waitForTimeout(1000);

    // Check if command palette is visible
    const commandPalette = page.getByTestId('command-palette');
    const isVisible = await commandPalette.isVisible().catch(() => false);
    console.log('Command palette visible after Cmd+K:', isVisible);

    expect(isVisible).toBe(true);
  });
});
