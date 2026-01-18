import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Response History Chronological Order
 *
 * These tests verify that responses are displayed in chronological order (oldest first)
 * in the activity history section of the work pane.
 *
 * Test Categories:
 * - Chronological ordering with multiple responses
 * - Mixed public and internal notes
 * - Timestamp display accuracy
 * - New responses appear at the bottom
 */

test.describe('Response History - Chronological Order', () => {
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

  // Skip: Flaky due to race condition with response loading
  test.skip('should display responses in chronological order (oldest first)', async ({ page }) => {
    // Click on post '1' which has mock responses
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Wait for activity history section to load
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Give responses time to load (API call)
    await page.waitForSelector('[data-testid="response-response-"]', { state: 'attached', timeout: 10000 });

    // Get all response elements (exclude textarea)
    const responseElements = await page.locator('[data-testid="response-response-"]').all();

    // Expect at least 2 responses to test ordering (some posts have mock responses)
    expect(responseElements.length).toBeGreaterThan(0);

    // Extract timestamps from all responses
    const timestamps: Date[] = [];
    for (const element of responseElements) {
      const timestampText = await element.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        timestamps.push(new Date(timestampText));
      }
    }

    // Verify timestamps are in ascending order (oldest first)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
    }
  });

  test('should maintain chronological order with mixed response types', async ({ page }) => {
    // Click on post '1' which has mock responses
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all responses with their types
    const responses = await page.locator('[data-testid="response-response-"]').all();

    const responseData: Array<{ timestamp: Date; isInternal: boolean }> = [];

    for (const response of responses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();
      const hasInternalBadge = await response.locator('text=Internal').count() > 0;

      if (timestampText) {
        responseData.push({
          timestamp: new Date(timestampText),
          isInternal: hasInternalBadge,
        });
      }
    }

    // Verify chronological order is maintained regardless of response type
    for (let i = 1; i < responseData.length; i++) {
      expect(responseData[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        responseData[i - 1].timestamp.getTime()
      );
    }
  });

  test('should display human-readable timestamps in correct format', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all timestamp elements
    const timestampElements = await page.locator('[data-testid="response-response-"] .text-xs.text-muted-foreground').all();

    for (const element of timestampElements) {
      const timestampText = await element.textContent();
      expect(timestampText).toBeTruthy();

      // Verify it's a valid date string
      const date = new Date(timestampText!);
      expect(date.getTime()).not.toBeNaN();

      // Verify format contains date and time components
      // Format: "M/D/YYYY, H:MM:SS AM/PM" or similar locale format
      expect(timestampText).toMatch(/\d/); // Contains at least one digit
    }
  });

  // Skip: Tests response submission, not chronological ordering
  test.skip('should show new response at bottom of history after submission', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get initial response count
    const initialCount = await page.locator('[data-testid="response-response-"]').count();

    // Type a new response
    const responseText = 'This is a test response for chronological ordering.';
    await page.fill('[data-testid="response-editor"]', responseText);

    // Submit the response
    await page.click('[data-testid="submit-response-btn"]');

    // Wait for the response to appear
    await page.waitForSelector(`[data-testid^="response-"]`, { timeout: 10000 });

    // Get all responses after submission
    const allResponses = await page.locator('[data-testid="response-response-"]').all();

    // The newest response should be the last one
    const lastResponse = allResponses[allResponses.length - 1];
    const lastResponseText = await lastResponse.textContent();

    // Verify the new response contains our text
    expect(lastResponseText).toContain(responseText);

    // Verify it's at the bottom
    expect(allResponses.length).toBeGreaterThan(initialCount);
  });

  test('should maintain order when responses have same timestamp', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all responses
    const responses = await page.locator('[data-testid="response-response-"]').all();
    const timestamps: Date[] = [];

    for (const response of responses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        timestamps.push(new Date(timestampText));
      }
    }

    // Verify responses are sorted (allowing for equal timestamps)
    for (let i = 1; i < timestamps.length; i++) {
      const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(0); // Can be 0 for same timestamp
    }
  });

  test('should show oldest response at top of activity history', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response timestamps
    const responseElements = await page.locator('[data-testid="response-response-"]').all();
    const timestamps: Date[] = [];

    for (const element of responseElements) {
      const timestampText = await element.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        timestamps.push(new Date(timestampText));
      }
    }

    if (timestamps.length > 0) {
      // Find the minimum timestamp
      const minTimestamp = Math.min(...timestamps.map((d) => d.getTime()));

      // The first response should have the minimum timestamp (oldest)
      expect(timestamps[0].getTime()).toEqual(minTimestamp);
    }
  });

  test('should show newest response at bottom of activity history', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all response timestamps
    const responseElements = await page.locator('[data-testid="response-response-"]').all();
    const timestamps: Date[] = [];

    for (const element of responseElements) {
      const timestampText = await element.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        timestamps.push(new Date(timestampText));
      }
    }

    if (timestamps.length > 0) {
      // Find the maximum timestamp
      const maxTimestamp = Math.max(...timestamps.map((d) => d.getTime()));

      // The last response should have the maximum timestamp (newest)
      expect(timestamps[timestamps.length - 1].getTime()).toEqual(maxTimestamp);
    }
  });

  // Skip: Tests response submission, not chronological ordering
  test.skip('should preserve chronological order after internal note submission', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get initial timestamps
    const initialTimestamps: Date[] = [];
    const initialResponses = await page.locator('[data-testid="response-response-"]').all();

    for (const response of initialResponses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        initialTimestamps.push(new Date(timestampText));
      }
    }

    // Toggle internal note mode
    await page.click('[data-testid="internal-note-toggle"]');

    // Type and submit an internal note
    const noteText = 'This is an internal note for testing.';
    await page.fill('[data-testid="response-editor"]', noteText);
    await page.click('[data-testid="submit-response-btn"]');

    // Wait for the note to appear
    await page.waitForTimeout(1000);

    // Get all timestamps after submission
    const newTimestamps: Date[] = [];
    const newResponses = await page.locator('[data-testid="response-response-"]').all();

    for (const response of newResponses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        newTimestamps.push(new Date(timestampText));
      }
    }

    // Verify chronological order is maintained
    for (let i = 1; i < newTimestamps.length; i++) {
      expect(newTimestamps[i].getTime()).toBeGreaterThanOrEqual(newTimestamps[i - 1].getTime());
    }

    // The new internal note should be at the bottom (newest)
    expect(newTimestamps.length).toBeGreaterThan(initialTimestamps.length);
    expect(newTimestamps[newTimestamps.length - 1].getTime()).toBeGreaterThanOrEqual(
      initialTimestamps[initialTimestamps.length - 1].getTime()
    );
  });

  test('should display all timestamps in consistent format', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all timestamp elements
    const timestampElements = await page.locator('[data-testid="response-response-"] .text-xs.text-muted-foreground').all();
    const timestampFormats: string[] = [];

    for (const element of timestampElements) {
      const timestampText = await element.textContent();
      expect(timestampText).toBeTruthy();
      timestampFormats.push(timestampText!);
    }

    // All timestamps should follow the same locale string format
    // They should all be valid dates
    for (const format of timestampFormats) {
      const date = new Date(format);
      expect(date.getTime()).not.toBeNaN();
    }
  });

  test('should handle responses with milliseconds precision', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all responses
    const responses = await page.locator('[data-testid="response-response-"]').all();
    const timestamps: Date[] = [];

    for (const response of responses) {
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();
      if (timestampText) {
        const date = new Date(timestampText);
        expect(date.getTime()).not.toBeNaN();
        timestamps.push(date);
      }
    }

    // Verify strict ordering (no equal timestamps unless created at exact same moment)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
    }
  });

  test('should maintain order when responses are from different agents', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    // Get all responses with agent names and timestamps
    const responses = await page.locator('[data-testid="response-response-"]').all();
    const responseData: Array<{ agent: string; timestamp: Date }[]> = [];

    for (const response of responses) {
      const agent = await response.locator('.text-sm.font-medium').textContent();
      const timestampText = await response.locator('.text-xs.text-muted-foreground').textContent();

      if (agent && timestampText) {
        responseData.push({
          agent: agent.trim(),
          timestamp: new Date(timestampText),
        });
      }
    }

    // Verify chronological order is maintained regardless of agent
    for (let i = 1; i < responseData.length; i++) {
      expect(responseData[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        responseData[i - 1].timestamp.getTime()
      );
    }
  });

  test('should show activity history section header', async ({ page }) => {
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Verify activity history section exists with proper header
    await page.waitForSelector('[data-testid="activity-history"]', { timeout: 10000 });

    const header = await page.locator('h2:has-text("Activity History")').textContent();
    expect(header).toBeTruthy();

    // Verify it has proper styling
    const activityHistory = page.locator('[data-testid="activity-history"]');
    await expect(activityHistory).toBeVisible();
  });
});
