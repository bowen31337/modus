/**
 * E2E Test: Resizable Pane Dividers
 *
 * Test Suite Coverage:
 * 1. Pane dividers are visible in the layout
 * 2. Dividers can be dragged with mouse
 * 3. Panel sizes update correctly when dragging
 * 4. Cursor changes to indicate resize capability
 * 5. Size constraints (min/max) are enforced
 */

import { expect, test } from '@playwright/test';

test.describe('Resizable Pane Dividers', () => {
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
    // Wait for the resize handles to be present
    await page.waitForSelector('[role="separator"]', { timeout: 10000 });
  });

  test('should display resize handles between panels', async ({ page }) => {
    // Check for resize handles (role="separator")
    const handles = page.locator('[role="separator"]');

    // Should have at least 2 handles (left-rail/queue and queue/work)
    await expect(handles).toHaveCount(2);

    // Verify handles are visible
    const firstHandle = handles.first();
    await expect(firstHandle).toBeVisible();
  });

  test('should show resize cursor on hover', async ({ page }) => {
    const handles = page.locator('[role="separator"]');
    const firstHandle = handles.first();

    // Hover over the handle
    await firstHandle.hover();

    // Check cursor style (should be col-resize)
    const cursor = await firstHandle.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toContain('resize');
  });

  test('should resize panel when dragging handle', async ({ page }) => {
    // Get the queue panel (second panel)
    const queuePanel = page.locator('[data-panel-size]').nth(1);
    const initialSize = await queuePanel.getAttribute('data-panel-size');

    expect(initialSize).toBeTruthy();

    // Get the resize handle between queue and work panes
    const resizeHandle = page.locator('[role="separator"]').nth(1);
    const box = await resizeHandle.boundingBox();

    expect(box).toBeTruthy();

    // Drag the handle to the right
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY, { steps: 10 });
    await page.mouse.up();

    // Wait for state to update
    await page.waitForTimeout(500);

    // Get new size
    const newSize = await queuePanel.getAttribute('data-panel-size');

    // Size should have changed
    expect(newSize).not.toBe(initialSize);

    // Calculate the difference
    const sizeDiff = Math.abs(parseFloat(newSize!) - parseFloat(initialSize!));
    expect(sizeDiff).toBeGreaterThan(0);
  });

  test('should enforce minimum size constraint', async ({ page }) => {
    // Get the queue panel
    const queuePanel = page.locator('[data-panel-size]').nth(1);

    // Get the resize handle
    const resizeHandle = page.locator('[role="separator"]').nth(1);
    const box = await resizeHandle.boundingBox();

    expect(box).toBeTruthy();

    // Try to drag way to the left (past minimum)
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 500, startY, { steps: 10 });
    await page.mouse.up();

    // Wait for state to update
    await page.waitForTimeout(500);

    // Get final size
    const finalSize = await queuePanel.getAttribute('data-panel-size');
    const sizeValue = parseFloat(finalSize!);

    // Should not go below minimum (20%)
    expect(sizeValue).toBeGreaterThanOrEqual(20);
    expect(sizeValue).toBeLessThan(100);
  });

  test('should maintain handle visibility during drag', async ({ page }) => {
    const resizeHandle = page.locator('[role="separator"]').nth(1);
    const box = await resizeHandle.boundingBox();

    expect(box).toBeTruthy();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    // Start dragging
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Handle should still be visible while dragging
    await expect(resizeHandle).toBeVisible();

    // Move while dragging
    await page.mouse.move(startX + 50, startY);

    // Should still be visible
    await expect(resizeHandle).toBeVisible();

    // Release
    await page.mouse.up();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const handles = page.locator('[role="separator"]');

    const count = await handles.count();

    for (let i = 0; i < count; i++) {
      const handle = handles.nth(i);

      // Should have role="separator"
      await expect(handle).toHaveAttribute('role', 'separator');

      // Should have aria-label
      const ariaLabel = await handle.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});
