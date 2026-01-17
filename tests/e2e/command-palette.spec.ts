import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
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

    // Ensure command palette is closed by pressing Escape multiple times
    // (in case it's open from a previous test)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }

    // Verify command palette is closed
    await expect(page.getByTestId('command-palette')).toBeHidden();

    // Blur any focused inputs to ensure keyboard events go to document
    await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.blur();
      }
      // Focus body to ensure keyboard events go to the document
      document.body.focus();
    });
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    // Press Cmd+K to open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Verify input is focused
    const input = page.getByTestId('command-palette-input');
    await expect(input).toBeFocused();
  });

  test('should open command palette with Ctrl+K on Windows/Linux', async ({ page }) => {
    // Press Ctrl+K to open command palette
    await page.keyboard.press('Control+k');

    // Verify command palette is visible
    await expect(page.getByTestId('command-palette')).toBeVisible();
  });

  test('should display available commands', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for commands to load
    await page.waitForSelector('[data-testid="command-palette-results"]');

    // Verify all commands are displayed
    await expect(page.getByTestId('command-go-queue')).toBeVisible();
    await expect(page.getByTestId('command-go-settings')).toBeVisible();
    await expect(page.getByTestId('command-view-profile')).toBeVisible();
    await expect(page.getByTestId('command-view-templates')).toBeVisible();
    await expect(page.getByTestId('command-logout')).toBeVisible();
  });

  test('should filter commands by search query', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Type search query
    const input = page.getByTestId('command-palette-input');
    await input.fill('settings');

    // Verify only matching commands are visible
    await expect(page.getByTestId('command-go-settings')).toBeVisible();
    await expect(page.getByTestId('command-go-queue')).not.toBeVisible();
  });

  test('should navigate commands with arrow keys', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Press arrow down to select second command
    await page.keyboard.press('ArrowDown');

    // Verify the second command is selected (has ring)
    const secondCommand = page.getByTestId('command-go-settings');

    // After ArrowDown, second command should be selected
    // Check if it has the ring-primary class
    const className = await secondCommand.getAttribute('class');
    expect(className).toMatch(/ring-1.*ring-primary/);
  });

  test('should execute command on Enter', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Type to filter for logout command
    const input = page.getByTestId('command-palette-input');
    await input.fill('logout');

    // Press Enter to execute
    await page.keyboard.press('Enter');

    // Command palette should close
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('should close command palette with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify it's open
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify it's closed
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('should close command palette when clicking outside', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify it's open
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Click on the backdrop (note: it's .absolute not .fixed)
    const backdrop = page.locator('.absolute.inset-0.bg-black\\/50');
    await backdrop.click();

    // Verify it's closed
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify keyboard shortcuts are displayed
    // The footer contains multiple elements, so we check for the text content
    const footer = page.locator('[data-testid="command-palette"]').locator('div.border-t');
    await expect(footer).toContainText('Navigate');
    await expect(footer).toContainText('Select');
    await expect(footer).toContainText('Close');
  });

  test('should show command count in footer', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify command count is shown (should show "5 commands" initially)
    await expect(page.locator('text=/\d+ command(s)?/')).toBeVisible();
  });

  test('should filter to no results and show message', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Type search that matches nothing
    const input = page.getByTestId('command-palette-input');
    await input.fill('xyz123notfound');

    // Verify no results message
    await expect(page.locator('text=No commands found')).toBeVisible();
  });
});
