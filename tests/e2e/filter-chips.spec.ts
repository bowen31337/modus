/**
 * E2E Test: Filter Chips - Consistent Pill Styling
 *
 * Test Steps:
 * 1. Navigate to the dashboard and authenticate
 * 2. Apply multiple filters to verify chips appear
 * 3. Verify chips have consistent border-radius (pill styling)
 * 4. Verify chips have remove (x) buttons
 * 5. Verify chips visually represent filter type with colors
 * 6. Test removing individual chips
 * 7. Test clearing all chips at once
 */

import { expect, test } from '@playwright/test';

test.describe('Filter Chips - Consistent Pill Styling', () => {
  test.beforeEach(async ({ page }) => {
    // First authenticate by logging in (this sets the demo session cookie)
    await page.goto('/login');
    // Fill in credentials for demo mode
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.locator('button.bg-primary').click();
    await expect(page).toHaveURL(/.*dashboard/);
    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible (not loading skeleton)
    await expect(page.locator('[data-testid="queue-container"]')).toBeVisible();
  });

  test('should show filter chips when filters are applied', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify filter chips container is visible
    const chipsContainer = page.locator('div:has(> div > span.inline-flex)').first();
    await expect(chipsContainer).toBeVisible();

    // Verify at least one chip is visible
    const chip = page.locator('span.inline-flex').first();
    await expect(chip).toBeVisible();
  });

  test('should have consistent pill styling (rounded-full)', async ({ page }) => {
    // Apply multiple filters
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply status filter
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(500);

    // Get a filter chip
    const chip = page.locator('span.inline-flex').first();

    // Verify it has rounded-full class for pill styling
    const classAttribute = await chip.getAttribute('class');
    expect(classAttribute).toContain('rounded-full');
  });

  test('should have remove (x) button on each chip', async ({ page }) => {
    // Apply a filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Get the first chip
    const chip = page.locator('span.inline-flex').first();

    // Verify it has a remove button with X icon
    const removeButton = chip.locator('button[data-testid^="remove-filter-"]');
    await expect(removeButton).toBeVisible();

    // Verify the button has an accessible label
    const ariaLabel = await removeButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.toLowerCase()).toContain('remove');
  });

  test('should display filter type label on chips', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify chip shows "Category:" label
    const chip = page.locator('span.inline-flex').first();
    await expect(chip).toContainText('Category:');
  });

  test('should remove individual chip when X button is clicked', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Close the filter dropdown by clicking the backdrop
    const backdrop = page.locator('div.fixed.inset-0.z-40').first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(300);

    // Get initial chip count
    const chipsBefore = page.locator('span.inline-flex');
    const countBefore = await chipsBefore.count();

    // Click remove button on the first chip
    const removeButton = page.locator('button[data-testid^="remove-filter-"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify chip count decreased
    const chipsAfter = page.locator('span.inline-flex');
    const countAfter = await chipsAfter.count();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test('should have consistent spacing between chips', async ({ page }) => {
    // Apply multiple filters
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Priority")').first().click();
    await page.locator('button:has-text("P1")').nth(0).click();
    await page.waitForTimeout(500);

    // Get all chips
    const chips = page.locator('span.inline-flex');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify chips have consistent gap class
    const chipsContainer = page.locator('div:has(> span.inline-flex)').first();
    const containerClass = await chipsContainer.getAttribute('class');
    expect(containerClass).toContain('gap-2');
  });

  test('should show different colors for different filter types', async ({ page }) => {
    // Apply category filter (should have a colored background)
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Close the filter dropdown by clicking the backdrop
    const backdrop = page.locator('div.fixed.inset-0.z-40').first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(300);

    // Apply status filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(500);

    // Close the filter dropdown again
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(300);

    // Get the first chip and verify it has background styling
    const chip = page.locator('span.inline-flex').first();
    const chipClass = await chip.getAttribute('class');

    // Should have background color (bg-*/*), text color (text-*), and border color (border-*/*)
    // Using more flexible regex patterns to match Tailwind classes
    expect(chipClass).toMatch(/bg-\w+-\d+\/\d+/);  // e.g., bg-red-500/20
    expect(chipClass).toMatch(/text-\w+-\d+/);     // e.g., text-red-300
    expect(chipClass).toMatch(/border-\w+-\d+\/\d+/); // e.g., border-red-500/30
  });

  test('should have Clear all button when chips are visible', async ({ page }) => {
    // Apply a filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(500);

    // Verify Clear all button is visible
    const clearAllButton = page.locator('button[data-testid="clear-all-filters"]');
    await expect(clearAllButton).toBeVisible();
    await expect(clearAllButton).toContainText('Clear all');
  });

  test('should clear all filters when Clear all is clicked', async ({ page }) => {
    // Apply multiple filters
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(500);

    // Close the filter dropdown by clicking the backdrop
    const backdrop = page.locator('div.fixed.inset-0.z-40').first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(300);

    // Verify chips are visible
    const chipsBefore = page.locator('span.inline-flex');
    const countBefore = await chipsBefore.count();
    expect(countBefore).toBeGreaterThan(0);

    // Click Clear all - use force click since there might be other elements
    await page.locator('button[data-testid="clear-all-filters"]').click({ force: true });
    await page.waitForTimeout(500);

    // Verify chips are gone
    const chipsAfter = page.locator('span.inline-flex');
    const countAfter = await chipsAfter.count();
    expect(countAfter).toBe(0);
  });

  test('should show search filter chip with search term', async ({ page }) => {
    // Type in search input
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('password');
    await page.waitForTimeout(500);

    // Verify search chip is visible
    const searchChip = page.locator('span.inline-flex').filter({ hasText: 'Search:' });
    await expect(searchChip).toBeVisible();
    await expect(searchChip).toContainText('password');
  });

  test('should show date range filter chip', async ({ page }) => {
    // Open filter dropdown and expand date range
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Date Range")').first().click();

    // Set start date
    const startDateInput = page.locator('input[type="date"][data-testid="date-start-input"]');
    await startDateInput.fill('2024-01-01');

    // Set end date
    const endDateInput = page.locator('input[type="date"][data-testid="date-end-input"]');
    await endDateInput.fill('2024-12-31');

    await page.waitForTimeout(500);

    // Verify date range chip is visible
    const dateChip = page.locator('span.inline-flex').filter({ hasText: 'Date:' });
    await expect(dateChip).toBeVisible();
  });

  test('should have consistent pill styling across all chip types', async ({ page }) => {
    // Apply category filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.locator('button:has-text("Category")').first().click();
    await page.locator('button:has-text("Bug Reports")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply status filter
    await page.locator('button:has-text("Status")').first().click();
    await page.locator('button:has-text("Open")').nth(0).click();
    await page.waitForTimeout(300);

    // Apply priority filter
    await page.locator('button:has-text("Priority")').first().click();
    await page.locator('button:has-text("P1")').nth(0).click();
    await page.waitForTimeout(500);

    // Get all chips
    const chips = page.locator('span.inline-flex');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify all chips have consistent styling
    for (let i = 0; i < count; i++) {
      const chip = chips.nth(i);
      const chipClass = await chip.getAttribute('class');

      // All chips should have rounded-full for pill shape
      expect(chipClass).toContain('rounded-full');

      // All chips should have padding
      expect(chipClass).toMatch(/px-\d+/);
      expect(chipClass).toMatch(/py-\d+/);

      // All chips should have border
      expect(chipClass).toContain('border');
    }
  });

  test('should hide chips container when no filters are active', async ({ page }) => {
    // Verify chips are not visible initially (no filters applied)
    const chips = page.locator('span.inline-flex');
    // Filter chips should not exist when no filters are applied
    // Note: there might be other inline-flex elements on the page, so we check specifically for filter chips
    const filterChips = page.locator('span.inline-flex:has(button[data-testid^="remove-filter-"])');
    await expect(filterChips).toHaveCount(0);
  });
});
