import { expect, test } from '@playwright/test';

test.describe('Rules Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Switch to Rules tab
    await page.getByTestId('tab-rules').click();
    await expect(page.getByTestId('rule-search-input')).toBeVisible();
  });

  test('should display rules management page', async ({ page }) => {
    // Verify page title
    await expect(page.getByText('Settings')).toBeVisible();

    // Verify tab navigation
    await expect(page.getByTestId('tab-templates')).toBeVisible();
    await expect(page.getByTestId('tab-rules')).toBeVisible();

    // Verify Rules tab is active
    await expect(page.getByTestId('tab-rules')).toHaveClass(/bg-background-tertiary/);

    // Verify Create Rule button
    await expect(page.getByTestId('create-rule-button')).toBeVisible();

    // Verify search input
    await expect(page.getByTestId('rule-search-input')).toBeVisible();
  });

  test('should display list of existing rules', async ({ page }) => {
    // Verify mock rules are displayed
    const ruleCards = page.getByTestId(/rule-card-/);
    await expect(ruleCards.first()).toBeVisible();

    // Verify specific rule is displayed (use heading role to avoid matching condition value span)
    await expect(page.getByRole('heading', { name: 'First Time Poster Escalation' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Negative Sentiment Escalation' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Keyword Match: Urgent' })).toBeVisible();
  });

  test('should display rule details correctly', async ({ page }) => {
    const ruleCard = page.getByTestId('rule-card-rule-1');

    // Verify rule name
    await expect(ruleCard).toContainText('First Time Poster Escalation');

    // Verify rule description
    await expect(ruleCard).toContainText('Escalate posts from first-time posters');

    // Verify condition and action
    await expect(ruleCard).toContainText('First Time Poster');
    await expect(ruleCard).toContainText('Set Priority');

    // Verify active status
    await expect(ruleCard).toContainText('Active');
  });

  test('should open create rule modal when clicking Create Rule button', async ({ page }) => {
    // Click Create Rule button
    await page.getByTestId('create-rule-button').click();

    // Verify modal is displayed
    await expect(page.getByTestId('create-rule-modal')).toBeVisible();

    // Verify form fields are present
    await expect(page.getByTestId('rule-name-input')).toBeVisible();
    await expect(page.getByTestId('rule-description-input')).toBeVisible();
    await expect(page.getByTestId('rule-condition-type-select')).toBeVisible();
    await expect(page.getByTestId('rule-condition-value-input')).toBeVisible();
    await expect(page.getByTestId('rule-action-type-select')).toBeVisible();
    await expect(page.getByTestId('rule-action-value-select')).toBeVisible();
    await expect(page.getByTestId('rule-active-checkbox')).toBeVisible();

    // Verify buttons are present
    await expect(page.getByTestId('cancel-rule')).toBeVisible();
    await expect(page.getByTestId('save-rule')).toBeVisible();
  });

  test('should create a new rule', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Fill in rule details
    await page.getByTestId('rule-name-input').fill('New Test Rule');
    await page.getByTestId('rule-description-input').fill('This is a test rule for E2E testing');
    await page.getByTestId('rule-condition-type-select').selectOption('keyword_match');
    await page.getByTestId('rule-condition-value-input').fill('test,testing');
    await page.getByTestId('rule-action-type-select').selectOption('escalate');
    await page.getByTestId('rule-action-value-input').fill('1');

    // Click Save
    await page.getByTestId('save-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('create-rule-modal')).not.toBeVisible();

    // Verify new rule appears in list
    await expect(page.getByText('New Test Rule')).toBeVisible();
  });

  test('should disable save button when required fields are missing', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Verify save button is disabled initially
    const saveButton = page.getByTestId('save-rule');
    await expect(saveButton).toBeDisabled();

    // Fill in only name
    await page.getByTestId('rule-name-input').fill('Test Rule');
    await expect(saveButton).toBeDisabled();

    // Fill in condition value
    await page.getByTestId('rule-condition-value-input').fill('test');
    await expect(saveButton).toBeEnabled();
  });

  test('should cancel rule creation', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Fill in form
    await page.getByTestId('rule-name-input').fill('Test Rule');
    await page.getByTestId('rule-condition-value-input').fill('test');

    // Click Cancel
    await page.getByTestId('cancel-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('create-rule-modal')).not.toBeVisible();

    // Verify rule was not created
    await expect(page.getByText('Test Rule')).not.toBeVisible();
  });

  test('should edit an existing rule', async ({ page }) => {
    // Click edit button on first rule
    await page.getByTestId('edit-rule-rule-1').click();

    // Verify edit modal is displayed
    await expect(page.getByTestId('edit-rule-modal')).toBeVisible();

    // Verify existing data is pre-filled
    await expect(page.getByTestId('rule-name-input')).toHaveValue('First Time Poster Escalation');

    // Modify rule name
    await page.getByTestId('rule-name-input').clear();
    await page.getByTestId('rule-name-input').fill('First Time Poster Escalation (Updated)');

    // Modify condition value
    await page.getByTestId('rule-condition-value-input').clear();
    await page.getByTestId('rule-condition-value-input').fill('3');

    // Click Save Changes
    await page.getByTestId('save-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('edit-rule-modal')).not.toBeVisible();

    // Verify rule was updated
    await expect(page.getByText('First Time Poster Escalation (Updated)')).toBeVisible();
  });

  test('should cancel rule editing', async ({ page }) => {
    // Click edit button
    await page.getByTestId('edit-rule-rule-1').click();

    // Modify form
    await page.getByTestId('rule-name-input').clear();
    await page.getByTestId('rule-name-input').fill('Changed Name');

    // Click Cancel
    await page.getByTestId('cancel-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('edit-rule-modal')).not.toBeVisible();

    // Verify rule was not changed
    await expect(page.getByText('First Time Poster Escalation')).toBeVisible();
    await expect(page.getByText('Changed Name')).not.toBeVisible();
  });

  test('should delete a rule with confirmation', async ({ page }) => {
    // Get initial rule count
    const initialRuleCount = await page.getByTestId(/rule-card-/).count();

    // Click delete button on a rule
    await page.getByTestId('delete-rule-rule-5').click();

    // Verify delete confirmation modal is displayed
    const modal = page.getByTestId('delete-rule-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Delete Rule' })).toBeVisible();
    await expect(modal.getByText(/Bug Report Category/)).toBeVisible();

    // Click confirm delete
    await page.getByTestId('confirm-delete-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('delete-rule-modal')).not.toBeVisible();

    // Verify rule is removed from list
    const newRuleCount = await page.getByTestId(/rule-card-/).count();
    expect(newRuleCount).toBe(initialRuleCount - 1);
    await expect(page.getByText('Bug Report Category')).not.toBeVisible();
  });

  test('should cancel rule deletion', async ({ page }) => {
    // Get initial rule count
    const initialRuleCount = await page.getByTestId(/rule-card-/).count();

    // Click delete button
    await page.getByTestId('delete-rule-rule-4').click();

    // Click cancel
    await page.getByTestId('cancel-delete-rule').click();

    // Verify modal is closed
    await expect(page.getByTestId('delete-rule-modal')).not.toBeVisible();

    // Verify rule still exists
    const newRuleCount = await page.getByTestId(/rule-card-/).count();
    expect(newRuleCount).toBe(initialRuleCount);
    await expect(page.getByText('Keyword Match: Urgent')).toBeVisible();
  });

  test('should filter rules based on search input', async ({ page }) => {
    // Search for "First Time"
    await page.getByTestId('rule-search-input').fill('First Time');

    // Verify only matching rules are shown
    await expect(page.getByText('First Time Poster Escalation')).toBeVisible();
    await expect(page.getByText('Negative Sentiment Escalation')).not.toBeVisible();

    // Search for "urgent"
    await page.getByTestId('rule-search-input').fill('urgent');

    // Verify only matching rules are shown
    await expect(page.getByText('Keyword Match: Urgent')).toBeVisible();
    await expect(page.getByText('First Time Poster Escalation')).not.toBeVisible();

    // Clear search
    await page.getByTestId('rule-search-input').fill('');

    // Verify all rules are shown again
    await expect(page.getByText('First Time Poster Escalation')).toBeVisible();
    await expect(page.getByText('Keyword Match: Urgent')).toBeVisible();
  });

  test('should show empty state when no rules match search', async ({ page }) => {
    // Search for non-existent rule
    await page.getByTestId('rule-search-input').fill('NonExistentRule123');

    // Verify empty state is shown
    await expect(page.getByText('No rules found')).toBeVisible();
    await expect(page.getByText('Try a different search term')).toBeVisible();
  });

  test('should toggle rule active status', async ({ page }) => {
    const ruleCard = page.getByTestId('rule-card-rule-1');

    // Verify rule is initially active
    await expect(ruleCard).toContainText('Active');

    // Click toggle button
    await page.getByTestId('toggle-rule-rule-1').click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify rule is now disabled
    await expect(ruleCard).toContainText('Disabled');
  });

  test('should move rule up and down', async ({ page }) => {
    // Get first rule name
    const firstRule = page.getByTestId('rule-card-rule-1');
    const firstRuleName = await firstRule.locator('h3').textContent();

    // Move first rule down
    await page.getByTestId('move-down-rule-1').click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify first rule is no longer first
    const rules = page.getByTestId(/rule-card-/);
    const newFirstRule = rules.first();
    const newFirstRuleName = await newFirstRule.locator('h3').textContent();

    // The first rule should have changed
    expect(newFirstRuleName).not.toBe(firstRuleName);
  });

  test('should show test modal when clicking test button', async ({ page }) => {
    // Click test button on first rule
    await page.getByTestId('test-rule-rule-1').click();

    // Verify test modal is displayed
    await expect(page.getByTestId('test-rule-modal')).toBeVisible();

    // Verify test form fields are present
    await expect(page.getByTestId('test-title-input')).toBeVisible();
    await expect(page.getByTestId('test-body-content-input')).toBeVisible();
    await expect(page.getByTestId('test-author-post-count-input')).toBeVisible();
    await expect(page.getByTestId('test-sentiment-input')).toBeVisible();
    await expect(page.getByTestId('test-category-input')).toBeVisible();
    await expect(page.getByTestId('run-test-button')).toBeVisible();
  });

  test('should run rule test and show results', async ({ page }) => {
    // Click test button
    await page.getByTestId('test-rule-rule-1').click();

    // Fill in test data
    await page.getByTestId('test-title-input').fill('Test post title');
    await page.getByTestId('test-body-content-input').fill('This is test content for the post');
    await page.getByTestId('test-author-post-count-input').fill('1');

    // Run test
    await page.getByTestId('run-test-button').click();

    // Wait for results
    await page.waitForTimeout(500);

    // Verify results are displayed
    await expect(page.getByTestId('test-result-priority')).toBeVisible();
  });

  test('should close test modal', async ({ page }) => {
    // Open test modal
    await page.getByTestId('test-rule-rule-1').click();
    await expect(page.getByTestId('test-rule-modal')).toBeVisible();

    // Close modal
    await page.getByTestId('close-test-modal').click();

    // Verify modal is closed
    await expect(page.getByTestId('test-rule-modal')).not.toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Verify Rules tab is active
    await expect(page.getByTestId('tab-rules')).toHaveClass(/bg-background-tertiary/);
    await expect(page.getByTestId('rule-search-input')).toBeVisible();

    // Switch to Templates tab
    await page.getByTestId('tab-templates').click();

    // Verify Templates tab is active
    await expect(page.getByTestId('tab-templates')).toHaveClass(/bg-background-tertiary/);
    await expect(page.getByTestId('template-search-input')).toBeVisible();

    // Switch back to Rules tab
    await page.getByTestId('tab-rules').click();

    // Verify Rules tab is active again
    await expect(page.getByTestId('tab-rules')).toHaveClass(/bg-background-tertiary/);
    await expect(page.getByTestId('rule-search-input')).toBeVisible();
  });

  test('should show condition type options in create modal', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Click on condition type select
    const conditionSelect = page.getByTestId('rule-condition-type-select');
    await conditionSelect.click();

    // Verify condition options are available
    await expect(page.locator('option', { hasText: 'First Time Poster' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Negative Sentiment' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'SLA Exceeded' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Keyword Match' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Category Match' })).toBeVisible();
  });

  test('should show action type options in create modal', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Click on action type select
    const actionSelect = page.getByTestId('rule-action-type-select');
    await actionSelect.click();

    // Verify action options are available
    await expect(page.locator('option', { hasText: 'Set Priority' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Escalate' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Auto Assign' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'Tag' })).toBeVisible();
  });

  test('should show priority select when action type is Set Priority', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Select Set Priority action
    await page.getByTestId('rule-action-type-select').selectOption('set_priority');

    // Verify priority select is shown (not a text input)
    await expect(page.getByTestId('rule-action-value-select')).toBeVisible();

    // Verify priority options are available
    const prioritySelect = page.getByTestId('rule-action-value-select');
    await prioritySelect.click();
    await expect(page.locator('option', { hasText: 'P1' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'P2' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'P3' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'P4' })).toBeVisible();
    await expect(page.locator('option', { hasText: 'P5' })).toBeVisible();
  });

  test('should show text input when action type is Auto Assign', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Select Auto Assign action
    await page.getByTestId('rule-action-type-select').selectOption('auto_assign');

    // Verify text input is shown (not a select)
    await expect(page.getByTestId('rule-action-value-input')).toBeVisible();
    await expect(page.getByTestId('rule-action-value-input')).toHaveAttribute('type', 'text');
  });

  test('should show help text for condition value based on condition type', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-rule-button').click();

    // Select different condition types and verify help text
    await page.getByTestId('rule-condition-type-select').selectOption('first_time_poster');
    await expect(
      page.getByText('Posts from authors with fewer than this many posts')
    ).toBeVisible();

    await page.getByTestId('rule-condition-type-select').selectOption('sentiment_negative');
    await expect(page.getByText('Sentiment score threshold')).toBeVisible();

    await page.getByTestId('rule-condition-type-select').selectOption('keyword_match');
    await expect(page.getByText('Comma-separated list of keywords')).toBeVisible();
  });
});
