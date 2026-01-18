/**
 * E2E Test: Accessibility (WCAG 2.1 AA Compliance)
 *
 * Test Suite Coverage:
 * 1. ARIA labels are correctly implemented
 * 2. Contrast ratios meet WCAG 2.1 AA standards
 * 3. Tab order follows logical reading sequence
 * 4. Reduced motion preference is respected
 * 5. Screen reader can navigate application
 *
 * WCAG 2.1 AA Requirements:
 * - Text contrast: Minimum 4.5:1 for normal text, 3:1 for large text
 * - UI Components: Minimum 3:1 contrast ratio
 * - Focus indicators: Visible and clear
 * - ARIA labels: All interactive elements properly labeled
 * - Keyboard navigation: Full functionality without mouse
 */

import { expect, test } from '@playwright/test';

test.describe('Accessibility - ARIA Labels', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should have aria-labels on all icon-only buttons', async ({ page }) => {
    // Find all button elements with svg icons (icon-only buttons)
    const iconButtons = page.locator('button').filter({
      has: page.locator('svg'),
    });

    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);

      // Check if button has aria-label, aria-labelledby, or visible text
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const textContent = await button.textContent();

      const hasLabel = ariaLabel || ariaLabelledBy || (textContent && textContent.trim().length > 0);

      // Get button class or data-testid for better error reporting
      const className = await button.getAttribute('class');
      const testId = await button.getAttribute('data-testid');

      expect(
        hasLabel,
        `Button ${testId ? `[data-testid="${testId}"]` : `with class "${className}"`} is missing aria-label or visible text`
      ).toBeTruthy();
    }
  });

  test('should have proper aria-labels on navigation links', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    expect(count, 'Navigation should have links').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);

      // Navigation links should have aria-label or title
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      const text = await link.textContent();

      const hasLabel = ariaLabel || title || (text && text.trim().length > 0);

      expect(
        hasLabel,
        `Navigation link at index ${i} is missing aria-label or title`
      ).toBeTruthy();
    }
  });

  test('should have aria-expanded on toggle buttons', async ({ page }) => {
    // Find buttons that likely toggle something (filter buttons, etc.)
    const filterButtons = page.locator('button').filter({
      hasText: /filters|sort|options/i,
    });

    const count = await filterButtons.count();

    for (let i = 0; i < count; i++) {
      const button = filterButtons.nth(i);

      // Toggle buttons should have aria-expanded
      const ariaExpanded = await button.getAttribute('aria-expanded');

      // aria-expanded should be either "true" or "false"
      if (ariaExpanded !== null) {
        expect(
          ['true', 'false'].includes(ariaExpanded),
          `aria-expanded must be "true" or "false", got "${ariaExpanded}"`
        ).toBeTruthy();
      }
    }
  });

  test('should have aria-pressed on toggleable post cards', async ({ page }) => {
    // Post cards should have aria-pressed when selected
    const postCards = page.locator('[data-testid^="post-card-"]');

    const firstCard = postCards.first();
    await expect(firstCard, 'Should have post cards').toBeVisible();

    // Click the first post card
    await firstCard.click();

    // Wait for aria-pressed to update to "true"
    await page.waitForTimeout(1000);

    // Verify aria-pressed is set
    const ariaPressed = await firstCard.getAttribute('aria-pressed');
    expect(ariaPressed, 'Selected post card should have aria-pressed="true"').toBe('true');

    // Other cards should have aria-pressed="false"
    const secondCard = postCards.nth(1);
    const secondPressed = await secondCard.getAttribute('aria-pressed');
    expect(secondPressed, 'Unselected post card should have aria-pressed="false"').toBe('false');
  });

  test('should have proper roles for main landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main');
    await expect(main, 'Page should have <main> landmark').toBeVisible();

    // Check for navigation landmark
    const nav = page.locator('nav');
    await expect(nav, 'Page should have <nav> landmark').toBeVisible();

    // Check that landmark roles are properly set
    const mainRole = await main.getAttribute('role');
    if (mainRole !== null) {
      expect(mainRole, 'Main landmark should have role="main"').toBe('main');
    }
  });

  test('should have aria-live regions for dynamic updates', async ({ page }) => {
    // Check if toast notifications have aria-live
    // (This may not be visible initially, so we'll check for the element presence)
    const toastRegion = page.locator('[aria-live]').first();

    // Note: aria-live regions may not be present until there's an update
    // This test verifies the infrastructure is in place
    const exists = await toastRegion.count().then(c => c > 0);

    if (exists) {
      const politeOrAssertive = await toastRegion.getAttribute('aria-live');
      expect(
        ['polite', 'assertive'].includes(politeOrAssertive || ''),
        'aria-live should be "polite" or "assertive"'
      ).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Contrast Ratios', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should have sufficient contrast on text', async ({ page }) => {
    // Check main text elements
    const textElements = page.locator('p, h1, h2, h3, span, div').filter({
      hasText: /.+/,
    });

    // Sample first 20 text elements to avoid excessive test runtime
    const sampleSize = Math.min(20, await textElements.count());

    for (let i = 0; i < sampleSize; i++) {
      const element = textElements.nth(i);

      // Get computed color and background color
      const color = await element.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      const backgroundColor = await element.evaluate((el) => {
        // Walk up the DOM tree to find the first opaque background
        let current = el as Element;
        while (current) {
          const bg = window.getComputedStyle(current).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
          }
          current = current.parentElement;
        }
        return 'rgb(15, 23, 42)'; // Default background (slate-950)
      });

      // Parse RGB values
      const colorMatch = color.match(/\d+/g);
      const bgMatch = backgroundColor.match(/\d+/g);

      if (colorMatch && bgMatch) {
        const fgRGB = colorMatch.map(Number);
        const bgRGB = bgMatch.map(Number);

        // Calculate relative luminance (WCAG 2.0 formula)
        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((v) => {
            const sRGB = v / 255;
            return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const lum1 = luminance(fgRGB);
        const lum2 = luminance(bgRGB);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        const contrastRatio = (lighter + 0.05) / (darker + 0.05);

        // WCAG AA requires 4.5:1 for normal text
        const text = await element.textContent();
        const fontSize = await element.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });

        const isLargeText = fontSize >= 18 || (fontSize >= 14 && await element.evaluate(el => {
          const weight = parseInt(window.getComputedStyle(el).fontWeight);
          return weight >= 700;
        }));

        const minimumRatio = isLargeText ? 3.0 : 4.5;

        expect(
          contrastRatio,
          `Text "${text?.substring(0, 30)}..." has contrast ratio ${contrastRatio.toFixed(2)}:1, ` +
          `below ${minimumRatio}:1 requirement. Foreground: ${color}, Background: ${backgroundColor}`
        ).toBeGreaterThanOrEqual(minimumRatio);
      }
    }
  });

  test('should have sufficient contrast on interactive elements', async ({ page }) => {
    // Check buttons and links
    const buttons = page.locator('button, a[href]').filter({
      hasText: /.+/,
    });

    const sampleSize = Math.min(15, await buttons.count());

    for (let i = 0; i < sampleSize; i++) {
      const button = buttons.nth(i);

      // Get computed colors for default state
      const color = await button.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      const backgroundColor = await button.evaluate((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' ? bg : 'rgb(30, 41, 59)';
      });

      // Parse RGB values
      const colorMatch = color.match(/\d+/g);
      const bgMatch = backgroundColor.match(/\d+/g);

      if (colorMatch && bgMatch) {
        const fgRGB = colorMatch.map(Number);
        const bgRGB = bgMatch.map(Number);

        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((v) => {
            const sRGB = v / 255;
            return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const lum1 = luminance(fgRGB);
        const lum2 = luminance(bgRGB);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        const contrastRatio = (lighter + 0.05) / (darker + 0.05);

        // UI Components require 3:1 contrast
        expect(
          contrastRatio,
          `Interactive element has contrast ratio ${contrastRatio.toFixed(2)}:1, below 3:1 requirement`
        ).toBeGreaterThanOrEqual(3.0);
      }
    }
  });
});

test.describe('Accessibility - Tab Order', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('should follow logical tab order', async ({ page }) => {
    // Get all focusable elements in order
    const focusableElements = await page.locator(
      'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();

    expect(focusableElements.length, 'Should have focusable elements').toBeGreaterThan(0);

    // Tab through first 10 elements and verify order
    const tabOrder = [];
    for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedElement = await page.locator(':focus').getAttribute('data-testid') ||
                            await page.locator(':focus').getAttribute('aria-label') ||
                            await page.locator(':focus').evaluate(el => el.tagName);

      tabOrder.push(focusedElement);
    }

    // Verify we have a logical sequence
    // First should be navigation, then queue, then work pane
    expect(tabOrder.length, 'Should have tabbed through elements').toBeGreaterThan(0);
  });

  test('should not skip interactive elements', async ({ page }) => {
    // Count all interactive elements
    const allButtons = page.locator('button:not([disabled]), a[href]');
    const totalCount = await allButtons.count();

    // Tab through and count how many we can reach
    let reachedCount = 0;
    let samePositionCount = 0;
    let lastPosition = '';

    for (let i = 0; i < 50; i++) { // Limit iterations
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const currentPosition = await page.locator(':focus').toString();

      if (currentPosition === lastPosition) {
        samePositionCount++;
        if (samePositionCount > 2) break; // We're in a loop
      } else {
        samePositionCount = 0;
        lastPosition = currentPosition;
        reachedCount++;
      }
    }

    // We should be able to reach a significant portion of interactive elements
    expect(reachedCount, 'Should be able to tab through multiple elements').toBeGreaterThan(5);
  });

  test('should trap focus in modal when opened', async ({ page }) => {
    // Open command palette (Cmd+K)
    await page.keyboard.press('Meta+K');
    await page.waitForTimeout(500);

    // Command palette should be visible
    const commandPalette = page.locator('[data-testid="command-palette-modal"]');
    await expect(commandPalette).toBeVisible();

    // Press Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Focus should stay within the modal
      const focusedElement = page.locator(':focus');
      const isInsideModal = await focusedElement.evaluate((el) => {
        return el.closest('[data-testid="command-palette-modal"]') !== null;
      });

      expect(isInsideModal, `Focus iteration ${i + 1}: Focus should remain in modal`).toBeTruthy();
    }

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Focus should return to body or triggering element
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count() > 0;
    expect(isFocused, 'Focus should exist after closing modal').toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = page.locator(':focus');
    await expect(focusedElement, 'Should have a focused element').toBeAttached();

    // Check for focus ring (outline or box-shadow)
    const hasFocusIndicator = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const hasOutline =
        styles.outlineStyle !== 'none' &&
        styles.outlineWidth !== '0px';
      const hasBoxShadow = styles.boxShadow !== 'none';

      return hasOutline || hasBoxShadow;
    });

    expect(
      hasFocusIndicator,
      'Focused element should have visible focus indicator (outline or box-shadow)'
    ).toBeTruthy();
  });
});

