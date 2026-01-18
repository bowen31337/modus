import { expect, test } from '@playwright/test';

test.describe('Layout Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (demo mode allows access without auth)
    await page.goto('/dashboard');
    // Wait for the keyboard handler to be attached (indicates page is fully loaded)
    await page.waitForFunction(
      () => {
        return !!document.getElementById('keyboard-handler-attached');
      },
      { timeout: 10000 }
    );
  });

  test('should maintain 64px width for left rail', async ({ page }) => {
    // Find the left rail element using the specific test ID
    const leftRail = page.locator('[data-testid="left-rail"]');

    // Wait for the left rail to be visible
    await expect(leftRail).toBeVisible();

    // Get the computed width
    const boundingBox = await leftRail.boundingBox();
    if (boundingBox) {
      // Verify width is 64px
      expect(boundingBox.width).toBe(64);
    } else {
      // Fallback to computed style
      const computedStyle = await leftRail.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          width: style.width,
        };
      });
      expect(computedStyle.width).toBe('64px');
    }
  });

  test('should have queue pane width between 320-400px', async ({ page }) => {
    // Find the queue pane element using the specific test ID
    const queuePane = page.locator('[data-testid="queue-pane"]');

    // Wait for the queue pane to load
    await expect(queuePane).toBeVisible();

    // Get the computed width
    const boundingBox = await queuePane.boundingBox();
    if (boundingBox) {
      // Verify width is between 320px and 400px
      expect(boundingBox.width).toBeGreaterThanOrEqual(320);
      expect(boundingBox.width).toBeLessThanOrEqual(400);
    } else {
      // Fallback to computed style
      const computedStyle = await queuePane.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          width: style.width,
        };
      });
      const widthValue = Number.parseInt(computedStyle.width);
      expect(widthValue).toBeGreaterThanOrEqual(320);
      expect(widthValue).toBeLessThanOrEqual(400);
    }
  });

  test('should have three-pane layout properly structured', async ({ page }) => {
    // Verify left rail exists using specific test ID
    const leftRail = page.locator('[data-testid="left-rail"]');
    await expect(leftRail).toBeVisible();

    // Verify queue pane exists
    const queuePane = page.locator('[data-testid="queue-pane"]');
    await expect(queuePane).toBeVisible();

    // Verify work pane exists (main content area) - only visible when a post is selected
    // First, click on a post card to open the work pane
    const firstPostCard = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostCard).toBeVisible();
    await firstPostCard.click();

    // Wait for work pane to appear
    const workPane = page.locator('[data-testid="work-pane"]');
    await expect(workPane).toBeVisible({ timeout: 10000 });

    // Verify all three panes are visible and properly positioned
    const leftRailBox = await leftRail.boundingBox();
    const queuePaneBox = await queuePane.boundingBox();
    const workPaneBox = await workPane.boundingBox();

    if (leftRailBox && queuePaneBox && workPaneBox) {
      // Left rail should be at x=0
      expect(leftRailBox.x).toBe(0);

      // Queue pane should be to the right of left rail
      expect(queuePaneBox.x).toBeGreaterThan(leftRailBox.x);

      // Work pane should be to the right of queue pane
      expect(workPaneBox.x).toBeGreaterThan(queuePaneBox.x);
    }
  });

  test('should have consistent spacing throughout UI', async ({ page }) => {
    // Find multiple elements with padding
    const postCard = page.locator('[data-testid^="post-card-"]').first();
    const queuePane = page.locator('[data-testid="queue-pane"]');

    // Wait for queue pane to load
    await expect(queuePane).toBeVisible();

    // Wait for posts to load (may take a moment)
    await expect(postCard).toBeVisible({ timeout: 15000 });

    // Check post card padding
    const postCardPadding = await postCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: Number.parseInt(style.paddingTop),
        paddingRight: Number.parseInt(style.paddingRight),
        paddingBottom: Number.parseInt(style.paddingBottom),
        paddingLeft: Number.parseInt(style.paddingLeft),
      };
    });

    // All padding values should be multiples of 4px
    Object.values(postCardPadding).forEach((value) => {
      if (value > 0) {
        expect(value % 4).toBe(0);
      }
    });

    // Check queue pane padding
    const queuePanePadding = await queuePane.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: Number.parseInt(style.paddingTop),
        paddingRight: Number.parseInt(style.paddingRight),
        paddingBottom: Number.parseInt(style.paddingBottom),
        paddingLeft: Number.parseInt(style.paddingLeft),
      };
    });

    // All padding values should be multiples of 4px
    Object.values(queuePanePadding).forEach((value) => {
      if (value > 0) {
        expect(value % 4).toBe(0);
      }
    });
  });

  test('should have high-density profile with minimal padding', async ({ page }) => {
    // Find post cards
    const postCard = page.locator('[data-testid^="post-card-"]').first();

    // Wait for posts to load (may take a moment, especially on Firefox)
    await expect(postCard).toBeVisible({ timeout: 15000 });

    // Get the bounding box to check compact sizing
    const boundingBox = await postCard.boundingBox();
    if (boundingBox) {
      // Post cards should be relatively compact (height should be reasonable)
      // A high-density post card should be around 100-150px tall
      expect(boundingBox.height).toBeLessThanOrEqual(200);
      expect(boundingBox.height).toBeGreaterThan(50);
    }

    // Check that padding is minimal (typically 12px or less in high-density UI)
    const computedStyle = await postCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: Number.parseInt(style.paddingTop),
        paddingBottom: Number.parseInt(style.paddingBottom),
      };
    });

    // Total vertical padding should be reasonable for high-density
    const totalVerticalPadding = computedStyle.paddingTop + computedStyle.paddingBottom;
    expect(totalVerticalPadding).toBeLessThanOrEqual(24); // Max 24px total vertical padding
  });
});
