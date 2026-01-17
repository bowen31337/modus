import { test, expect } from '@playwright/test';

test.describe('Template Management', () => {
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
  });

  test('should display template management page', async ({ page }) => {
    // Verify page title
    await expect(page.getByText('Settings')).toBeVisible();

    // Verify Create Template button
    await expect(page.getByTestId('create-template-button')).toBeVisible();

    // Verify search input
    await expect(page.getByTestId('template-search-input')).toBeVisible();

    // Verify template list is displayed
    await expect(page.getByText('Response Templates')).toBeVisible();
  });

  test('should display list of existing templates', async ({ page }) => {
    // Verify first template is displayed
    await expect(page.getByTestId('template-card-1')).toBeVisible();
    await expect(page.getByTestId('template-card-1')).toContainText('Welcome Message');

    // Verify second template is displayed
    await expect(page.getByTestId('template-card-2')).toBeVisible();
    await expect(page.getByTestId('template-card-2')).toContainText('Issue Resolution');

    // Verify usage count is displayed
    await expect(page.getByTestId('template-card-1')).toContainText('15 uses');

    // Verify placeholders are displayed
    await expect(page.getByTestId('template-card-1')).toContainText('{{authorName}}');
  });

  test('should open create template modal when clicking Create Template button', async ({ page }) => {
    // Click Create Template button
    await page.getByTestId('create-template-button').click();

    // Verify modal is displayed
    await expect(page.getByTestId('create-template-modal')).toBeVisible();

    // Verify form fields are present
    await expect(page.getByTestId('create-template-name-input')).toBeVisible();
    await expect(page.getByTestId('create-template-content-input')).toBeVisible();

    // Verify buttons are present
    await expect(page.getByTestId('cancel-create-template')).toBeVisible();
    await expect(page.getByTestId('save-create-template')).toBeVisible();
  });

  test('should create a new template', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Fill in template name
    await page.getByTestId('create-template-name-input').fill('Bug Report Acknowledgment');

    // Fill in template content
    await page.getByTestId('create-template-content-input').fill(
      'Hi {{authorName}},\n\nThank you for reporting this bug about "{{title}}". Our development team has been notified and will investigate the issue.\n\nWe\'ll keep you updated on the progress.\n\nBest regards,\n{{agentName}}'
    );

    // Verify placeholders are detected
    await expect(page.getByText('Detected Placeholders:')).toBeVisible();
    await expect(page.getByText('{{authorName}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{title}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{agentName}}', { exact: true })).toBeVisible();

    // Click Save
    await page.getByTestId('save-create-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('create-template-modal')).not.toBeVisible();

    // Verify new template appears in list
    const newTemplateCard = page.getByText('Bug Report Acknowledgment');
    await expect(newTemplateCard).toBeVisible();
  });

  test('should disable save button when form is invalid', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Verify save button is disabled initially
    const saveButton = page.getByTestId('save-create-template');
    await expect(saveButton).toBeDisabled();

    // Fill in only name
    await page.getByTestId('create-template-name-input').fill('Test Template');
    await expect(saveButton).toBeDisabled();

    // Fill in content
    await page.getByTestId('create-template-content-input').fill('Test content');
    await expect(saveButton).toBeEnabled();
  });

  test('should cancel template creation', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Fill in form
    await page.getByTestId('create-template-name-input').fill('Test Template');
    await page.getByTestId('create-template-content-input').fill('Test content');

    // Click Cancel
    await page.getByTestId('cancel-create-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('create-template-modal')).not.toBeVisible();

    // Verify template was not created
    await expect(page.getByText('Test Template')).not.toBeVisible();
  });

  test('should edit an existing template', async ({ page }) => {
    // Click edit button on first template
    await page.getByTestId('edit-template-1').click();

    // Verify edit modal is displayed
    await expect(page.getByTestId('edit-template-modal')).toBeVisible();

    // Verify existing data is pre-filled
    await expect(page.getByTestId('edit-template-name-input')).toHaveValue('Welcome Message');
    await expect(page.getByTestId('edit-template-content-input')).toHaveValue(/\Thank you for reaching out/);

    // Modify template name
    await page.getByTestId('edit-template-name-input').clear();
    await page.getByTestId('edit-template-name-input').fill('Welcome Message (Updated)');

    // Modify template content
    await page.getByTestId('edit-template-content-input').clear();
    await page.getByTestId('edit-template-content-input').fill(
      'Hi {{authorName}},\n\nThank you for reaching out! We\'ve received your post about "{{title}}" and appreciate your contribution to our community.\n\nWarm regards,\n{{agentName}}'
    );

    // Click Save Changes
    await page.getByTestId('save-edit-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('edit-template-modal')).not.toBeVisible();

    // Verify template was updated
    await expect(page.getByText('Welcome Message (Updated)')).toBeVisible();
    await expect(page.getByText("We've received your post about")).toBeVisible();
  });

  test('should cancel template editing', async ({ page }) => {
    // Click edit button
    await page.getByTestId('edit-template-1').click();

    // Modify form
    await page.getByTestId('edit-template-name-input').clear();
    await page.getByTestId('edit-template-name-input').fill('Changed Name');

    // Click Cancel
    await page.getByTestId('cancel-edit-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('edit-template-modal')).not.toBeVisible();

    // Verify template was not changed
    await expect(page.getByText('Welcome Message')).toBeVisible();
    await expect(page.getByText('Changed Name')).not.toBeVisible();
  });

  test('should delete a template with confirmation', async ({ page }) => {
    // Get initial template count
    const initialTemplateCount = await page.getByTestId(/template-card-/).count();

    // Click delete button on template 5 (Escalation Notice)
    await page.getByTestId('delete-template-5').click();

    // Verify delete confirmation modal is displayed
    await expect(page.getByTestId('delete-template-modal')).toBeVisible();
    await expect(page.getByText('Delete Template')).toBeVisible();
    await expect(page.getByText(/Escalation Notice/)).toBeVisible();

    // Click confirm delete
    await page.getByTestId('confirm-delete-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('delete-template-modal')).not.toBeVisible();

    // Verify template is removed from list
    const newTemplateCount = await page.getByTestId(/template-card-/).count();
    expect(newTemplateCount).toBe(initialTemplateCount - 1);
    await expect(page.getByText('Escalation Notice')).not.toBeVisible();
  });

  test('should cancel template deletion', async ({ page }) => {
    // Get initial template count
    const initialTemplateCount = await page.getByTestId(/template-card-/).count();

    // Click delete button
    await page.getByTestId('delete-template-4').click();

    // Click cancel
    await page.getByTestId('cancel-delete-template').click();

    // Verify modal is closed
    await expect(page.getByTestId('delete-template-modal')).not.toBeVisible();

    // Verify template still exists
    const newTemplateCount = await page.getByTestId(/template-card-/).count();
    expect(newTemplateCount).toBe(initialTemplateCount);
    await expect(page.getByText('Policy Reminder')).toBeVisible();
  });

  test('should filter templates based on search input', async ({ page }) => {
    // Search for "Welcome"
    await page.getByTestId('template-search-input').fill('Welcome');

    // Verify only matching templates are shown
    await expect(page.getByText('Welcome Message')).toBeVisible();
    await expect(page.getByText('Issue Resolution')).not.toBeVisible();

    // Search for "bug"
    await page.getByTestId('template-search-input').fill('resolved');

    // Verify only matching templates are shown
    await expect(page.getByText('Issue Resolution')).toBeVisible();
    await expect(page.getByText('Welcome Message')).not.toBeVisible();

    // Clear search
    await page.getByTestId('template-search-input').fill('');

    // Verify all templates are shown again
    await expect(page.getByText('Welcome Message')).toBeVisible();
    await expect(page.getByText('Issue Resolution')).toBeVisible();
  });

  test('should show empty state when no templates match search', async ({ page }) => {
    // Search for non-existent template
    await page.getByTestId('template-search-input').fill('NonExistentTemplate123');

    // Verify empty state is shown
    await expect(page.getByText('No templates found')).toBeVisible();
    await expect(page.getByText('Try a different search term')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back button
    await page.getByTestId('back-to-dashboard').click();

    // Verify navigation to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should show edit and delete buttons on hover', async ({ page }) => {
    const templateCard = page.getByTestId('template-card-1');

    // Buttons should be visible
    const editButton = page.getByTestId('edit-template-1');
    const deleteButton = page.getByTestId('delete-template-1');

    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Hover over the template card
    await templateCard.hover();

    // Buttons should still be visible
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });

  test('should display template placeholders correctly', async ({ page }) => {
    // Check first template - use exact text match for placeholders
    const template1 = page.getByTestId('template-card-1');
    await expect(template1.getByText('{{authorName}}', { exact: true })).toBeVisible();
    await expect(template1.getByText('{{title}}', { exact: true })).toBeVisible();
    await expect(template1.getByText('{{agentName}}', { exact: true })).toBeVisible();
  });

  test('should detect and display placeholders in create modal', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Type content with multiple placeholders
    await page.getByTestId('create-template-content-input').fill(
      'Hi {{username}}, regarding your post {{postId}} in category {{category}}'
    );

    // Verify all placeholders are detected - use exact match and look within the modal
    await expect(page.getByText('{{username}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{postId}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{category}}', { exact: true })).toBeVisible();
  });

  test('should handle template with no placeholders', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Fill in template with name but no placeholders
    await page.getByTestId('create-template-name-input').fill('Simple Greeting');
    await page.getByTestId('create-template-content-input').fill('Hello! Thanks for contacting us.');

    // Verify "No placeholders detected" message
    await expect(page.getByText('No placeholders detected')).toBeVisible();

    // Save template
    await page.getByTestId('save-create-template').click();

    // Verify template is created
    await expect(page.getByText('Simple Greeting')).toBeVisible();

    // Verify template card doesn't show placeholder count
    const templateCard = page.getByText('Simple Greeting').locator('../../..');
    await expect(templateCard).not.toContainText('placeholders');
  });

  test('should allow creating template with all available placeholders', async ({ page }) => {
    // Open create modal
    await page.getByTestId('create-template-button').click();

    // Create template with all placeholders
    await page.getByTestId('create-template-name-input').fill('Full Context Template');
    await page.getByTestId('create-template-content-input').fill(
      'Hi {{authorName}},\n\nRe: {{title}} in {{category}}\n\nFrom: {{agentName}}'
    );

    // Verify all placeholders detected - use exact match
    await expect(page.getByText('{{authorName}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{title}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{category}}', { exact: true })).toBeVisible();
    await expect(page.getByText('{{agentName}}', { exact: true })).toBeVisible();

    // Save template
    await page.getByTestId('save-create-template').click();

    // Verify template created with all placeholders
    await expect(page.getByText('Full Context Template')).toBeVisible();
  });
});
