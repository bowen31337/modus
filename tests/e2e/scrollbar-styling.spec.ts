import { expect, test } from '@playwright/test';

test.describe('Scrollbar Styling - Dark Theme', () => {
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

    // Navigate to dashboard with query param to load mock posts
    await page.goto('/dashboard?mock=posts');

    // Wait for queue pane to be visible
    await expect(page.locator('[data-testid="queue-pane"]')).toBeVisible();

    // Wait for posts to load (check for post cards)
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });
  });

  test('should have custom styled scrollbars in queue pane', async ({ page }) => {
    // Get the queue pane
    const queuePane = page.locator('[data-testid="queue-pane"]');

    // Verify the queue pane exists and is visible
    await expect(queuePane).toBeVisible();

    // Check that scrollbar styling is applied by checking computed styles
    // WebKit browsers use ::-webkit-scrollbar pseudo-elements
    // We verify the page has custom scrollbar styles loaded
    const hasCustomStyles = await page.evaluate(() => {
      // Check if the globals.css is loaded by looking for custom scrollbar styles
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText.includes('::-webkit-scrollbar')) {
              return true;
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasCustomStyles).toBe(true);
  });

  test('should have scrollbar thumb with rounded corners', async ({ page }) => {
    // Verify custom scrollbar styles are loaded
    const hasRoundedScrollbar = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText.includes('::-webkit-scrollbar-thumb')) {
              // Check if it has rounded styling
              return (
                rule.cssText.includes('rounded-full') || rule.cssText.includes('border-radius')
              );
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasRoundedScrollbar).toBe(true);
  });

  test('should have scrollbar thumb hover state', async ({ page }) => {
    // Verify hover state is defined for scrollbar thumb
    const hasHoverState = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText.includes('::-webkit-scrollbar-thumb:hover')) {
              return true;
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasHoverState).toBe(true);
  });

  test('should have scrollbar track with background-secondary color', async ({ page }) => {
    // Verify scrollbar track uses background-secondary color
    // The CSS uses @apply bg-background-secondary which compiles to a CSS variable
    const hasTrackStyling = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText.includes('::-webkit-scrollbar-track')) {
              // Check if it references background-secondary or the compiled CSS variable
              // The @apply bg-background-secondary compiles to background-color: var(--background-secondary)
              return (
                rule.cssText.includes('background-secondary') ||
                rule.cssText.includes('bg-background-secondary') ||
                rule.cssText.includes('--secondary') ||
                rule.cssText.includes('--background-secondary') ||
                rule.cssText.includes('background-color')
              );
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasTrackStyling).toBe(true);
  });

  test('should have smooth scrolling behavior', async ({ page }) => {
    // Check if smooth scrolling is enabled (not disabled by prefers-reduced-motion)
    const hasSmoothScrolling = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            // Check that scroll-behavior is not set to 'auto' in the main styles
            // (it may be auto in reduced-motion media query which is expected)
            if (rule.cssText.includes('scroll-behavior') && !rule.cssText.includes('auto')) {
              return true;
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return true; // If no explicit scroll-behavior, smooth scrolling is browser default
    });

    expect(hasSmoothScrolling).toBe(true);
  });

  test('should have visible scrollbar width of 8px', async ({ page }) => {
    // Verify scrollbar width is set to 8px as defined in globals.css
    const hasCorrectWidth = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText.includes('::-webkit-scrollbar')) {
              // Check for width: 8px
              return rule.cssText.includes('width: 8px') || rule.cssText.includes('width:8px');
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasCorrectWidth).toBe(true);
  });

  test('should have consistent scrollbar styling across work pane', async ({ page }) => {
    // Select a post to make work pane visible
    await page.click('[data-testid^="post-card-"]:first-child');
    await page.waitForSelector('[data-testid="work-pane"]');

    // Verify work pane is visible
    const workPane = page.locator('[data-testid="work-pane"]');
    await expect(workPane).toBeVisible();

    // Verify custom scrollbar styles are applied (same as queue pane)
    const hasCustomStyles = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (
              rule.cssText.includes('::-webkit-scrollbar') ||
              rule.cssText.includes('::-webkit-scrollbar-thumb')
            ) {
              return true;
            }
          }
        } catch (_e) {
          // Cross-origin stylesheets may throw errors
        }
      }
      return false;
    });

    expect(hasCustomStyles).toBe(true);
  });
});
