import { test, expect } from '@playwright/test';

test.describe('Agent Profile Update', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display profile tab with current agent information', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Wait for profile content to load
    await page.waitForSelector('[data-testid="profile-settings"]');

    // Verify profile information is displayed
    await expect(page.locator('[data-testid="avatar-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-id"]')).toContainText('user-');
    await expect(page.locator('[data-testid="role-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="created-at"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-active"]')).toBeVisible();
  });

  test('should enable edit mode when clicking Edit Profile button', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Verify form inputs are visible
    await expect(page.locator('[data-testid="display-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="avatar-url-input"]')).toBeVisible();

    // Verify buttons changed to Save/Cancel
    await expect(page.locator('[data-testid="save-profile-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-profile-button"]')).toBeVisible();

    // Verify Edit Profile button is hidden
    await expect(page.locator('[data-testid="edit-profile-button"]')).not.toBeVisible();
  });

  test('should cancel edit mode when clicking Cancel button', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter some data
    await page.fill('[data-testid="display-name-input"]', 'Test Agent');

    // Click Cancel button
    await page.click('[data-testid="cancel-profile-button"]');

    // Verify form inputs are hidden
    await expect(page.locator('[data-testid="display-name-input"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="avatar-url-input"]')).not.toBeVisible();

    // Verify Edit Profile button is visible again
    await expect(page.locator('[data-testid="edit-profile-button"]')).toBeVisible();

    // Verify display mode is showing
    await expect(page.locator('[data-testid="display-name-display"]')).toBeVisible();
  });

  test('should show validation error for empty display name', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Clear display name
    await page.fill('[data-testid="display-name-input"]', '');

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="display-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="display-name-error"]')).toContainText(
      'Display name is required'
    );
  });

  test('should show validation error for short display name', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter short display name
    await page.fill('[data-testid="display-name-input"]', 'A');

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="display-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="display-name-error"]')).toContainText(
      'at least 2 characters'
    );
  });

  test('should show validation error for long display name', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter long display name (50 characters is the max allowed by maxLength)
    await page.fill('[data-testid="display-name-input"]', 'A'.repeat(50));

    // Verify character counter shows 50/50
    await expect(page.locator('text=50/50 characters')).toBeVisible();

    // The input has maxLength=50, so we can't actually test the 51 character case
    // This test verifies the maxLength attribute is working
    const input = page.locator('[data-testid="display-name-input"]');
    const maxLength = await input.getAttribute('maxlength');
    expect(maxLength).toBe('50');
  });

  test('should show validation error for invalid avatar URL', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter invalid URL
    await page.fill('[data-testid="avatar-url-input"]', 'not-a-valid-url');

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="avatar-url-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="avatar-url-error"]')).toContainText('valid URL');
  });

  test('should successfully update display name', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter new display name
    const newName = 'Updated Agent Name';
    await page.fill('[data-testid="display-name-input"]', newName);

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Wait for save to complete (button text changes back)
    await page.waitForSelector('[data-testid="edit-profile-button"]', { timeout: 5000 });

    // Verify the display name was updated
    await expect(page.locator('[data-testid="display-name-display"]')).toContainText(newName);

    // Verify success by checking we're back in display mode
    await expect(page.locator('[data-testid="edit-profile-button"]')).toBeVisible();
  });

  test('should successfully update avatar URL', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter valid avatar URL
    const avatarUrl = 'https://example.com/avatar.jpg';
    await page.fill('[data-testid="avatar-url-input"]', avatarUrl);

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Wait for save to complete
    await page.waitForSelector('[data-testid="edit-profile-button"]', { timeout: 5000 });

    // Verify the avatar URL was updated
    await expect(page.locator('[data-testid="avatar-url-display"]')).toContainText(avatarUrl);

    // Verify avatar image is displayed
    await expect(page.locator('[data-testid="avatar-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="avatar-image"]')).toHaveAttribute('src', avatarUrl);
  });

  test('should clear avatar URL when submitting empty string', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Clear avatar URL
    await page.fill('[data-testid="avatar-url-input"]', '');

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Wait for save to complete
    await page.waitForSelector('[data-testid="edit-profile-button"]', { timeout: 5000 });

    // Verify the avatar URL was cleared
    await expect(page.locator('[data-testid="avatar-url-display"]')).toContainText('No avatar set');

    // Verify avatar placeholder is displayed
    await expect(page.locator('[data-testid="avatar-placeholder"]')).toBeVisible();
  });

  test('should update both display name and avatar URL simultaneously', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter new display name and avatar URL
    const newName = 'Complete Update';
    const avatarUrl = 'https://example.com/new-avatar.jpg';

    await page.fill('[data-testid="display-name-input"]', newName);
    await page.fill('[data-testid="avatar-url-input"]', avatarUrl);

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Wait for save to complete
    await page.waitForSelector('[data-testid="edit-profile-button"]', { timeout: 5000 });

    // Verify both fields were updated
    await expect(page.locator('[data-testid="display-name-display"]')).toContainText(newName);
    await expect(page.locator('[data-testid="avatar-url-display"]')).toContainText(avatarUrl);
    await expect(page.locator('[data-testid="avatar-image"]')).toHaveAttribute('src', avatarUrl);
  });

  test('should display character counter for display name', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter a display name
    const testName = 'Test Agent';
    await page.fill('[data-testid="display-name-input"]', testName);

    // Verify character counter is displayed
    const counterText = `${testName.length}/50 characters`;
    await expect(page.locator('text=' + counterText)).toBeVisible();
  });

  test('should show account information in read-only format', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Verify account information section
    await expect(page.locator('[data-testid="agent-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="created-at"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-active"]')).toBeVisible();

    // Verify agent ID is in monospace font
    await expect(page.locator('[data-testid="agent-id"]')).toHaveClass(/font-mono/);
  });

  test('should display role badge with correct styling', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Verify role badge is visible
    const roleBadge = page.locator('[data-testid="role-badge"]');
    await expect(roleBadge).toBeVisible();

    // Verify role badge contains Shield icon
    await expect(roleBadge.locator('svg')).toBeVisible();

    // Verify role badge has a role text
    await expect(roleBadge).toContainText(/Agent|Supervisor|Admin|Moderator/);
  });

  test('should prevent editing while saving is in progress', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Enter new display name
    await page.fill('[data-testid="display-name-input"]', 'Test Agent');

    // Click Save button
    await page.click('[data-testid="save-profile-button"]');

    // Verify button shows "Saving..." and is disabled
    const saveButton = page.locator('[data-testid="save-profile-button"]');
    await expect(saveButton).toContainText('Saving...');
    await expect(saveButton).toBeDisabled();
  });

  test('should maintain form state when canceling edit', async ({ page }) => {
    // Click on Profile tab
    await page.click('[data-testid="tab-profile"]');

    // Get original display name
    const originalName = await page.locator('[data-testid="display-name-display"]').textContent();

    // Click Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // Change display name
    await page.fill('[data-testid="display-name-input"]', 'Changed Name');

    // Click Cancel button
    await page.click('[data-testid="cancel-profile-button"]');

    // Verify display name reverted to original
    await expect(page.locator('[data-testid="display-name-display"]')).toContainText(
      originalName || ''
    );
  });
});
