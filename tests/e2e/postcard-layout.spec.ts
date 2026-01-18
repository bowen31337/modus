/**
 * E2E Test: PostCard High-Density Layout
 *
 * Test Steps:
 * 1. View PostCard in queue
 * 2. Verify vertical space is optimized (minimal padding)
 * 3. Verify essential info visible without scrolling
 * 4. Verify truncation is applied to long titles/excerpts
 * 5. Verify information hierarchy is clear
 */

import { expect, test } from '@playwright/test';

test.describe('PostCard High-Density Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate by logging in
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    // Wait for page to load
    await expect(page.locator('h2:has-text("Moderation Queue")')).toBeVisible();
  });

  test('should display PostCard with optimized vertical spacing', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify the post card has minimal padding (high-density)
    const cardPadding = await postCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
      };
    });

    // Padding should be small (12px or less for high-density)
    const paddingVertical =
      Number.parseFloat(cardPadding.paddingTop) + Number.parseFloat(cardPadding.paddingBottom);
    expect(paddingVertical).toBeLessThanOrEqual(24); // 12px top + 12px bottom max
  });

  test('should display essential info without scrolling within card', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify all essential elements are visible
    await expect(postCard.locator('h3')).toBeVisible(); // Title
    await expect(postCard.locator('p').first()).toBeVisible(); // Excerpt

    // Verify metadata elements (priority, sentiment, category, etc.)
    const metadataContainer = postCard;
    await expect(metadataContainer.locator('text=/P[1-5]/')).toBeVisible(); // Priority badge

    // Verify response count icon (if present)
    const messageIcon = postCard.locator('svg').filter({ hasText: '' }).first();
    await expect(messageIcon).toBeVisible();
  });

  test('should truncate long titles with line-clamp', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Get the title element
    const title = postCard.locator('h3');

    // Verify line-clamp is applied (via CSS class or computed style)
    const titleLineClamp = await title.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        lineClamp: styles.webkitLineClamp,
        display: styles.display,
        webBoxOrient: styles.webkitBoxOrient,
      };
    });

    // Title should have line-clamp or text-overflow truncation
    expect(
      titleLineClamp.lineClamp !== 'none' ||
        titleLineClamp.display === '-webkit-box' ||
        titleLineClamp.webBoxOrient === 'vertical'
    ).toBeTruthy();
  });

  test('should truncate excerpts with line-clamp', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Get the excerpt element
    const excerpt = postCard.locator('p').first();

    // Verify line-clamp is applied
    const excerptLineClamp = await excerpt.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        lineClamp: styles.webkitLineClamp,
        overflow: styles.overflow,
        textOverflow: styles.textOverflow,
      };
    });

    // Excerpt should have truncation
    expect(
      excerptLineClamp.lineClamp !== 'none' ||
        excerptLineClamp.overflow === 'hidden' ||
        excerptLineClamp.textOverflow === 'ellipsis'
    ).toBeTruthy();
  });

  test('should display clear information hierarchy', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify priority is most prominent (high contrast, small font)
    const priorityBadge = postCard
      .locator('span')
      .filter({ hasText: /P[1-5]/ })
      .first();
    await expect(priorityBadge).toBeVisible();

    // Verify priority has monospace font for distinctiveness
    const priorityFont = await priorityBadge.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily;
    });
    expect(priorityFont.toLowerCase()).toContain('mono');

    // Verify status badge is visible
    const statusBadge = postCard
      .locator('span')
      .filter({ hasText: /Open|In Progress|Resolved/ })
      .first();
    await expect(statusBadge).toBeVisible();

    // Verify metadata is less prominent (smaller font, muted color)
    // Look for timestamp text (ISO format with T and Z)
    const timestampText = postCard.locator('text=/\\d{4}-\\d{2}-\\d{2}T/').first();
    const hasTimestamp = (await timestampText.count()) > 0;

    expect(hasTimestamp).toBeTruthy();
  });

  test('should display all metadata in single row for list view', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify metadata container exists
    const metadataContainer = postCard.locator('.flex.items-center.gap-3').last();
    await expect(metadataContainer).toBeVisible();

    // Verify all metadata elements are in the same container
    const priority = metadataContainer.locator('span').filter({ hasText: /P[1-5]/ });
    await expect(priority).toBeVisible();

    // Verify icons are present
    const icons = metadataContainer.locator('svg');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);
  });

  test('should use compact spacing between elements', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify gap between metadata elements is small (8px or less)
    const metadataContainer = postCard.locator('.flex.items-center.gap-3').last();
    const gapSize = await metadataContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.gap;
    });

    // Gap should be small (12px or less for high-density)
    const gapValue = Number.parseFloat(gapSize);
    expect(gapValue).toBeLessThanOrEqual(12);
  });
});
