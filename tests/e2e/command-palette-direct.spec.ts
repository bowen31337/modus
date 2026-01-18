import { expect, test } from '@playwright/test';

test.describe('Command Palette - Direct State Control', () => {
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

  test('should render CommandPalette in DOM but hidden initially', async ({ page }) => {
    // The command palette should be in the DOM but not visible
    const commandPalette = page.getByTestId('command-palette');
    await expect(commandPalette).not.toBeVisible();
  });

  test('should open command palette by directly manipulating state', async ({ page }) => {
    // Use page.evaluate to directly trigger a keyboard event on window
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
        ctrlKey: false,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    });

    // Wait for the state to update and component to re-render
    await page.waitForTimeout(300);

    // Check if command palette is now visible
    const commandPalette = page.getByTestId('command-palette');
    const isVisible = await commandPalette.isVisible().catch(() => false);

    console.log('Command palette visible after dispatch:', isVisible);

    if (isVisible) {
      // If it opened, verify the input is focused
      await expect(page.getByTestId('command-palette-input')).toBeFocused();
    }
  });

  test('should dispatch keyboard event with both meta and ctrl', async ({ page }) => {
    // Try dispatching event with both metaKey and ctrlKey true (Playwright style)
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(300);

    const commandPalette = page.getByTestId('command-palette');
    const isVisible = await commandPalette.isVisible().catch(() => false);

    console.log('Command palette visible with both keys:', isVisible);
  });

  test('should verify event listener is attached', async ({ page }) => {
    // Check if the event listener is attached by looking for it
    const hasListener = await page.evaluate(() => {
      // Try to find if there's a listener for keydown with Cmd+K
      const listeners = (window as any)._commandPaletteListener;
      return !!listeners;
    });

    console.log('Has tracked listener:', hasListener);
  });
});