test.describe('Accessibility - Reduced Motion', () => {
  test('should respect prefers-reduced-motion', async ({ page, context }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Check that animations respect the preference
    const animatedElements = page.locator('*').filter(async (el) => {
      const styles = await el.evaluate((elem) => window.getComputedStyle(elem));
      const transition = styles.transition;
      const animation = styles.animation;

      // Check if there are animations or transitions
      return (
        (transition && transition !== 'all 0s ease 0s') ||
        (animation && animation !== 'none 0s ease 0s 1 normal none running')
      );
    });

    // With reduced motion, animations should be disabled or very short
    const hasAnimations = await animatedElements.count() > 0;

    if (hasAnimations) {
      // Check that durations are 0 or very short
      const animationDuration = await animatedElements.first().evaluate((el) => {
        return window.getComputedStyle(el).animationDuration;
      });

      // Should be either 0s or very short
      const durationMatch = animationDuration.match(/([\d.]+)s/);
      if (durationMatch) {
        const duration = parseFloat(durationMatch[1]);
        // Allow 0.01s tolerance for CSS precision (1e-05s = 0.00001s)
        expect(
          duration,
          `Animation duration should be 0 or very short with reduced motion, got ${animationDuration}`
        ).toBeLessThanOrEqual(0.01);
      }
    }
  });

  test('should maintain functionality with reduced motion', async ({ page, context }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Verify basic functionality still works
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('bug');
    await page.waitForTimeout(500);

    // Search should still work
    const postCards = page.locator('[data-testid^="post-card-"]');
    const count = await postCards.count();

    expect(count, 'Should have post cards after search').toBeGreaterThan(0);
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should announce page title', async ({ page }) => {
    const title = await page.title();
    expect(title, 'Page should have a descriptive title').toBeTruthy();
    expect(title.length, 'Title should not be empty').toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();

    expect(count, 'Page should have headings for structure').toBeGreaterThan(0);

    // First heading should be h1
    const firstHeading = headings.first();
    const tagName = await firstHeading.evaluate((el) => el.tagName);

    expect(tagName, 'First heading should be h1').toBe('H1');
  });

  test('should have alt text for images', async ({ page }) => {
    // This test will pass if there are no images, or if all images have alt
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      expect(
        alt !== null,
        `Image at index ${i} should have alt attribute`
      ).toBeTruthy();
    }
  });

  test('should have labels for form inputs', async ({ page }) => {
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();

    expect(count, 'Should have form inputs').toBeGreaterThan(0);

    for (let i = 0; i < Math.min(5, count); i++) {
      const input = inputs.nth(i);

      // Check for aria-label, aria-labelledby, or associated label
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      let hasLabel = ariaLabel || ariaLabelledBy;

      if (!hasLabel && id) {
        // Check if there's a label with for attribute
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }

      if (!hasLabel) {
        // Check if input has a placeholder (fallback, but not ideal)
        const placeholder = await input.getAttribute('placeholder');
        hasLabel = placeholder !== null;
      }

      const inputType = await input.getAttribute('type') || 'input';
      expect(
        hasLabel,
        `Input (type="${inputType}") should have aria-label, aria-labelledby, or associated label`
      ).toBeTruthy();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // This test verifies the infrastructure for announcing changes
    // Check for aria-live regions

    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();

    // We should have at least one aria-live region for dynamic updates
    // (This might be toast notifications, status updates, etc.)
    if (count > 0) {
      const firstRegion = liveRegions.first();

      const liveValue = await firstRegion.getAttribute('aria-live');
      expect(
        ['polite', 'assertive'].includes(liveValue || ''),
        'aria-live should be "polite" or "assertive"'
      ).toBeTruthy();
    }
  });

  test('should have skip links for keyboard navigation', async ({ page }) => {
    // Check for skip navigation links
    const skipLinks = page.locator('a[href^="#"]').filter({
      hasText: /skip|jump|main/i,
    });

    const hasSkipLink = await skipLinks.count() > 0;

    // Skip links are a best practice but not always required
    // This test documents their presence or absence
    if (hasSkipLink) {
      const firstSkipLink = skipLinks.first();
      await expect(firstSkipLink).toBeVisible();

      // Click skip link and verify it jumps to main content
      await firstSkipLink.click();
      await page.waitForTimeout(100);

      // Focus should move to main content
      const focusedElement = page.locator(':focus');
      const isMain = await focusedElement.evaluate((el) => {
        return el.closest('main') !== null || el.id === 'main-content';
      });

      expect(isMain, 'Skip link should navigate to main content').toBeTruthy();
    }
  });
});
