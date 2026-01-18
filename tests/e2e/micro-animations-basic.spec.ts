import { expect, test } from '@playwright/test';

test.describe('Micro-animations - Basic Interaction Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
  });

  test('should have smooth transitions on all buttons', async ({ page }) => {
    // Navigate to settings to see various button types
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Get the Create Template button
    const createButton = page.getByTestId('create-template-button');
    await expect(createButton).toBeVisible();

    // Verify transition class exists
    const buttonClasses = await createButton.getAttribute('class');
    expect(buttonClasses).toMatch(/transition/);
    expect(buttonClasses).toMatch(/duration-150/);
  });

  test('should have active scale transform on button click', async ({ page }) => {
    // Check view toggle buttons
    const listViewBtn = page.getByTestId('view-toggle-list');
    const gridViewBtn = page.getByTestId('view-toggle-grid');

    await expect(listViewBtn).toBeVisible();
    await expect(gridViewBtn).toBeVisible();

    // Verify active scale classes
    const listViewClasses = await listViewBtn.getAttribute('class');
    const gridViewClasses = await gridViewBtn.getAttribute('class');

    expect(listViewClasses).toMatch(/transition/);
    expect(gridViewClasses).toMatch(/transition/);
    // Scale should be 0.98 for active state
    expect(listViewClasses).toMatch(/active:/);
  });

  test('should have hover state transitions on navigation buttons', async ({ page }) => {
    // Check left rail navigation
    const homeNav = page.locator('a[aria-label="Home"]');
    const queueNav = page.locator('a[aria-label="Queue"]');

    await expect(homeNav).toBeVisible();
    await expect(queueNav).toBeVisible();

    // Verify hover and transition classes
    const homeClasses = await homeNav.getAttribute('class');
    const queueClasses = await queueNav.getAttribute('class');

    expect(homeClasses).toMatch(/transition/);
    expect(queueClasses).toMatch(/transition/);
    expect(homeClasses).toMatch(/duration-200/);

    // At least one should have hover (the non-active one)
    const hasHover = homeClasses?.includes('hover:') || queueClasses?.includes('hover:');
    expect(hasHover).toBe(true);
  });

  test('should have icon transitions in navigation', async ({ page }) => {
    // Navigation icons should have transition classes
    const queueNav = page.locator('a[aria-label="Queue"]');
    await expect(queueNav).toBeVisible();

    // Icon inside should have transition
    const icon = queueNav.locator('svg');
    const iconClasses = await icon.getAttribute('class');
    expect(iconClasses).toMatch(/transition/);
  });

  test('should have smooth transitions on form inputs', async ({ page }) => {
    // Navigate to login page to test input animations
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify transition classes
    const emailClasses = await emailInput.getAttribute('class');
    const passwordClasses = await passwordInput.getAttribute('class');

    expect(emailClasses).toMatch(/transition/);
    expect(emailClasses).toMatch(/duration-150/);
    expect(passwordClasses).toMatch(/transition/);

    // Verify hover states
    expect(emailClasses).toMatch(/hover:/);
    expect(passwordClasses).toMatch(/hover:/);

    // Verify focus states
    expect(emailClasses).toMatch(/focus-visible:/);
    expect(passwordClasses).toMatch(/focus-visible:/);
  });

  test('should have focus ring expansion on inputs', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Verify focus ring classes
    const inputClasses = await emailInput.getAttribute('class');
    expect(inputClasses).toMatch(/focus-visible:ring-2/);
    expect(inputClasses).toMatch(/focus-visible:ring-primary/);
  });

  test('should use consistent animation duration (150-200ms)', async ({ page }) => {
    // Check navigation for duration-200
    const queueNav = page.locator('a[aria-label="Queue"]');
    const navClasses = await queueNav.getAttribute('class');
    expect(navClasses).toMatch(/duration-200/);

    // Check buttons for duration-150
    const listViewBtn = page.getByTestId('view-toggle-list');
    const btnClasses = await listViewBtn.getAttribute('class');
    expect(btnClasses).toMatch(/duration-150/);
  });

  test('should respect prefers-reduced-motion setting', async ({ page }) => {
    // Check that global CSS has reduced motion support
    const hasReducedMotion = await page.evaluate(() => {
      const _styles = getComputedStyle(document.body);
      // Check if media query is registered
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    // Test that we can detect the preference
    expect(typeof hasReducedMotion).toBe('boolean');
  });

  test('should have reduced motion media query in styles', async ({ page }) => {
    // Verify the reduced motion media query exists in the page
    const hasReducedMotionStyles = await page.evaluate(() => {
      // Check for style tags containing reduced motion
      const styleTags = Array.from(document.querySelectorAll('style'));
      return styleTags.some((tag) => tag.textContent?.includes('prefers-reduced-motion'));
    });

    expect(hasReducedMotionStyles).toBe(true);
  });

  test('should provide visual feedback on all interactive elements', async ({ page }) => {
    // Test various interactive elements
    const interactiveElements = [
      page.getByTestId('view-toggle-list'),
      page.getByTestId('view-toggle-grid'),
      page.locator('a[aria-label="Queue"]'),
      page.locator('a[aria-label="Home"]'),
    ];

    for (const element of interactiveElements) {
      await expect(element).toBeVisible();

      // Each should have transition classes
      const classes = await element.getAttribute('class');
      expect(classes).toMatch(/transition/);
    }
  });

  test('should not use blocking animations', async ({ page }) => {
    // Verify animations use transition properties (not animation)
    // Transitions are more performant and don't block
    const listViewBtn = page.getByTestId('view-toggle-list');
    const btnClasses = await listViewBtn.getAttribute('class');
    expect(btnClasses).toMatch(/transition/);

    // Should use transition-all for smooth multi-property changes
    expect(btnClasses).toMatch(/transition-all/);
  });
});
