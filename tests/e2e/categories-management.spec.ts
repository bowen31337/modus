import { test, expect } from '@playwright/test';

test.describe('Categories Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display categories management section', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await expect(categoriesTab).toBeVisible();
    await categoriesTab.click();

    // Wait for tab content to load
    await page.waitForTimeout(500);

    // Check for categories management section
    const categoriesSection = page.getByTestId('categories-management');
    await expect(categoriesSection).toBeVisible();

    // Check for create category button
    const createButton = page.getByTestId('create-category-button');
    await expect(createButton).toBeVisible();
    await expect(createButton).toContainText('Create Category');
  });

  test('should open create category modal', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Click create category button
    const createButton = page.getByTestId('create-category-button');
    await createButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Check for modal
    const modal = page.getByTestId('create-category-modal');
    await expect(modal).toBeVisible();

    // Check for form fields
    const nameField = page.getByTestId('create-category-name');
    const slugField = page.getByTestId('create-category-slug');
    const descField = page.getByTestId('create-category-description');

    await expect(nameField).toBeVisible();
    await expect(slugField).toBeVisible();
    await expect(descField).toBeVisible();

    // Check for color picker
    const colorPicker = page.getByTestId('create-category-color-picker');
    await expect(colorPicker).toBeVisible();

    // Check for icon select
    const iconSelect = page.getByTestId('create-category-icon');
    await expect(iconSelect).toBeVisible();

    // Check for active checkbox
    const activeCheckbox = page.getByTestId('create-category-is-active');
    await expect(activeCheckbox).toBeVisible();

    // Check for save and cancel buttons
    const saveButton = page.getByTestId('save-create-category');
    const cancelButton = page.getByTestId('cancel-create-category');

    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('should auto-generate slug from category name', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Click create category button
    const createButton = page.getByTestId('create-category-button');
    await createButton.click();
    await page.waitForTimeout(500);

    // Fill in name field
    const nameField = page.getByTestId('create-category-name');
    await nameField.fill('Test Category Name');
    await page.waitForTimeout(200);

    // Check if slug was auto-generated
    const slugField = page.getByTestId('create-category-slug');
    const slugValue = await slugField.inputValue();
    expect(slugValue).toBe('test-category-name');
  });

  test('should close create modal when cancel is clicked', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Click create category button
    const createButton = page.getByTestId('create-category-button');
    await createButton.click();
    await page.waitForTimeout(500);

    // Verify modal is open
    const modal = page.getByTestId('create-category-modal');
    await expect(modal).toBeVisible();

    // Click cancel
    const cancelButton = page.getByTestId('cancel-create-category');
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should display existing categories with edit and delete options', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Wait for categories to load
    await page.waitForSelector('[data-testid^="category-card-"]', { timeout: 5000 }).catch(() => {
      // No categories exist yet, which is fine
    });

    // Check if any category cards exist
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const count = await categoryCards.count();

    if (count > 0) {
      // Check first category card
      const firstCard = categoryCards.first();
      await expect(firstCard).toBeVisible();

      // Check for edit and delete buttons (visible on hover)
      const firstCardId = await firstCard.getAttribute('data-testid');
      const editButton = page.getByTestId(`edit-category-${firstCardId?.replace('category-card-', '')}`);
      const deleteButton = page.getByTestId(`delete-category-${firstCardId?.replace('category-card-', '')}`);

      // Hover over the card to show buttons
      await firstCard.hover();
      await page.waitForTimeout(200);

      await expect(editButton).toBeVisible();
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should allow reordering categories with up/down buttons', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Wait for categories to load
    await page.waitForSelector('[data-testid^="category-card-"]', { timeout: 5000 }).catch(() => {
      // No categories exist yet, which is fine
    });

    // Check if at least 2 category cards exist
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const count = await categoryCards.count();

    if (count >= 2) {
      // Get first card
      const firstCard = categoryCards.first();
      const firstCardId = await firstCard.getAttribute('data-testid');

      // Hover to show buttons
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Check for down button (should be visible on first card)
      const downButton = page.getByTestId(`move-down-${firstCardId?.replace('category-card-', '')}`);
      await expect(downButton).toBeVisible();

      // Click down button to move it
      await downButton.click();
      await page.waitForTimeout(500);

      // Verify order changed (card should now be in second position)
      const newFirstCard = categoryCards.first();
      const newFirstCardId = await newFirstCard.getAttribute('data-testid');
      expect(newFirstCardId).not.toBe(firstCardId);
    }
  });

  test('should allow editing existing category', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Wait for categories to load
    await page.waitForSelector('[data-testid^="category-card-"]', { timeout: 5000 }).catch(() => {
      // No categories exist yet, which is fine
    });

    // Check if any category cards exist
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const count = await categoryCards.count();

    if (count > 0) {
      // Get first card
      const firstCard = categoryCards.first();
      const firstCardId = await firstCard.getAttribute('data-testid');

      // Hover to show edit button
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Click edit button
      const editButton = page.getByTestId(`edit-category-${firstCardId?.replace('category-card-', '')}`);
      await editButton.click();
      await page.waitForTimeout(500);

      // Check if edit form is visible
      const nameField = page.getByTestId('edit-category-name');
      await expect(nameField).toBeVisible();

      // Save and cancel buttons should be visible
      const saveButton = page.getByTestId('save-category-edit');
      const cancelButton = page.getByTestId('cancel-category-edit');

      await expect(saveButton).toBeVisible();
      await expect(cancelButton).toBeVisible();

      // Cancel edit
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show delete confirmation modal', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Wait for categories to load
    await page.waitForSelector('[data-testid^="category-card-"]', { timeout: 5000 }).catch(() => {
      // No categories exist yet, which is fine
    });

    // Check if any category cards exist
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const count = await categoryCards.count();

    if (count > 0) {
      // Get first card
      const firstCard = categoryCards.first();
      const firstCardId = await firstCard.getAttribute('data-testid');

      // Hover to show delete button
      await firstCard.hover();
      await page.waitForTimeout(200);

      // Click delete button
      const deleteButton = page.getByTestId(`delete-category-${firstCardId?.replace('category-card-', '')}`);
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Check for delete confirmation modal
      const deleteModal = page.getByTestId('delete-category-modal');
      await expect(deleteModal).toBeVisible();

      // Check for cancel button
      const cancelButton = page.getByTestId('cancel-delete-category');
      await expect(cancelButton).toBeVisible();

      // Close modal
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should switch between tabs and maintain state', async ({ page }) => {
    // Click on categories tab
    const categoriesTab = page.getByTestId('tab-categories');
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Verify categories tab is active
    await expect(categoriesTab).toHaveClass(/font-medium/);

    // Switch to templates tab
    const templatesTab = page.getByTestId('tab-templates');
    await templatesTab.click();
    await page.waitForTimeout(500);

    // Verify templates tab is active
    await expect(templatesTab).toHaveClass(/font-medium/);

    // Switch back to categories
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Verify categories tab is active again
    await expect(categoriesTab).toHaveClass(/font-medium/);

    // Verify categories section is still visible
    const categoriesSection = page.getByTestId('categories-management');
    await expect(categoriesSection).toBeVisible();
  });
});
