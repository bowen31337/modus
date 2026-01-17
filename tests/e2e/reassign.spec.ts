import { test, expect } from '@playwright/test';

test.describe('Post Reassignment', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      path: '/',
      domain: 'localhost',
    }]);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for queue to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 5000 });
  });

  test('should display reassign button when post is assigned to current agent', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify reassign button is visible
    await expect(page.getByTestId('reassign-button')).toBeVisible();

    // Verify reassign button text
    await expect(page.getByTestId('reassign-button')).toContainText('Reassign');
  });

  test('should not display reassign button for unassigned posts', async ({ page }) => {
    // Click on a post (which auto-assigns it)
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Release the assignment
    await page.getByTestId('release-button').click();

    // Verify assign button is visible
    await expect(page.getByTestId('assign-to-me-button')).toBeVisible();

    // Verify reassign button is not visible
    await expect(page.getByTestId('reassign-button')).not.toBeVisible();
  });

  test('should open reassign modal when reassign button is clicked', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Click reassign button
    await page.getByTestId('reassign-button').click();

    // Verify reassign modal is visible
    await expect(page.getByTestId('reassign-modal')).toBeVisible();

    // Verify modal shows post title
    await expect(page.getByTestId('reassign-post-title')).toBeVisible();
    await expect(page.getByTestId('reassign-post-title')).toContainText('Unable to access');
  });

  test('should open reassign modal with Cmd+Shift+A keyboard shortcut', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Press Cmd+Shift+A (or Ctrl+Shift+A on Windows/Linux)
    await page.keyboard.press('Meta+Shift+A');

    // Verify reassign modal is visible
    await expect(page.getByTestId('reassign-modal')).toBeVisible();
  });

  test('should display list of available agents in reassign modal', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify agent list is visible
    await expect(page.getByTestId('agent-list')).toBeVisible();

    // Verify agents are displayed (should have at least 3 mock agents)
    const agentOptions = page.locator('[data-testid^="agent-option-"]');
    const count = await agentOptions.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should filter agents when searching in reassign modal', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Type in search box
    await page.fill('[data-testid="agent-search-input"]', 'Agent B');

    // Verify filtered results
    const agentOptions = page.locator('[data-testid^="agent-option-"]');
    const count = await agentOptions.count();
    expect(count).toBe(1);

    // Verify it's Agent B
    await expect(page.getByTestId('agent-option-550e8400-e29b-41d4-a716-446655440002')).toBeVisible();
  });

  test('should show current agent as disabled option', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify current agent (Agent A) shows "(Current)" label
    const currentAgentOption = page.getByTestId('agent-option-550e8400-e29b-41d4-a716-446655440001');
    await expect(currentAgentOption).toContainText('(Current)');

    // Verify current agent option is disabled (not clickable)
    await expect(currentAgentOption).toBeDisabled();

    // Confirm button should still be disabled
    const confirmButton = page.getByTestId('confirm-reassign-button');
    await expect(confirmButton).toBeDisabled();
  });

  test('should allow selecting and confirming reassignment to another agent', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Select Agent B
    await page.click('[data-testid="agent-option-550e8400-e29b-41d4-a716-446655440002"]');

    // Verify selection indicator appears
    const selectedOption = page.getByTestId('agent-option-550e8400-e29b-41d4-a716-446655440002');
    await expect(selectedOption).toHaveClass(/border-primary/);

    // Confirm button should be enabled
    const confirmButton = page.getByTestId('confirm-reassign-button');
    await expect(confirmButton).toBeEnabled();

    // Click confirm
    await confirmButton.click();

    // Modal should close
    await expect(page.getByTestId('reassign-modal')).not.toBeVisible();

    // Post should no longer be assigned to current agent
    // Verify "Assigned to you" badge is gone
    await expect(page.locator('[data-testid="work-pane"] >> text=Assigned to you')).not.toBeVisible();

    // Assign to Me button should appear
    await expect(page.getByTestId('assign-to-me-button')).toBeVisible();
  });

  test('should close reassign modal when cancel button is clicked', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify modal is open
    await expect(page.getByTestId('reassign-modal')).toBeVisible();

    // Click cancel button
    await page.getByTestId('cancel-reassign-button').click();

    // Verify modal is closed
    await expect(page.getByTestId('reassign-modal')).not.toBeVisible();

    // Post should still be assigned to current agent
    await expect(page.locator('[data-testid="work-pane"] >> text=Assigned to you').first()).toBeVisible();
  });

  test('should close reassign modal with Escape key', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify modal is open
    await expect(page.getByTestId('reassign-modal')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.getByTestId('reassign-modal')).not.toBeVisible();
  });

  test('should close reassign modal when clicking close button', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify modal is open
    await expect(page.getByTestId('reassign-modal')).toBeVisible();

    // Click close button (X)
    await page.getByTestId('close-reassign-modal').click();

    // Verify modal is closed
    await expect(page.getByTestId('reassign-modal')).not.toBeVisible();
  });

  test('should show agent status indicators in reassign modal', async ({ page }) => {
    // Click on first post and open reassign modal
    await page.click('[data-testid="post-card-1"]');
    await page.getByTestId('reassign-button').click();

    // Verify agents have status indicators (colored dots)
    const agentOptions = page.locator('[data-testid^="agent-option-"]');
    const firstOption = agentOptions.first();

    // Check for status indicator (a div with rounded-full class)
    const statusIndicator = firstOption.locator('div.rounded-full.border-2');
    await expect(statusIndicator).toBeVisible();
  });

  test('should display keyboard shortcut hint in reassign button tooltip', async ({ page }) => {
    // Click on first post to assign it
    await page.click('[data-testid="post-card-1"]');
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Verify reassign button has tooltip title
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toHaveAttribute('title', /Cmd\+Shift\+A/);
  });
});
