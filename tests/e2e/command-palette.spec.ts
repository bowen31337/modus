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

    // Navigate to dashboard (fresh page for each test)
    await page.goto('/dashboard');

    // Wait for the page to load and keyboard listener to be attached
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for the keyboard listener marker to be present (element exists, even if hidden)
    await page.waitForSelector('#cmd-k-listener-attached', { state: 'attached', timeout: 10000 });

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

    // Wait for input to be focused
    await expect(page.getByTestId('command-palette-input')).toBeFocused();

    // Wait a bit for React to initialize
    await page.waitForTimeout(200);

    // Debug: check the selected index state BEFORE pressing ArrowDown
    const beforeState = await page.evaluate(() => {
      const commands = document.querySelectorAll('[data-testid^="command-"]');
      return Array.from(commands).map((el) => ({
        testId: el.getAttribute('data-testid'),
        class: el.getAttribute('class'),
      }));
    });
    console.log('Commands BEFORE ArrowDown:', JSON.stringify(beforeState, null, 2));

    // Press arrow down to select second command
    await page.keyboard.press('ArrowDown');

    // Wait for React to update
    await page.waitForTimeout(200);

    // Debug: check the selected index state AFTER pressing ArrowDown
    const selectedIndex = await page.evaluate(() => {
      // Check if we can find the selected element by its class
      const commands = document.querySelectorAll('[data-testid^="command-"]');
      return Array.from(commands).map((el) => ({
        testId: el.getAttribute('data-testid'),
        class: el.getAttribute('class'),
      }));
    });
    console.log('Commands after ArrowDown:', JSON.stringify(selectedIndex, null, 2));

    // Verify the second command is selected (has ring)
    const secondCommand = page.getByTestId('command-go-settings');
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

    // Command palette should close - wait for the hidden element
    await expect(page.getByTestId('command-palette')).toHaveClass(/hidden/);
  });

  test('should close command palette with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify it's open
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify it's closed - wait for the hidden element
    await expect(page.getByTestId('command-palette')).toHaveClass(/hidden/);
  });

  test('should close command palette when clicking outside', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Verify it's open
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Click on the backdrop at the top of the screen (outside the modal)
    // The modal is centered with pt-[15vh], so clicking at the top should work
    const backdrop = page.getByTestId('command-palette-backdrop');
    await backdrop.click({ position: { x: 10, y: 10 } });

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
    await expect(page.locator('text=/\\d+ command(s)?/')).toBeVisible();
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
