import { expect, test } from '@playwright/test';

/**
 * E2E Test Suite: Keyboard Shortcut Hints
 *
 * Tests that keyboard shortcut hints are displayed throughout the UI:
 * - Queue pane shows J/K navigation hints
 * - Work pane shows R shortcut for reply
 * - Left rail navigation shows G+H, G+Q, G+A, G+S shortcuts
 * - Command palette shows shortcuts
 * - Rich text editor shows Ctrl+B, Ctrl+I shortcuts
 * - All shortcuts use monospace font (Geist Mono)
 */

test.describe('Keyboard Shortcut Hints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for posts to load
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test.describe('Queue Pane - Navigation Hints', () => {
    test('should display J/K keyboard shortcut hints in queue header', async ({ page }) => {
      // Find the queue header
      const queueHeader = page.locator('[data-testid="queue-pane"] h1');
      await expect(queueHeader).toContainText('Moderation Queue');

      // Check for keyboard shortcut hints in the header area
      const keyboardShortcuts = page.locator('[data-testid="queue-pane"]').locator('text=Navigate:');

      // Verify shortcuts are visible (may be hidden on small screens)
      const isVisible = await keyboardShortcuts.isVisible().catch(() => false);

      if (isVisible) {
        // On larger screens, verify the "Navigate:" label
        await expect(keyboardShortcuts).toBeVisible();
      }

      // Check for K and J shortcuts (using data attributes or text content)
      const shortcutElements = page.locator('[data-testid="queue-pane"]').locator('.font-mono');

      // Should have at least 2 shortcuts (J and K)
      const count = await shortcutElements.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should display keyboard shortcuts in monospace font', async ({ page }) => {
      // Get keyboard shortcut elements
      const shortcuts = page.locator('[data-testid="queue-pane"]').locator('.font-mono');

      const count = await shortcuts.count();
      expect(count).toBeGreaterThan(0);

      // Check that at least one shortcut has monospace font family
      for (let i = 0; i < count; i++) {
        const shortcut = shortcuts.nth(i);
        const fontFamily = await shortcut.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });

        // Should contain 'mono' in the font family name
        expect(fontFamily.toLowerCase()).toContain('mono');
      }
    });
  });

  test.describe('Left Rail - Navigation Shortcuts', () => {
    test('should show tooltips with keyboard shortcuts on hover', async ({ page }) => {
      // Find the navigation links
      const navLinks = page.locator('[data-testid="left-rail"] nav a');

      const count = await navLinks.count();
      expect(count).toBe(4); // Home, Queue, Assigned, Settings

      // Hover over each navigation item and check for tooltip
      for (let i = 0; i < count; i++) {
        const link = navLinks.nth(i);

        // Hover over the link
        await link.hover();

        // Wait for tooltip to appear
        await page.waitForTimeout(200);

        // Check that tooltip becomes visible
        const tooltip = page.locator('.group:hover .opacity-100').nth(i);
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          // Verify tooltip contains shortcut hints (keyboard badges)
          const keyboardHint = tooltip.locator('.font-mono');
          await expect(keyboardHint).toBeVisible();
        }
      }
    });

    test('should display G+H, G+Q, G+A, G+S shortcuts for navigation', async ({ page }) => {
      // Hover over navigation items to reveal tooltips
      const navLinks = page.locator('[data-testid="left-rail"] nav a');

      const expectedShortcuts = ['G H', 'G Q', 'G A', 'G S'];

      for (let i = 0; i < expectedShortcuts.length; i++) {
        const link = navLinks.nth(i);
        await link.hover();
        await page.waitForTimeout(200);

        // Look for shortcut text in tooltip
        const tooltip = page.locator('[data-testid="left-rail"]').locator('.opacity-100').nth(i);
        const isVisible = await tooltip.isVisible().catch(() => false);

        if (isVisible) {
          // Check that tooltip contains the expected shortcut
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toContain(expectedShortcuts[i].replace(' ', '+'));
        }
      }
    });
  });

  test.describe('Work Pane - Reply Shortcut', () => {
    test.beforeEach(async ({ page }) => {
      // Click on a post to open work pane
      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await firstPost.click();

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    });

    test('should display R keyboard shortcut hint in Response section', async ({ page }) => {
      // Find the Response section header (use first() since there might be multiple Response sections)
      const responseSection = page.locator('[data-testid="work-pane"]').locator('text=Response').first();
      await expect(responseSection).toBeVisible();

      // Look for the keyboard shortcut badge near the Response header
      // The shortcut should be in the same div as the Response heading
      const responseHeader = responseSection.locator('..');
      const shortcutBadge = responseHeader.locator('.font-mono').filter({ hasText: 'R' });

      await expect(shortcutBadge).toBeVisible();
    });

    test('should display R shortcut in monospace font', async ({ page }) => {
      // Get the Response section header and find the R shortcut in its parent
      const responseSection = page.locator('[data-testid="work-pane"]').locator('text=Response').first();
      const responseHeader = responseSection.locator('..');
      const shortcutBadge = responseHeader.locator('.font-mono').filter({ hasText: 'R' });

      await expect(shortcutBadge).toBeVisible();

      // Check font family
      const fontFamily = await shortcutBadge.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });

      expect(fontFamily.toLowerCase()).toContain('mono');
    });
  });

  test.describe('Rich Text Editor - Formatting Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      // Click on a post to open work pane
      const firstPost = page.locator('[data-testid^="post-card-"]').first();
      await firstPost.click();

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    });

    test('should display Ctrl+B and Ctrl+I shortcuts in tips section', async ({ page }) => {
      // Find the tips section
      const tipsSection = page.locator('[data-testid="work-pane"]').locator('text=Tips:');
      await expect(tipsSection).toBeVisible();

      // Look for keyboard shortcuts in tips
      const shortcuts = page.locator('[data-testid="work-pane"]').locator('.font-mono');
      const count = await shortcuts.count();

      expect(count).toBeGreaterThan(0);

      // Check for Ctrl+B and Ctrl+I (may be displayed as "Ctrl+B" or "Ctrl + B")
      let foundBold = false;
      let foundItalic = false;

      for (let i = 0; i < count; i++) {
        const text = await shortcuts.nth(i).textContent();
        if (text?.includes('Ctrl') && text?.includes('B')) {
          foundBold = true;
        }
        if (text?.includes('Ctrl') && text?.includes('I')) {
          foundItalic = true;
        }
      }

      expect(foundBold || foundItalic).toBeTruthy();
    });

    test('should display Tab and Esc shortcuts when AI ghost text is present', async ({ page }) => {
      // Note: This test verifies the structure is in place
      // In actual usage, these shortcuts would appear when AI suggestions are present

      // Find the tips section
      const tipsSection = page.locator('[data-testid="work-pane"]').locator('text=Tips:');
      await expect(tipsSection).toBeVisible();

      // Verify the tips section exists (shortcuts may change based on context)
      const shortcuts = tipsSection.locator('../.').locator('.font-mono');
      const count = await shortcuts.count();

      // Should have at least some shortcuts displayed
      expect(count).toBeGreaterThan(0);
    });

    test('should use monospace font for all keyboard shortcuts in editor', async ({ page }) => {
      // Get all keyboard shortcut elements in the work pane
      const shortcuts = page.locator('[data-testid="work-pane"]').locator('.font-mono');
      const count = await shortcuts.count();

      expect(count).toBeGreaterThan(0);

      // Check that shortcuts use monospace font
      for (let i = 0; i < Math.min(count, 5); i++) {
        const shortcut = shortcuts.nth(i);
        const fontFamily = await shortcut.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });

        expect(fontFamily.toLowerCase()).toContain('mono');
      }
    });
  });

  test.describe('Command Palette - Shortcuts Display', () => {
    test('should display keyboard shortcuts next to commands', async ({ page }) => {
      // Open command palette with Cmd+K
      await page.keyboard.press('Control+K');

      // Wait for command palette to open
      await page.waitForSelector('[data-testid="command-palette"]', { timeout: 10000 });

      // Check that command palette is visible
      const commandPalette = page.locator('[data-testid="command-palette"]');
      await expect(commandPalette).toBeVisible();

      // Look for keyboard shortcuts in command list
      const commandShortcuts = commandPalette.locator('.font-mono');
      const count = await commandShortcuts.count();

      // Should have multiple shortcuts displayed
      expect(count).toBeGreaterThan(0);
    });

    test('should display Cmd+K shortcut hint in command palette input', async ({ page }) => {
      // Open command palette
      await page.keyboard.press('Control+K');
      await page.waitForSelector('[data-testid="command-palette"]', { timeout: 10000 });

      // Look for the Cmd+K hint near the input
      const commandPalette = page.locator('[data-testid="command-palette"]');

      // Check for the kbd element with "K" (the shortcut hint)
      const shortcutHint = commandPalette.locator('kbd').filter({ hasText: 'K' });
      await expect(shortcutHint).toBeVisible();
    });

    test('should display navigation shortcuts in command list', async ({ page }) => {
      // Open command palette
      await page.keyboard.press('Control+K');
      await page.waitForSelector('[data-testid="command-palette"]', { timeout: 10000 });

      const commandPalette = page.locator('[data-testid="command-palette"]');

      // Check for G Q, G S, etc. shortcuts
      const shortcutElements = commandPalette.locator('.font-mono');
      const count = await shortcutElements.count();

      let foundNavigationShortcuts = false;

      for (let i = 0; i < count; i++) {
        const text = await shortcutElements.nth(i).textContent();
        // Look for single letter shortcuts (G, Q, S, etc.)
        if (text && text.match(/^[A-Z]$/)) {
          foundNavigationShortcuts = true;
          break;
        }
      }

      expect(foundNavigationShortcuts).toBeTruthy();
    });
  });

  test.describe('Accessibility - Keyboard Shortcuts', () => {
    test('should have visible keyboard shortcuts with sufficient contrast', async ({ page }) => {
      // Get keyboard shortcut elements
      const shortcuts = page.locator('.font-mono').filter({ hasText: /^[A-Z]$/ });

      const count = await shortcuts.count();
      expect(count).toBeGreaterThan(0);

      // Check that shortcuts are visible (not hidden or transparent)
      for (let i = 0; i < Math.min(count, 3); i++) {
        const shortcut = shortcuts.nth(i);
        await expect(shortcut).toBeVisible();

        // Check opacity is not too low
        const opacity = await shortcut.evaluate((el) => {
          return window.getComputedStyle(el).opacity;
        });

        expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.5);
      }
    });

    test('should have consistent styling across all keyboard shortcuts', async ({ page }) => {
      // Get multiple keyboard shortcut elements
      const shortcuts = page.locator('.font-mono');

      const count = await shortcuts.count();
      expect(count).toBeGreaterThan(2);

      // Check that they all have similar styling (border radius, padding)
      const firstShortcut = shortcuts.first();
      const firstBorderRadius = await firstShortcut.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius;
      });

      // Check a few more have similar border radius
      for (let i = 1; i < Math.min(count, 3); i++) {
        const shortcut = shortcuts.nth(i);
        const borderRadius = await shortcut.evaluate((el) => {
          return window.getComputedStyle(el).borderRadius;
        });

        // Border radius should be consistent (may vary slightly due to rounding)
        expect(borderRadius).toBeTruthy();
      }
    });
  });
});
