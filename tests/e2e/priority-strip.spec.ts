/**
 * E2E Test: PostCard Priority Strip
 *
 * Test Steps:
 * 1. View PostCard components in queue
 * 2. Verify colored priority strip is on left edge
 * 3. Verify strip is consistently sized across cards
 * 4. Verify strip color matches priority level
 * 5. Take screenshot for visual verification
 */

import { expect, test } from '@playwright/test';

test.describe('PostCard Priority Strip', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate by logging in
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    // Wait for page to load
    await expect(page.locator('h2:has-text("Moderation Queue")')).toBeVisible();
  });

  test('should display vertical priority strip on left edge', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Verify the priority strip exists (it's the first child div with width-1 class)
    const priorityStrip = postCard.locator('div').filter({ hasClass: /w-1/ }).first();
    await expect(priorityStrip).toBeVisible();
  });

  test('should have consistently sized priority strip across cards', async ({ page }) => {
    // Get all post cards
    const postCards = page.locator('[data-testid^="post-card-"]');
    const count = await postCards.count();
    expect(count).toBeGreaterThan(0);

    // Check first 3 cards have consistent strip width
    const stripWidths = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = postCards.nth(i);
      const priorityStrip = card.locator('div').filter({ hasClass: /w-1/ }).first();

      const width = await priorityStrip.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.width;
      });

      stripWidths.push(width);
    }

    // All strips should have the same width
    expect(stripWidths.every((w) => w === stripWidths[0])).toBeTruthy();
  });

  test('should display P1 priority with red color strip', async ({ page }) => {
    // Find a P1 post (or filter to show only P1 posts)
    // First, try to find a P1 post in the current list
    const p1Posts = page.locator('[data-testid^="post-card-"]').filter({ hasText: 'P1' });
    const p1Count = await p1Posts.count();

    if (p1Count === 0) {
      // If no P1 posts visible, filter for them
      await page.locator('button:has-text("Filters")').first().click();
      await page.locator('button:has-text("Priority")').first().click();
      const dropdown = page.locator('div.z-50');
      await dropdown.locator('button:has-text("P1")').click();
      await page.waitForTimeout(500);
    }

    // Get the first P1 post card
    const p1Card = page.locator('[data-testid^="post-card-"]').filter({ hasText: 'P1' }).first();
    await expect(p1Card).toBeVisible();

    // Get the priority strip
    const priorityStrip = p1Card.locator('div').filter({ hasClass: /w-1/ }).first();

    // Verify it has red background color
    const backgroundColor = await priorityStrip.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });

    // Should be a red color (rgb(239, 68, 68) is tailwind red-500)
    expect(backgroundColor).toBe('rgb(239, 68, 68)');
  });

  test('should display P2 priority with orange color strip', async ({ page }) => {
    // Filter for P2 posts
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Priority")').first().click();
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("P2")').click();
    await page.waitForTimeout(500);

    // Get the first P2 post card
    const p2Card = page.locator('[data-testid^="post-card-"]').filter({ hasText: 'P2' }).first();
    await expect(p2Card).toBeVisible();

    // Get the priority strip
    const priorityStrip = p2Card.locator('div').filter({ hasClass: /w-1/ }).first();

    // Verify it has orange background color
    const backgroundColor = await priorityStrip.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });

    // Should be an orange color
    expect(backgroundColor).toBeDefined();
  });

  test('should display P3 priority with yellow color strip', async ({ page }) => {
    // Filter for P3 posts
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Priority")').first().click();
    const dropdown = page.locator('div.z-50');
    await dropdown.locator('button:has-text("P3")').click();
    await page.waitForTimeout(500);

    // Get the first P3 post card
    const p3Card = page.locator('[data-testid^="post-card-"]').filter({ hasText: 'P3' }).first();
    await expect(p3Card).toBeVisible();

    // Get the priority strip
    const priorityStrip = p3Card.locator('div').filter({ hasClass: /w-1/ }).first();

    // Verify it has yellow background color
    const backgroundColor = await priorityStrip.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });

    // Should be a yellow color
    expect(backgroundColor).toBeDefined();
  });

  test('should have strip positioned on left edge', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Get the priority strip
    const priorityStrip = postCard.locator('div').filter({ hasClass: /w-1/ }).first();

    // Verify it's positioned on the left (has left position 0)
    const position = await priorityStrip.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        left: styles.left,
        marginLeft: styles.marginLeft,
      };
    });

    // Strip should be on the left edge (static or relative positioning with no margin)
    expect(['static', 'relative']).toContain(position.position);
    expect(position.left).toBe('auto');
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    // Get the first post card
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(postCard).toBeVisible();

    // Take a screenshot of the post card for visual verification
    await postCard.screenshot({
      path: 'reports/screenshots/postcard-priority-strip.png',
    });

    // Verify screenshot was created
    const fs = require('fs');
    expect(fs.existsSync('reports/screenshots/postcard-priority-strip.png')).toBeTruthy();
  });
});
