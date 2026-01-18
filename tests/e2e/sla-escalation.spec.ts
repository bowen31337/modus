import { test, expect } from '@playwright/test';

/**
 * Helper function to get CSRF token for authenticated requests
 */
async function getCsrfToken(page: any): Promise<string> {
  const csrfResponse = await page.request.get('/api/v1/auth/csrf');
  expect(csrfResponse.ok()).toBe(true);
  const csrfData = await csrfResponse.json();
  return csrfData.data.token;
}

test.describe('SLA-Based Priority Escalation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill in the form (in demo mode, any credentials work)
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit demo login
    await page.locator('button.bg-primary').click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should escalate priority for posts older than 2 hours', async ({ page }) => {
    // Test SLA escalation rule using the rules test API
    const testResult = await page.evaluate(async () => {
      // Create a post that is 3 hours old (should trigger SLA escalation)
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const response = await fetch('/api/v1/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Old Post Needing Attention',
          body_content: 'This post has been open for 3 hours without response',
          author_post_count: 5,
          sentiment_score: 0,
          created_at: threeHoursAgo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rules test API failed: ${response.status}`);
      }

      return response.json();
    });

    // Verify the test ran successfully
    expect(testResult).toBeDefined();
    expect(testResult.data).toBeDefined();

    // Check that SLA rule was triggered
    const { calculated_priority, matched_rules } = testResult.data;

    // Verify that SLA rule was in the matched rules
    const slaRuleMatched = matched_rules.some(
      (rule: any) => rule.rule_name?.includes('SLA') || rule.action_type === 'escalate'
    );
    expect(slaRuleMatched).toBeTruthy();

    // The calculated priority should be escalated (lower number than default P4)
    // SLA escalation uses 'escalate' action which moves up one level: P4 -> P3
    expect(['P1', 'P2', 'P3']).toContain(calculated_priority);
  });

  test('should not escalate priority for recent posts', async ({ page }) => {
    // Test that recent posts don't trigger SLA escalation
    const testResult = await page.evaluate(async () => {
      // Create a post that is only 30 minutes old (should NOT trigger SLA escalation)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const response = await fetch('/api/v1/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Recent Post',
          body_content: 'This post was just created 30 minutes ago',
          author_post_count: 5,
          sentiment_score: 0,
          created_at: thirtyMinutesAgo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rules test API failed: ${response.status}`);
      }

      return response.json();
    });

    // Verify the test ran successfully
    expect(testResult).toBeDefined();
    expect(testResult.data).toBeDefined();

    const { calculated_priority, matched_rules } = testResult.data;

    // Recent posts should not trigger SLA escalation
    const slaRuleMatched = matched_rules.some(
      (rule: any) => rule.rule_name?.includes('SLA')
    );
    expect(slaRuleMatched).toBeFalsy();

    // Priority should be calculated
    expect(calculated_priority).toBeDefined();
  });

  test('should handle custom SLA threshold', async ({ page }) => {
    // Test with a custom SLA threshold (e.g., 1 hour instead of 2)
    const testResult = await page.evaluate(async () => {
      // Create a post that is 90 minutes old (1.5 hours)
      const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();

      // First, create a custom SLA rule with 1 hour threshold
      const createRuleResponse = await fetch('/api/v1/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Custom SLA - 1 Hour',
          description: 'Escalate posts open for more than 1 hour',
          condition_type: 'sla_exceeded',
          condition_value: '1',
          action_type: 'escalate',
          action_value: '1',
          position: 1,
          is_active: true,
        }),
      });

      if (!createRuleResponse.ok) {
        throw new Error(`Failed to create custom rule: ${createRuleResponse.status}`);
      }

      const newRule = await createRuleResponse.json();

      // Test the rule with the 90-minute-old post
      const testResponse = await fetch('/api/v1/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Post Overdue for Custom SLA',
          body_content: 'This post is 90 minutes old',
          author_post_count: 5,
          sentiment_score: 0,
          created_at: ninetyMinutesAgo,
          ruleId: newRule.id, // Test only the custom rule
        }),
      });

      if (!testResponse.ok) {
        throw new Error(`Rules test API failed: ${testResponse.status}`);
      }

      const result = await testResponse.json();

      // Clean up: delete the custom rule
      await fetch(`/api/v1/rules/${newRule.id}`, { method: 'DELETE' });

      return result;
    });

    // Verify the custom 1-hour SLA rule triggered for 90-minute-old post
    expect(testResult).toBeDefined();
    expect(testResult.data).toBeDefined();

    const { matched_rules } = testResult.data;
    expect(matched_rules.length).toBeGreaterThan(0);

    // Should have matched the custom SLA rule
    const slaRuleMatched = matched_rules.some(
      (rule: any) => rule.rule_name?.includes('SLA')
    );
    expect(slaRuleMatched).toBeTruthy();
  });

  test('should verify SLA rule is listed in active rules', async ({ page }) => {
    // Verify that the SLA escalation rule exists and is active
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/v1/rules');
      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.status}`);
      }
      return response.json();
    });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBeTruthy();

    // Find the SLA escalation rule
    const slaRule = result.data.find(
      (rule: any) => rule.condition_type === 'sla_exceeded'
    );

    expect(slaRule).toBeDefined();
    expect(slaRule.name).toContain('SLA');
    expect(slaRule.is_active).toBeTruthy();
    expect(slaRule.condition_type).toBe('sla_exceeded');
    expect(slaRule.action_type).toBe('escalate');

    // Verify the threshold value (default should be 2 hours)
    expect(parseFloat(slaRule.condition_value)).toBeGreaterThan(0);
  });

  test('should show escalated priority in UI for overdue posts', async ({ page }) => {
    // Get CSRF token for POST request
    const csrfToken = await getCsrfToken(page);

    // Create an overdue post via API and verify it shows elevated priority in the queue
    const createResult = await page.evaluate(
      async ({ csrfToken }) => {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

        const response = await fetch('/api/v1/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            title: 'Overdue Post for UI Test',
            body_content: 'This post is 3 hours old and should be escalated',
            category_id: '11111111-1111-1111-1111-111111111111',
            author_user_id: '550e8400-e29b-41d4-a716-446655440001',
            author_post_count: 5,
            sentiment_score: 0,
            sentiment_label: 'neutral',
            created_at: threeHoursAgo,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create post: ${response.status}`);
        }

        return response.json();
      },
      { csrfToken }
    );

    expect(createResult).toBeDefined();
    expect(createResult.data).toBeDefined();
    expect(createResult.data.id).toBeDefined();

    // Reload the queue to see the new post
    await page.reload();
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

    // Find the created post in the queue
    const postCard = page.locator(`[data-testid="post-card-${createResult.data.id}"]`);

    // Wait for it to be visible
    await postCard.waitFor({ state: 'visible', timeout: 5000 });

    // Check that the priority shows elevated priority (P3 or higher, escalated from default P4)
    // The priority is displayed as text in the post card
    const priorityText = await postCard.textContent();
    expect(priorityText).toMatch(/P[1-3]/);

    // Clean up
    await page.evaluate(async (postId) => {
      await fetch(`/api/v1/posts/${postId}`, { method: 'DELETE' });
    }, createResult.data.id);
  });
});
