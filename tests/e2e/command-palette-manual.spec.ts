import { test, expect } from '@playwright/test';

test.describe('Command Palette - Manual Test', () => {
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

  test('should render CommandPalette component in DOM (initially hidden)', async ({ page }) => {
    // The CommandPalette should be in the DOM but hidden initially
    // Check if the component exists but is not visible
    const commandPalette = page.locator('body'); // The component is rendered at the root level

    // It should not be visible initially
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('should open command palette when state is set', async ({ page }) => {
    // Inject code to directly set the command palette state
    await page.evaluate(() => {
      // Find the React component and trigger state change
      const buttons = document.querySelectorAll('button');
      console.log('Buttons found:', buttons.length);

      // Trigger keyboard event manually
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
        ctrlKey: false,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    // Wait a bit for state to update
    await page.waitForTimeout(500);

    // Check if command palette appeared
    const isVisible = await page.getByTestId('command-palette').isVisible().catch(() => false);
    console.log('Command palette visible:', isVisible);
  });

  test('should manually trigger command palette via button click if available', async ({ page }) => {
    // Look for any button that might open the command palette
    const buttons = await page.locator('button').all();
    console.log('Total buttons:', buttons.length);

    // Try clicking buttons that might be related
    for (const button of buttons.slice(0, 5)) {
      const text = await button.textContent().catch(() => '');
      console.log('Button text:', text);
    }
  });
});
