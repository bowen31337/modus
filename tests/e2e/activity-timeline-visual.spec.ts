import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Activity Timeline Visual Progression
 *
 * These tests verify that the activity timeline has clear visual progression
 * with all the required visual elements:
 * - Timeline line connecting events
 * - Events have timestamps and icons
 * - Chronological order is clear
 * - Internal notes are visually distinct
 */

test.describe('Activity Timeline - Visual Progression', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard
    await page.goto('/dashboard');
    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should have visual timeline line connecting events', async ({ page }) => {
    // Click on post '1' which has mock responses
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Verify the timeline line exists
    // The timeline line is a vertical line on the left side
    const timelineLine = page.locator('.absolute.left-4.top-0.bottom-0.w-0\\.5');
    await expect(timelineLine).toBeVisible();
  });

  test('should have timeline dots for each event', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have a timeline dot
    for (const response of responses) {
      // The timeline dot is a rounded-full element positioned absolutely
      const dot = response.locator('.absolute.left-2\\.5.top-6.w-3.h-3.rounded-full');
      await expect(dot).toBeVisible();
    }
  });

  test('should have timestamps for each event', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have a timestamp
    for (const response of responses) {
      const timestamp = response.locator('.text-xs.text-muted-foreground.font-mono');
      await expect(timestamp).toBeVisible();

      // Verify timestamp is a valid date
      const timestampText = await timestamp.textContent();
      expect(timestampText).toBeTruthy();
      const date = new Date(timestampText!);
      expect(date.getTime()).not.toBeNaN();
    }
  });

  test('should have icons for each event type', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have an icon container
    for (const response of responses) {
      const iconContainer = response.locator('.w-8.h-8.rounded-full.flex.items-center.justify-center');
      await expect(iconContainer).toBeVisible();
    }
  });

  test('should show internal notes with distinct visual styling', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    let foundInternalNote = false;

    for (const response of responses) {
      // Check if this is an internal note (has "Internal" badge)
      const internalBadge = response.locator('text=Internal');
      if (await internalBadge.count() > 0) {
        foundInternalNote = true;

        // Verify internal note has distinct styling (amber background)
        const content = response.locator('.bg-amber-500\\/5');
        await expect(content).toBeVisible();

        // Verify internal note has distinct border
        const border = response.locator('.border-amber-500\\/20');
        await expect(border).toBeVisible();

        // Verify internal note has distinct text color
        const textColor = response.locator('.text-amber-100\\/90');
        await expect(textColor).toBeVisible();

        // Verify the icon is distinct (EyeOff icon)
        const icon = response.locator('svg[data-testid="eye-off-icon"] or svg[lucide-icon="EyeOff"]');
        // The icon container should have amber color (EyeOff icon)
        const iconContainer = response.locator('.lucide-eye-off.text-amber-400');
        await expect(iconContainer).toBeVisible();
      }
    }

    // If we found internal notes, verify their distinct styling
    if (foundInternalNote) {
      console.log('✓ Internal notes found with distinct visual styling');
    }
  });

  test('should show public responses with distinct visual styling', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    let foundPublicResponse = false;

    for (const response of responses) {
      // Check if this is a public response (no "Internal" badge)
      const internalBadge = response.locator('text=Internal');
      if (await internalBadge.count() === 0) {
        foundPublicResponse = true;

        // Verify public response has distinct styling (background-tertiary)
        const content = response.locator('.bg-background-tertiary');
        await expect(content).toBeVisible();

        // Verify public response has distinct border
        const border = response.locator('.border-border\\/50');
        await expect(border).toBeVisible();

        // Verify the icon is distinct (MessageCircle icon)
        const iconContainer = response.locator('.text-primary');
        await expect(iconContainer).toBeVisible();
      }
    }

    // If we found public responses, verify their distinct styling
    if (foundPublicResponse) {
      console.log('✓ Public responses found with distinct visual styling');
    }
  });

  test('should have clear chronological order (oldest at top)', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Extract timestamps
    const timestamps: Date[] = [];
    for (const response of responses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground.font-mono').textContent();
      if (timestampText) {
        timestamps.push(new Date(timestampText));
      }
    }

    // Verify chronological order (oldest first)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
    }

    // Verify the first response has the oldest timestamp
    if (timestamps.length > 0) {
      const minTimestamp = Math.min(...timestamps.map((d) => d.getTime()));
      expect(timestamps[0].getTime()).toEqual(minTimestamp);
    }
  });

  test('should have agent name displayed for each event', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have an agent name
    for (const response of responses) {
      const agentName = response.locator('.text-sm.font-medium.text-foreground');
      await expect(agentName).toBeVisible();
    }
  });

  test('should have response content displayed', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have content
    for (const response of responses) {
      const content = response.locator('.text-sm.leading-relaxed.whitespace-pre-wrap');
      await expect(content).toBeVisible();
    }
  });

  test('should have activity timeline section header', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Verify activity history section exists with proper header
    const header = page.locator('h2:has-text("Activity Timeline")');
    await expect(header).toBeVisible();

    // Verify it has proper styling (uppercase, semibold, muted foreground)
    await expect(header).toHaveClass(/text-sm/);
    await expect(header).toHaveClass(/font-semibold/);
    await expect(header).toHaveClass(/text-foreground/);
    await expect(header).toHaveClass(/uppercase/);
  });

  test('should have visual connection between timeline line and dots', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Verify the timeline line exists
    const timelineLine = page.locator('.absolute.left-4.top-0.bottom-0.w-0\\.5');
    await expect(timelineLine).toBeVisible();

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Each response should have a dot positioned relative to the timeline line
    for (const response of responses) {
      const dot = response.locator('.absolute.left-2\\.5.top-6.w-3.h-3.rounded-full');
      await expect(dot).toBeVisible();

      // The dot should be positioned to the left of the timeline line
      // (left-2.5 = 10px, left-4 = 16px, so dot is left of line)
    }
  });

  test('should have consistent spacing between events', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Verify there are at least 2 responses to check spacing
    if (responses.length >= 2) {
      // Each response should have consistent padding
      for (const response of responses) {
        await expect(response).toHaveClass(/pl-12/); // Left padding for timeline
        await expect(response).toHaveClass(/pr-4/);   // Right padding
        await expect(response).toHaveClass(/py-4/);   // Vertical padding
      }
    }
  });

  test('should show "You" badge for current agent responses', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response elements
    const responses = await page.locator('[data-testid^="response-response-"]').all();

    // Check if any response has "You" badge
    let foundYouBadge = false;
    for (const response of responses) {
      const youBadge = response.locator('text=You');
      if (await youBadge.count() > 0) {
        foundYouBadge = true;
        // Verify the badge has proper styling
        await expect(youBadge).toBeVisible();
      }
    }

    if (foundYouBadge) {
      console.log('✓ Found "You" badge for current agent responses');
    }
  });
});
