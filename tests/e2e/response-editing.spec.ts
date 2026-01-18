import { expect, test } from '@playwright/test';

test.describe('Response Editing', () => {
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

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });
  });

  test('should show edit and delete buttons for own responses', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Test response for editing');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Verify the response appears
    const responseElement = page
      .locator('[data-testid^="response-"]')
      .filter({
        hasText: 'Test response for editing',
      })
      .first();
    await expect(responseElement).toBeVisible();

    // Verify edit button is visible for own response
    const editButton = responseElement.locator('[data-testid^="edit-response-"]');
    await expect(editButton).toBeVisible();

    // Verify delete button is visible for own response
    const deleteButton = responseElement.locator('[data-testid^="delete-response-"]');
    await expect(deleteButton).toBeVisible();

    // Verify "You" badge is shown for own response
    await expect(responseElement.locator('text=You')).toBeVisible();
  });

  test('should open edit mode when clicking edit button', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Original response text');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    const editButton = page.locator('[data-testid^="edit-response-"]').first();
    await editButton.click();

    // Verify edit mode is shown
    await expect(page.locator('text=Edit Response')).toBeVisible();

    // Verify edit textarea contains original text
    const editTextarea = page.locator('[data-testid="response-textarea"]').nth(1);
    await expect(editTextarea).toHaveValue('Original response text');

    // Verify Save Changes button is visible
    await expect(page.locator('[data-testid="save-edit-button"]')).toBeVisible();

    // Verify Cancel button is visible
    await expect(page.locator('[data-testid="cancel-edit-button"]')).toBeVisible();
  });

  test('should cancel edit mode when clicking Cancel', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response to cancel');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Verify edit mode is shown
    await expect(page.locator('text=Edit Response')).toBeVisible();

    // Click Cancel
    await page.click('[data-testid="cancel-edit-button"]');

    // Verify edit mode is closed and original response is visible
    await expect(page.locator('text=Edit Response')).not.toBeVisible();
    await expect(page.locator('text=Response to cancel')).toBeVisible();
  });

  test('should save edited response', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Original content');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Edit the content
    const editTextarea = page.locator('[data-testid="response-textarea"]').nth(1);
    await editTextarea.fill('Updated content after edit');

    // Click Save Changes
    await page.click('[data-testid="save-edit-button"]');

    // Wait for edit mode to close
    await expect(page.locator('text=Edit Response')).not.toBeVisible();

    // Verify updated content is visible
    await expect(page.locator('text=Updated content after edit')).toBeVisible();

    // Verify original content is no longer visible
    await expect(page.locator('text=Original content')).not.toBeVisible();
  });

  test('should toggle internal note checkbox in edit mode', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a public response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Public response');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Verify internal note checkbox is unchecked initially
    await expect(page.locator('[data-testid="edit-internal-note-checkbox"]')).not.toBeChecked();

    // Check the internal note checkbox
    await page.check('[data-testid="edit-internal-note-checkbox"]');

    // Verify checkbox is checked
    await expect(page.locator('[data-testid="edit-internal-note-checkbox"]')).toBeChecked();

    // Save the edit
    await page.click('[data-testid="save-edit-button"]');

    // Wait for edit mode to close
    await expect(page.locator('text=Edit Response')).not.toBeVisible();

    // Verify the response now has Internal badge
    const responseElement = page
      .locator('[data-testid^="response-"]')
      .filter({
        hasText: 'Public response',
      })
      .first();
    await expect(responseElement.locator('text=Internal')).toBeVisible();
  });

  test('should delete response when clicking delete button', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response to delete');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Verify response is visible
    await expect(page.locator('text=Response to delete')).toBeVisible();

    // Click delete button
    await page.locator('[data-testid^="delete-response-"]').first().click();

    // Verify confirmation dialog appears
    await expect(page.locator('[data-testid="delete-response-dialog"]')).toBeVisible();
    await expect(page.locator('text=Delete Response')).toBeVisible();

    // Click confirm delete button
    await page.click('[data-testid="confirm-delete-button"]');

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify response is no longer visible
    await expect(page.locator('text=Response to delete')).not.toBeVisible();
  });

  test('should cancel delete when clicking Cancel in confirmation dialog', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response to not delete');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Verify response is visible
    await expect(page.locator('text=Response to not delete')).toBeVisible();

    // Click delete button
    await page.locator('[data-testid^="delete-response-"]').first().click();

    // Verify confirmation dialog appears
    await expect(page.locator('[data-testid="delete-response-dialog"]')).toBeVisible();

    // Click cancel button
    await page.click('[data-testid="cancel-delete-button"]');

    // Verify confirmation dialog is closed
    await expect(page.locator('[data-testid="delete-response-dialog"]')).not.toBeVisible();

    // Verify response is still visible
    await expect(page.locator('text=Response to not delete')).toBeVisible();
  });

  test('should show loading state when saving edit', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response for loading test');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Edit the content
    const editTextarea = page.locator('[data-testid="response-textarea"]').nth(1);
    await editTextarea.fill('Updated content');

    // Click Save Changes and verify loading state appears briefly
    const saveButton = page.locator('[data-testid="save-edit-button"]');
    await saveButton.click();

    // The loading state should appear (spinner + "Saving..." text)
    // We can't always catch it due to fast execution, but we can verify the button is disabled during save
    await expect(saveButton).toBeDisabled();

    // Wait for save to complete
    await page.waitForTimeout(500);

    // Verify edit mode is closed
    await expect(page.locator('text=Edit Response')).not.toBeVisible();
  });

  test('should show loading state when deleting response', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response to delete with loading');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click delete button
    const deleteButton = page.locator('[data-testid^="delete-response-"]').first();
    await deleteButton.click();

    // Verify confirmation dialog appears
    await expect(page.locator('[data-testid="delete-response-dialog"]')).toBeVisible();

    // Click confirm delete button
    const confirmButton = page.locator('[data-testid="confirm-delete-button"]');
    await confirmButton.click();

    // The confirm button should be disabled during deletion
    await expect(confirmButton).toBeDisabled();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify response is no longer visible
    await expect(page.locator('text=Response to delete with loading')).not.toBeVisible();
  });

  test('should disable save button when edit content is empty', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response to clear');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Clear the content
    const editTextarea = page.locator('[data-testid="response-textarea"]').nth(1);
    await editTextarea.clear();

    // Verify save button is disabled
    const saveButton = page.locator('[data-testid="save-edit-button"]');
    await expect(saveButton).toBeDisabled();
  });

  test('should preserve edit content when toggling internal note checkbox', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Send a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response content');
    await page.click('[data-testid="send-response-button"]');

    // Wait for activity history
    await page.waitForSelector('text=Activity History', { timeout: 5000 });

    // Click edit button
    await page.locator('[data-testid^="edit-response-"]').first().click();

    // Verify content is loaded
    const editTextarea = page.locator('[data-testid="response-textarea"]').nth(1);
    await expect(editTextarea).toHaveValue('Response content');

    // Toggle internal note checkbox
    await page.check('[data-testid="edit-internal-note-checkbox"]');

    // Verify content is preserved
    await expect(editTextarea).toHaveValue('Response content');

    // Uncheck and verify content is still preserved
    await page.uncheck('[data-testid="edit-internal-note-checkbox"]');
    await expect(editTextarea).toHaveValue('Response content');
  });
});
