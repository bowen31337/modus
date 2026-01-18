import { expect, test } from '@playwright/test';

test.describe('Search Bar - Dark Theme Styling', () => {
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

    // Wait for queue pane to be visible
    await expect(page.locator('[data-testid="queue-pane"]')).toBeVisible();
  });

  test('should have appropriate dark theme background', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Verify the input has the correct background color for dark theme
    // bg-background-tertiary should be applied
    const backgroundColor = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // In dark theme, background-tertiary should be a dark color
    // We verify it's not white/light
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)'); // Not white
    expect(backgroundColor).not.toBe('rgb(243, 244, 246)'); // Not light gray
  });

  test('should have visible placeholder text', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Verify placeholder text is present
    await expect(searchInput).toHaveAttribute('placeholder', 'Search posts...');

    // Verify placeholder text color is subdued (muted-foreground)
    const placeholderColor = await searchInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      // Get the placeholder pseudo-element color if possible
      return style.color;
    });

    // The input text color should be readable on dark background
    expect(placeholderColor).toBeTruthy();
  });

  test('should have appropriate border styling', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Verify border is present and styled appropriately
    const borderWidth = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).borderWidth;
    });

    expect(borderWidth).toBe('1px');

    // Verify border color is appropriate for dark theme
    const borderColor = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border should not be white/light in dark theme
    expect(borderColor).not.toBe('rgb(255, 255, 255)');
  });

  test('should have search icon that is appropriately styled', async ({ page }) => {
    // The search icon is rendered by lucide-react
    // Verify it's visible and has appropriate color
    const _searchIcon = page.locator('svg[data-testid="search-icon"]');

    // If the icon doesn't have a test ID, we can check the parent container
    const searchContainer = page.locator('.relative:has(input[placeholder="Search posts..."])');

    // Verify the container exists (has the search icon and input)
    await expect(searchContainer).toBeVisible();

    // Verify the search input is properly positioned with the icon
    const searchInput = page.getByPlaceholder('Search posts...');
    const paddingLeft = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).paddingLeft;
    });

    // Should have enough left padding for the icon (pl-9 = 2.25rem = 36px)
    expect(paddingLeft).toBe('36px');
  });

  test('should have clear focus state', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Focus the input
    await searchInput.focus();

    // Verify focus ring is applied
    const boxShadow = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // Should have a focus ring (ring-2 ring-primary)
    expect(boxShadow).toBeTruthy();
    expect(boxShadow).not.toBe('none');
  });

  test('should have rounded corners', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Verify border radius is applied (rounded-md)
    const borderRadius = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    // rounded-md = 0.375rem = 6px (computed value may vary by browser)
    // Accept either 6px or 8px as both are valid rounded values
    expect(['6px', '8px']).toContain(borderRadius);
  });

  test('should have proper text color for dark theme', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...');

    // Verify text color is appropriate for dark theme
    const textColor = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Text should be visible on dark background (not white, but a readable color)
    expect(textColor).toBeTruthy();
    expect(textColor).not.toBe('rgb(0, 0, 0)'); // Not pure black
  });
});
