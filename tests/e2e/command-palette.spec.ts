import { expect, test } from '@playwright/test';

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

test.describe('Command Palette - Modal Overlay Styling', () => {
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
    await page.waitForSelector('#cmd-k-listener-attached', { state: 'attached', timeout: 10000 });

    // Blur any focused inputs to ensure keyboard events go to document
    await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.blur();
      }
      document.body.focus();
    });
  });

  test('should have backdrop overlay with correct styling', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Verify backdrop exists and has overlay styling
    const backdrop = page.getByTestId('command-palette-backdrop');
    await expect(backdrop).toBeVisible();

    // Check backdrop has correct classes for overlay
    const backdropClasses = await backdrop.getAttribute('class');
    expect(backdropClasses).toMatch(/absolute/); // Positioned within parent
    expect(backdropClasses).toMatch(/inset-0/);
    expect(backdropClasses).toMatch(/bg-black\/50/); // Semi-transparent black background
    expect(backdropClasses).toMatch(/backdrop-blur-sm/); // Blur effect
  });

  test('should be centered on screen with appropriate size', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Get the command palette modal
    const palette = page.getByTestId('command-palette');

    // Verify it has centered positioning classes
    const paletteClasses = await palette.getAttribute('class');
    expect(paletteClasses).toMatch(/relative/);
    expect(paletteClasses).toMatch(/w-full/);
    expect(paletteClasses).toMatch(/max-w-2xl/); // Maximum width

    // Check the parent container for centering
    const container = page.locator('.fixed.inset-0.z-50.flex');
    await expect(container).toBeVisible();

    const containerClasses = await container.getAttribute('class');
    expect(containerClasses).toMatch(/flex/);
    expect(containerClasses).toMatch(/items-start/);
    expect(containerClasses).toMatch(/justify-center/);

    // Verify palette has rounded corners and border
    expect(paletteClasses).toMatch(/rounded-lg/);
    expect(paletteClasses).toMatch(/border/);
    expect(paletteClasses).toMatch(/shadow-2xl/); // Deep shadow for elevation
  });

  test('should have prominent search input', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Get the search input
    const input = page.getByTestId('command-palette-input');

    // Verify input is visible
    await expect(input).toBeVisible();

    // Check input styling makes it prominent
    const inputClasses = await input.getAttribute('class');
    expect(inputClasses).toMatch(/flex-1/); // Takes available space
    expect(inputClasses).toMatch(/text-sm/); // Readable font size
    expect(inputClasses).toMatch(/outline-none/); // Custom focus styling

    // Verify input has a visible placeholder
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBe('Type a command or search...');

    // Verify the search section has a border bottom for separation
    const searchSection = input.locator('..');
    const searchSectionClasses = await searchSection.getAttribute('class');
    expect(searchSectionClasses).toMatch(/border-b/);
  });

  test('should have clear visual hierarchy in command list', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible and commands to load
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await page.waitForSelector('[data-testid="command-palette-results"]');

    // Verify command items have consistent styling
    const firstCommand = page.getByTestId('command-go-queue');
    await expect(firstCommand).toBeVisible();

    // Check command item has proper layout classes
    const commandClasses = await firstCommand.getAttribute('class');
    expect(commandClasses).toMatch(/flex/); // Flex layout for icon + text
    expect(commandClasses).toMatch(/items-center/); // Vertically centered
    expect(commandClasses).toMatch(/gap-3/); // Consistent spacing
    expect(commandClasses).toMatch(/px-3/); // Horizontal padding
    expect(commandClasses).toMatch(/py-3/); // Vertical padding
    expect(commandClasses).toMatch(/rounded-md/); // Rounded corners
    expect(commandClasses).toMatch(/transition-colors/); // Smooth color transitions

    // Verify hover styling exists
    expect(commandClasses).toMatch(/hover:bg-background-tertiary/);

    // Verify icons are present and styled
    const icon = firstCommand.locator('svg');
    await expect(icon).toBeVisible();

    const iconClasses = await icon.getAttribute('class');
    // Icon should have at least some text color class (may vary by command state)
    expect(iconClasses).toMatch(/text-/);

    // Verify command text is visible and styled
    const commandText = firstCommand.locator('span.flex-1');
    await expect(commandText).toBeVisible();

    const textClasses = await commandText.getAttribute('class');
    expect(textClasses).toMatch(/text-sm/); // Consistent font size
    expect(textClasses).toMatch(/text-foreground/); // High contrast text
  });

  test('should have elevated shadow and proper z-index', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Get the command palette modal
    const palette = page.getByTestId('command-palette');

    // Verify it has shadow-2xl for elevation
    const paletteClasses = await palette.getAttribute('class');
    expect(paletteClasses).toMatch(/shadow-2xl/);

    // Verify high z-index for modal overlay
    const container = page.locator('.fixed.inset-0.z-50');
    await expect(container).toBeVisible();

    const containerClasses = await container.getAttribute('class');
    expect(containerClasses).toMatch(/z-50/); // High z-index to appear above other content
  });

  test('should have proper modal animations', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Get the command palette modal
    const palette = page.getByTestId('command-palette');

    // Verify animation classes are present
    const paletteClasses = await palette.getAttribute('class');
    expect(paletteClasses).toMatch(/animate-in/);
    expect(paletteClasses).toMatch(/fade-in/);
    expect(paletteClasses).toMatch(/zoom-in-95/);
    expect(paletteClasses).toMatch(/duration-200/); // 200ms animation duration
  });

  test('should have appropriate modal spacing and padding', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');

    // Wait for command palette to be visible
    await expect(page.getByTestId('command-palette')).toBeVisible();

    // Get the command palette modal
    const palette = page.getByTestId('command-palette');

    // Verify modal has overflow hidden for clean edges
    const paletteClasses = await palette.getAttribute('class');
    expect(paletteClasses).toMatch(/overflow-hidden/);

    // Verify search section has proper padding
    const searchSection = palette.locator('.border-b');
    await expect(searchSection).toBeVisible();

    const searchSectionClasses = await searchSection.getAttribute('class');
    expect(searchSectionClasses).toMatch(/p-4/); // Comfortable padding

    // Verify command results section has proper padding
    const resultsSection = page.getByTestId('command-palette-results');
    await expect(resultsSection).toBeVisible();

    const resultsClasses = await resultsSection.getAttribute('class');
    expect(resultsClasses).toMatch(/p-2/); // Tighter padding for dense content
    expect(resultsClasses).toMatch(/max-h-\[60vh\]/); // Max height constraint
    expect(resultsClasses).toMatch(/overflow-y-auto/); // Scrollable when needed
  });
});
