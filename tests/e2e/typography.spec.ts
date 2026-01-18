import { test, expect } from '@playwright/test';

test.describe('Typography - Fonts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (demo mode allows access without auth)
    await page.goto('/dashboard');
    // Wait for the keyboard handler to be attached (indicates page is fully loaded)
    await page.waitForFunction(() => {
      return !!document.getElementById('keyboard-handler-attached');
    }, { timeout: 10000 });
  });

  test('should use Inter font for primary text', async ({ page }) => {
    // Get the body element and check its font family
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
      };
    });

    // Verify Inter font is applied (may be part of a font stack)
    expect(computedStyle.fontFamily.toLowerCase()).toContain('inter');
  });

  test('should use Geist Mono for monospace elements', async ({ page }) => {
    // Find priority badges which should use monospace font
    const priorityBadges = page.locator('span[class*="font-mono"], .font-mono');

    // Wait for posts to load
    const firstPostCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostCard).toBeVisible();

    // Check at least one priority badge exists
    const badgeCount = await priorityBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Verify monospace font is applied
    const computedStyle = await priorityBadges.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
      };
    });

    // Should contain monospace font (Geist Mono or system fallback)
    expect(computedStyle.fontFamily.toLowerCase()).toMatch(/geist.*mono|monospace|ui-monospace/);
  });

  test('should use 12px for body text (excerpt)', async ({ page }) => {
    // Find post excerpt text (body content) - using text-xs which is 12px
    const excerpt = page.locator('p.text-xs').first();

    // Wait for posts to load
    const firstPostCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostCard).toBeVisible();
    await expect(excerpt).toBeVisible();

    // Verify font size is 12px (text-xs = 0.75rem = 12px in Tailwind)
    const computedStyle = await excerpt.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontSize: style.fontSize,
      };
    });

    // text-xs in Tailwind is 0.75rem which is 12px
    expect(computedStyle.fontSize).toBe('12px');
  });

  test('should use 10px for metadata and tags', async ({ page }) => {
    // Wait for posts to load
    const firstPostCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostCard).toBeVisible();

    // Find metadata elements (priority badges use text-[10px])
    // Use CSS escaping for the class name with brackets
    const metadata = page.locator('span[class*="text-[10px]"]').first();
    await expect(metadata).toBeVisible();

    // Verify font size
    const computedStyle = await metadata.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontSize: style.fontSize,
      };
    });

    // text-[10px] should be 10px
    expect(computedStyle.fontSize).toBe('10px');
  });

  test('should use 18px for H1 headers', async ({ page }) => {
    // Find H1 headers
    const h1 = page.locator('h1').first();

    // Wait for page to load
    await expect(page.locator('body')).toBeVisible();

    // Check if H1 exists on the page
    const h1Count = await h1.count();
    if (h1Count > 0) {
      const computedStyle = await h1.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          fontSize: style.fontSize,
        };
      });

      // text-lg in Tailwind is 1.125rem = 18px
      expect(computedStyle.fontSize).toBe('18px');
    }
  });

  test('should use 18px for H2 headers', async ({ page }) => {
    // Find H2 headers (like "Moderation Queue" header)
    const h2 = page.locator('h2').first();

    // Wait for page to load
    await expect(page.locator('body')).toBeVisible();

    // Check if H2 exists on the page
    const h2Count = await h2.count();
    if (h2Count > 0) {
      await expect(h2).toBeVisible();

      const computedStyle = await h2.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          fontSize: style.fontSize,
        };
      });

      // text-lg in Tailwind is 1.125rem = 18px (used for H2 in queue pane)
      expect(computedStyle.fontSize).toBe('18px');
    }
  });

  test('should use appropriate line height for post content', async ({ page }) => {
    // Find post title or excerpt
    const title = page.locator('h3.text-sm').first();

    // Wait for posts to load
    const firstPostCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostCard).toBeVisible();
    await expect(title).toBeVisible();

    const computedStyle = await title.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = style.lineHeight;
      return {
        fontSize,
        lineHeight,
      };
    });

    // leading-tight in Tailwind is 1.25 (125% of font size)
    // For 14px text (text-sm), line height should be around 17.5px (14 * 1.25)
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const fontSize = computedStyle.fontSize;
    const lineHeightRatio = lineHeight / fontSize;

    // Line height ratio should be close to 1.25 (leading-tight)
    expect(lineHeightRatio).toBeGreaterThan(1.1);
    expect(lineHeightRatio).toBeLessThan(1.6);
  });

  test('should follow 4px/8px spacing grid system', async ({ page }) => {
    // Find a component with padding
    const postCard = page.locator('[data-testid^="post-card-"]').first();

    // Wait for posts to load
    await expect(postCard).toBeVisible();

    const computedStyle = await postCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
      };
    });

    // Check that padding values are multiples of 4px (or 8px)
    const paddingValues = [
      parseInt(computedStyle.paddingTop),
      parseInt(computedStyle.paddingRight),
      parseInt(computedStyle.paddingBottom),
      parseInt(computedStyle.paddingLeft),
    ];

    for (const value of paddingValues) {
      if (value > 0) {
        // Should be a multiple of 4px
        expect(value % 4).toBe(0);
      }
    }
  });
});
