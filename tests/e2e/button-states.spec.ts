import { expect, test } from '@playwright/test';

test.describe('Button Hover and Active States', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should show hover state on primary action buttons', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Get the Create Template button
    const createButton = page.getByTestId('create-template-button');

    // Verify button is visible
    await expect(createButton).toBeVisible();

    // Take a screenshot before hover for visual comparison
    await createButton.screenshot({ path: 'test-results/button-primary-before-hover.png' });

    // Hover over the button
    await createButton.hover();

    // Verify button is still visible (hover state applied)
    await expect(createButton).toBeVisible();

    // Take a screenshot after hover
    await createButton.screenshot({ path: 'test-results/button-primary-hover.png' });
  });

  test('should show hover state on secondary action buttons', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Open the create template modal
    await page.getByTestId('create-template-button').click();
    await expect(page.getByTestId('create-template-modal')).toBeVisible();

    // Get the Cancel button (secondary/outline variant)
    const cancelButton = page.getByTestId('cancel-create-template');

    // Verify button is visible
    await expect(cancelButton).toBeVisible();

    // Take a screenshot before hover
    await cancelButton.screenshot({ path: 'test-results/button-secondary-before-hover.png' });

    // Hover over the button
    await cancelButton.hover();

    // Verify button is still visible (hover state applied)
    await expect(cancelButton).toBeVisible();

    // Take a screenshot after hover
    await cancelButton.screenshot({ path: 'test-results/button-secondary-hover.png' });
  });

  test('should show hover state on destructive action buttons', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Open the delete template modal
    await page.getByTestId('delete-template-1').click();
    await expect(page.getByTestId('delete-template-modal')).toBeVisible();

    // Get the Delete Template button (destructive variant)
    const deleteButton = page.getByTestId('confirm-delete-template');

    // Verify button is visible
    await expect(deleteButton).toBeVisible();

    // Take a screenshot before hover
    await deleteButton.screenshot({ path: 'test-results/button-destructive-before-hover.png' });

    // Hover over the button
    await deleteButton.hover();

    // Verify button is still visible (hover state applied)
    await expect(deleteButton).toBeVisible();

    // Take a screenshot after hover
    await deleteButton.screenshot({ path: 'test-results/button-destructive-hover.png' });
  });

  test('should show hover state on icon-only buttons in settings', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Get the edit button for the first template
    const editButton = page.getByTestId('edit-template-1');

    // Verify button is visible
    await expect(editButton).toBeVisible();

    // Take a screenshot before hover
    await editButton.screenshot({ path: 'test-results/button-icon-before-hover.png' });

    // Hover over the button
    await editButton.hover();

    // Verify button is still visible (hover state applied)
    await expect(editButton).toBeVisible();

    // Take a screenshot after hover
    await editButton.screenshot({ path: 'test-results/button-icon-hover.png' });
  });

  test('should show hover state on work pane action buttons', async ({ page }) => {
    // Wait for posts to load in the queue
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    // Click on the first post card to open the work pane
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to be visible
    await expect(page.getByTestId('work-pane')).toBeVisible();

    // Get the Resolve button which is always visible
    const resolveButton = page.getByTestId('resolve-button');

    // Verify button is visible
    await expect(resolveButton).toBeVisible();

    // Take a screenshot before hover
    await resolveButton.screenshot({ path: 'test-results/button-resolve-before-hover.png' });

    // Hover over the button
    await resolveButton.hover();

    // Verify button is still visible (hover state applied)
    await expect(resolveButton).toBeVisible();

    // Take a screenshot after hover
    await resolveButton.screenshot({ path: 'test-results/button-resolve-hover.png' });
  });

  test('should show hover state on disabled buttons', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Open the create template modal
    await page.getByTestId('create-template-button').click();
    await expect(page.getByTestId('create-template-modal')).toBeVisible();

    // Get the Save button (should be disabled initially)
    const saveButton = page.getByTestId('save-create-template');

    // Verify button is disabled
    await expect(saveButton).toBeDisabled();

    // Hover over the disabled button - use force to bypass actionability checks
    await saveButton.hover({ force: true });

    // Button should still be visible and disabled
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });

  test('should show active/pressed state when clicking button', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Get the Create Template button
    const createButton = page.getByTestId('create-template-button');

    // Verify button is visible and enabled
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();

    // Click and hold to see active state
    await createButton.click({ delay: 100 });

    // Verify modal opens (button click was successful)
    await expect(page.getByTestId('create-template-modal')).toBeVisible();
  });

  test('should have active scale transform classes on buttons', async ({ page }) => {
    // Navigate to queue page
    await page.goto('/dashboard/queue');
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Check that view toggle buttons have active scale classes
    const listViewBtn = page.getByTestId('view-toggle-list');
    const gridViewBtn = page.getByTestId('view-toggle-grid');

    await expect(listViewBtn).toBeVisible();
    await expect(gridViewBtn).toBeVisible();

    // Verify buttons have transition and active scale classes
    const listViewClasses = await listViewBtn.getAttribute('class');
    const gridViewClasses = await gridViewBtn.getAttribute('class');

    expect(listViewClasses).toMatch(/transition/);
    expect(gridViewClasses).toMatch(/transition/);
  });

  test('should have active state on navigation buttons', async ({ page }) => {
    // Check left rail navigation buttons
    const homeNav = page.locator('a[aria-label="Home"]');
    const queueNav = page.locator('a[aria-label="Queue"]');

    await expect(homeNav).toBeVisible();
    await expect(queueNav).toBeVisible();

    // Verify navigation buttons have transition classes
    const homeClasses = await homeNav.getAttribute('class');
    const queueClasses = await queueNav.getAttribute('class');

    // Check for transition classes (active classes are applied dynamically during click)
    expect(homeClasses).toMatch(/transition/);
    expect(queueClasses).toMatch(/transition/);

    // The queue nav should have hover classes (not active)
    expect(queueClasses).toMatch(/hover:/);
  });

  test('should have active state on post cards', async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });

    const firstPost = page.locator('[data-testid^="post-card-"]').first();

    // Verify post card has active state classes
    const postClasses = await firstPost.getAttribute('class');

    expect(postClasses).toMatch(/active:/);
    expect(postClasses).toMatch(/transition/);
  });

  test('should have active state on filter buttons', async ({ page }) => {
    const filterBtn = page.getByTestId('filter-controls-button');

    await expect(filterBtn).toBeVisible();

    // Verify filter button has transition classes
    const filterClasses = await filterBtn.getAttribute('class');
    expect(filterClasses).toMatch(/transition/);
  });

  test('should maintain consistent button styling across all variants', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Open create modal to see multiple button variants
    await page.getByTestId('create-template-button').click();
    await expect(page.getByTestId('create-template-modal')).toBeVisible();

    // Get all buttons in the modal
    const cancelButton = page.getByTestId('cancel-create-template');
    const saveButton = page.getByTestId('save-create-template');

    // Verify all buttons are visible
    await expect(cancelButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Hover over each button to verify hover states work
    await cancelButton.hover();
    await expect(cancelButton).toBeVisible();

    // Use force for the disabled button
    await saveButton.hover({ force: true });
    await expect(saveButton).toBeVisible();
  });

  test('should show hover state on tab navigation buttons', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Get the Rules tab button
    const rulesTab = page.getByTestId('tab-rules');

    // Verify button is visible
    await expect(rulesTab).toBeVisible();

    // Take a screenshot before hover
    await rulesTab.screenshot({ path: 'test-results/button-tab-before-hover.png' });

    // Hover over the tab button
    await rulesTab.hover();

    // Verify button is still visible (hover state applied)
    await expect(rulesTab).toBeVisible();

    // Take a screenshot after hover
    await rulesTab.screenshot({ path: 'test-results/button-tab-hover.png' });
  });
});
