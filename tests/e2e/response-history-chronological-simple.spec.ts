import { test, expect } from '@playwright/test';

test.describe('Response History - Simple Debug Test', () => {
  test('should show responses for post 1', async ({ page, context }) => {
    // Set demo session cookie
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
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

    console.log('✓ Dashboard loaded');

    // Click on post '1'
    await page.click('[data-testid="post-card-1"]');
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    console.log('✓ Work pane opened');

    // Wait a bit for responses to load
    await page.waitForTimeout(2000);

    // Check if activity history section is visible
    const activityHistoryVisible = await page.locator('[data-testid="activity-history"]').isVisible().catch(() => false);
    console.log('Activity history visible:', activityHistoryVisible);

    if (activityHistoryVisible) {
      // Count responses
      const responseCount = await page.locator('[data-testid^="response-"]').count();
      console.log('Response count:', responseCount);

      // Get response IDs
      const responseElements = await page.locator('[data-testid^="response-"]').all();
      for (const element of responseElements) {
        const testId = await element.getAttribute('data-testid');
        console.log('  -', testId);
      }

      expect(responseCount).toBeGreaterThan(0);
    } else {
      console.log('❌ Activity history not visible - checking HTML...');
      const workPaneHTML = await page.locator('[data-testid="work-pane"]').innerHTML();
      console.log('Work pane contains "Activity History":', workPaneHTML.includes('Activity History'));
      console.log('Work pane contains "response":', workPaneHTML.includes('response'));
    }
  });
});
