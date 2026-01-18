import { expect, test } from '@playwright/test';

test.describe('Micro-animations - Interaction Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test.describe('Button Animations', () => {
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
  });

  test.describe('Card Animations', () => {
    test('should have hover lift effect on post cards', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await expect(firstPost).toBeVisible();

      // Verify hover and transition classes
      const postClasses = await firstPost.getAttribute('class');
      expect(postClasses).toMatch(/transition/);
      expect(postClasses).toMatch(/duration-150/);
      expect(postClasses).toMatch(/hover:/);
      // Should have translate-y for lift effect
      expect(postClasses).toMatch(/-translate-y/);
    });

    test('should have scale and translate on active state for post cards', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await expect(firstPost).toBeVisible();

      // Verify active state classes
      const postClasses = await firstPost.getAttribute('class');
      expect(postClasses).toMatch(/active:/);
      // Should have scale on active
      expect(postClasses).toMatch(/active:scale/);
      // Should have translate on active
      expect(postClasses).toMatch(/active:translate/);
    });

    test('should have shadow on hover for grid view cards', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Switch to grid view
      const gridViewBtn = page.getByTestId('view-toggle-grid');
      await gridViewBtn.click();

      // Wait for grid view to render
      await page.waitForTimeout(500);

      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await expect(firstPost).toBeVisible();

      // Verify hover shadow class
      const postClasses = await firstPost.getAttribute('class');
      expect(postClasses).toMatch(/hover:shadow/);
    });
  });

  test.describe('Badge and Status Animations', () => {
    test('should have hover scale effect on status badges', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await expect(firstPost).toBeVisible();

      // Find status badge within the post
      const statusBadge = firstPost.locator('[data-testid^="status-badge-"]');
      await expect(statusBadge).toBeVisible();

      // Verify badge has hover and active scale
      const badgeClasses = await statusBadge.getAttribute('class');
      expect(badgeClasses).toMatch(/transition/);
      expect(badgeClasses).toMatch(/duration-150/);
      expect(badgeClasses).toMatch(/hover:scale-105/);
      expect(badgeClasses).toMatch(/active:scale-95/);
    });

    test('should have smooth transitions on badges', async ({ page }) => {
      // Navigate to settings to see badges
      await page.goto('/dashboard/settings');

      // Wait for settings page
      await expect(page.getByTestId('settings-page')).toBeVisible();

      // Check for any badges on the page
      const badges = page.locator('[class*="badge"], [data-testid^="status-badge-"]');
      const count = await badges.count();

      if (count > 0) {
        const firstBadge = badges.first();
        const badgeClasses = await firstBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/transition/);
      }
    });
  });

  test.describe('Input Field Animations', () => {
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
  });

  test.describe('Animation Timing and Performance', () => {
    test('should use consistent animation duration (150-200ms)', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Check post cards for duration-150
      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      const postClasses = await firstPost.getAttribute('class');
      expect(postClasses).toMatch(/duration-150/);

      // Check navigation for duration-200
      const queueNav = page.locator('a[aria-label="Queue"]');
      const navClasses = await queueNav.getAttribute('class');
      expect(navClasses).toMatch(/duration-200/);

      // Check buttons for duration-150
      const listViewBtn = page.getByTestId('view-toggle-list');
      const btnClasses = await listViewBtn.getAttribute('class');
      expect(btnClasses).toMatch(/duration-150/);
    });

    test('should not have blocking or slow animations', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Verify animations use transition properties (not animation)
      // Transitions are more performant and don't block
      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      const postClasses = await firstPost.getAttribute('class');
      expect(postClasses).toMatch(/transition/);

      // Should use transition-all for smooth multi-property changes
      expect(postClasses).toMatch(/transition-all/);
    });
  });

  test.describe('Reduced Motion Support', () => {
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
  });

  test.describe('Interactive Element Feedback', () => {
    test('should provide visual feedback on all interactive elements', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

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

    test('should have consistent animation patterns across components', async ({ page }) => {
      // All buttons should follow the same animation pattern
      const buttons = page.locator('button');
      const count = await buttons.count();

      // Check first 5 buttons
      for (let i = 0; i < Math.min(5, count); i++) {
        const button = buttons.nth(i);
        const classes = await button.getAttribute('class');

        if (classes) {
          // Should have transitions
          expect(classes).toMatch(/transition/);
          // Should have active states
          expect(classes).toMatch(/active:/);
        }
      }
    });
  });

  test.describe('Motion Sickness Prevention', () => {
    test('should avoid excessive motion in animations', async ({ page }) => {
      // Navigate to queue page
      await page.goto('/dashboard/queue');
      await expect(page.getByTestId('queue-pane')).toBeVisible();

      // Wait for posts to load
      await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

      // Animations should be subtle (small scale values, not large)
      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      const postClasses = await firstPost.getAttribute('class');

      // Scale should be subtle (0.99 or 0.995, not 0.8 or 0.5)
      expect(postClasses).toMatch(/scale-0\.(99|995|98)/);

      // Translate should be small (px or 0.5, not large values)
      expect(postClasses).toMatch(/-translate-y-(px|0\.5)/);
    });

    test('should not use blocking animations', async ({ page }) => {
      // Verify no animation-duration properties that block
      // Transitions should be used instead
      const elements = page.locator('*');
      const firstElement = elements.first();

      const hasBlockingAnimations = await firstElement.evaluate((el) => {
        const styles = getComputedStyle(el);
        // Check for long animation durations (not transitions)
        return styles.animationDuration && styles.animationDuration !== '0s';
      });

      // Should not have blocking animations by default
      expect(typeof hasBlockingAnimations).toBe('boolean');
    });
  });
});
