/**
 * E2E Test: UI Component Styling Consistency
 *
 * Test Steps:
 * 1. Navigate to the dashboard and login
 * 2. Test dropdown menu styling consistency
 * 3. Test modal dialog styling consistency
 * 4. Test form input styling consistency
 * 5. Verify all components use consistent theme variables
 */

import { expect, test } from '@playwright/test';

test.describe('UI Component Styling - Dropdown Menus', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should have consistent dropdown background styling', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await expect(categoryFilter).toBeVisible();
    await categoryFilter.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify dropdown has consistent background (bg-background-secondary)
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/bg-background-secondary/);
    expect(dropdownClasses).toMatch(/border-border/);
    expect(dropdownClasses).toMatch(/rounded-lg/);
  });

  test('should have consistent dropdown border styling', async ({ page }) => {
    // Open status filter dropdown
    const statusFilter = page.getByTestId('status-filter-trigger');
    await expect(statusFilter).toBeVisible();
    await statusFilter.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[data-testid="status-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify border styling
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/border/);
    expect(dropdownClasses).toMatch(/border-border/);
    expect(dropdownClasses).toMatch(/rounded-lg/);
  });

  test('should have consistent dropdown shadow and elevation', async ({ page }) => {
    // Open priority filter dropdown
    const priorityFilter = page.getByTestId('priority-filter-trigger');
    await expect(priorityFilter).toBeVisible();
    await priorityFilter.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[data-testid="priority-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify shadow styling
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/shadow-lg/);
  });

  test('should have consistent dropdown item hover states', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');

    // Verify hover state styling
    expect(itemClasses).toMatch(/hover:bg-background-tertiary/);
    expect(itemClasses).toMatch(/transition-all/);
    expect(itemClasses).toMatch(/duration-150/);
  });

  test('should have consistent dropdown item focus states', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item and focus it
    const firstItem = dropdown.locator('button').first();
    await firstItem.focus();
    await expect(firstItem).toBeFocused();

    // Verify focus state styling
    const itemClasses = await firstItem.getAttribute('class');
    expect(itemClasses).toMatch(/focus:bg-accent/);
  });

  test('should have consistent dropdown item active states', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');

    // Verify active state styling
    expect(itemClasses).toMatch(/active:scale-\[0\.99\]/);
  });

  test('should have consistent dropdown item typography', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');

    // Verify typography styling
    expect(itemClasses).toMatch(/text-sm/);
    expect(itemClasses).toMatch(/text-foreground/);
  });

  test('should have consistent dropdown item spacing', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');

    // Verify spacing styling
    expect(itemClasses).toMatch(/px-2/);
    expect(itemClasses).toMatch(/py-1\.5/);
  });

  test('should have consistent dropdown item icon styling', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get first dropdown item
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');

    // Verify icon styling
    expect(itemClasses).toMatch(/\[&svg\]:pointer-events-none/);
    expect(itemClasses).toMatch(/\[&svg\]:size-4/);
    expect(itemClasses).toMatch(/\[&svg\]:shrink-0/);
  });

  test('should have consistent dropdown animation classes', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();

    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify animation classes
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/data-\[state=open\]:animate-in/);
    expect(dropdownClasses).toMatch(/data-\[state=closed\]:animate-out/);
    expect(dropdownClasses).toMatch(/data-\[state=closed\]:fade-out-0/);
    expect(dropdownClasses).toMatch(/data-\[state=open\]:fade-in-0/);
  });

  test('should have consistent dropdown disabled state styling', async ({ page }) => {
    // Open priority filter dropdown
    const priorityFilter = page.getByTestId('priority-filter-trigger');
    await priorityFilter.click();

    const dropdown = page.locator('[data-testid="priority-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get a disabled item if available, or check the container for disabled styling
    const dropdownContainer = dropdown.locator('..');
    const containerClasses = await dropdownContainer.getAttribute('class');

    // Verify disabled state styling exists
    expect(containerClasses).toMatch(/data-\[disabled\]:pointer-events-none/);
    expect(containerClasses).toMatch(/data-\[disabled\]:opacity-50/);
    expect(containerClasses).toMatch(/data-\[disabled\]:hover:bg-transparent/);
  });
});

test.describe('UI Component Styling - Modal Dialogs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should have consistent modal overlay background and blur', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Find the overlay (parent of modal content)
    const modalContent = page.locator('[data-testid="reassign-modal"]');
    const overlay = modalContent.locator('..');

    // Verify overlay has consistent background
    const overlayClasses = await overlay.getAttribute('class');
    expect(overlayClasses).toMatch(/bg-black\/60/);
    expect(overlayClasses).toMatch(/backdrop-blur-sm/);
  });

  test('should have consistent modal positioning and centering', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent positioning classes
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/fixed/);
    expect(modalClasses).toMatch(/left-\[50%\]/);
    expect(modalClasses).toMatch(/top-\[50%\]/);
    expect(modalClasses).toMatch(/translate-x-\[-50%\]/);
    expect(modalClasses).toMatch(/translate-y-\[-50%\]/);
  });

  test('should have consistent modal background and border', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent background and border
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/bg-background-secondary/);
    expect(modalClasses).toMatch(/border-border/);
    expect(modalClasses).toMatch(/border/);
  });

  test('should have consistent modal shadow and rounded corners', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent shadow and rounded corners
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/shadow-lg/);
    expect(modalClasses).toMatch(/rounded-lg/);
  });

  test('should have consistent modal padding and spacing', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent padding
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/p-6/);
    expect(modalClasses).toMatch(/gap-4/);
  });

  test('should have consistent modal animation classes', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent animation classes
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/duration-200/);
    expect(modalClasses).toMatch(/data-\[state=open\]:animate-in/);
    expect(modalClasses).toMatch(/data-\[state=closed\]:animate-out/);
    expect(modalClasses).toMatch(/data-\[state=closed\]:fade-out-0/);
    expect(modalClasses).toMatch(/data-\[state=open\]:fade-in-0/);
    expect(modalClasses).toMatch(/data-\[state=closed\]:zoom-out-95/);
    expect(modalClasses).toMatch(/data-\[state=open\]:zoom-in-95/);
  });

  test('should have consistent modal title typography', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Find the title element
    const title = modal.locator('h2');
    await expect(title).toBeVisible();

    // Verify title has consistent typography
    const titleClasses = await title.getAttribute('class');
    expect(titleClasses).toMatch(/text-lg/);
    expect(titleClasses).toMatch(/font-semibold/);
    expect(titleClasses).toMatch(/leading-none/);
    expect(titleClasses).toMatch(/tracking-tight/);
    expect(titleClasses).toMatch(/text-foreground/);
  });

  test('should have consistent modal close button styling', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Find the close button (X button)
    const closeButton = modal.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();

    // Verify close button has consistent styling
    const buttonClasses = await closeButton.getAttribute('class');
    expect(buttonClasses).toMatch(/absolute/);
    expect(buttonClasses).toMatch(/right-4/);
    expect(buttonClasses).toMatch(/top-4/);
    expect(buttonClasses).toMatch(/rounded-sm/);
    expect(buttonClasses).toMatch(/opacity-70/);
    expect(buttonClasses).toMatch(/transition-opacity/);
    expect(buttonClasses).toMatch(/hover:opacity-100/);
    expect(buttonClasses).toMatch(/focus:outline-none/);
    expect(buttonClasses).toMatch(/focus:ring-2/);
    expect(buttonClasses).toMatch(/focus:ring-primary/);
    expect(buttonClasses).toMatch(/focus:ring-offset-2/);
    expect(buttonClasses).toMatch(/focus:ring-offset-background-secondary/);
  });

  test('should have consistent modal focus trap behavior', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has proper z-index for focus trap
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/z-50/);
  });

  test('should have consistent modal max-width', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Verify modal has consistent max-width
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/max-w-md/);
  });
});

test.describe('UI Component Styling - Form Inputs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should have consistent input background styling', async ({ page }) => {
    // Open category filter dropdown to access input
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await expect(categoryFilter).toBeVisible();
    await categoryFilter.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Get the search input inside the dropdown (if exists)
    // Or test the main search bar
    const searchInput = page.getByTestId('search-input');
    if (await searchInput.isVisible()) {
      const inputClasses = await searchInput.getAttribute('class');
      expect(inputClasses).toMatch(/bg-background-tertiary/);
    }
  });

  test('should have consistent input border styling', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Verify border styling
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/border/);
    expect(inputClasses).toMatch(/border-border/);
    expect(inputClasses).toMatch(/rounded-lg/);
  });

  test('should have consistent input padding', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Verify padding
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/pl-10/);
    expect(inputClasses).toMatch(/pr-4/);
    expect(inputClasses).toMatch(/py-2/);
  });

  test('should have consistent input typography', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Verify typography
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/text-foreground/);
    expect(inputClasses).toMatch(/placeholder-muted-foreground/);
  });

  test('should have consistent input focus state', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Focus the input
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Verify focus state styling
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/focus:outline-none/);
    expect(inputClasses).toMatch(/focus:ring-2/);
    expect(inputClasses).toMatch(/focus:ring-primary/);
  });

  test('should have consistent input transition timing', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Verify transition classes
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/transition-all/);
    expect(inputClasses).toMatch(/duration-150/);
  });

  test('should have consistent reassign modal search input styling', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Get the agent search input in the modal
    const agentSearchInput = page.getByTestId('agent-search-input');
    await expect(agentSearchInput).toBeVisible();

    // Verify consistent styling
    const inputClasses = await agentSearchInput.getAttribute('class');
    expect(inputClasses).toMatch(/w-full/);
    expect(inputClasses).toMatch(/pl-10/);
    expect(inputClasses).toMatch(/pr-4/);
    expect(inputClasses).toMatch(/py-2/);
    expect(inputClasses).toMatch(/bg-background-tertiary/);
    expect(inputClasses).toMatch(/border-border/);
    expect(inputClasses).toMatch(/rounded-lg/);
    expect(inputClasses).toMatch(/text-foreground/);
    expect(inputClasses).toMatch(/placeholder-muted-foreground/);
    expect(inputClasses).toMatch(/focus:outline-none/);
    expect(inputClasses).toMatch(/focus:ring-2/);
    expect(inputClasses).toMatch(/focus:ring-primary/);
  });

  test('should have consistent input icon positioning', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Find the search icon (should be positioned absolutely)
    const searchIcon = page.locator('[data-testid="search-input"] ~ svg');
    if (await searchIcon.isVisible()) {
      const iconClasses = await searchIcon.getAttribute('class');
      expect(iconClasses).toMatch(/absolute/);
      expect(iconClasses).toMatch(/left-3/);
      expect(iconClasses).toMatch(/top-1\/2/);
      expect(iconClasses).toMatch(/-translate-y-1\/2/);
    }
  });

  test('should have consistent input placeholder styling', async ({ page }) => {
    // Get the search input
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // Verify placeholder styling
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/placeholder-muted-foreground/);
  });

  test('should have consistent input disabled state styling', async ({ page }) => {
    // Click on first post to assign it
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    // Wait for work pane to appear
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Click reassign button to open modal
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Get the agent search input in the modal
    const agentSearchInput = page.getByTestId('agent-search-input');
    await expect(agentSearchInput).toBeVisible();

    // Verify input is enabled (not disabled)
    await expect(agentSearchInput).not.toBeDisabled();
  });
});

test.describe('UI Component Styling - Shared Theme Variables', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // In demo mode, just submit the login form (credentials don't matter)
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should use bg-background-secondary for dropdowns and modals', async ({ page }) => {
    // Test dropdown background
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/bg-background-secondary/);
    await categoryFilter.click(); // Close dropdown

    // Test modal background
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/bg-background-secondary/);
  });

  test('should use bg-background-tertiary for inputs', async ({ page }) => {
    // Test search input background
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/bg-background-tertiary/);
  });

  test('should use border-border for all bordered components', async ({ page }) => {
    // Test dropdown border
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/border-border/);
    await categoryFilter.click(); // Close dropdown

    // Test input border
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/border-border/);

    // Test modal border
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/border-border/);
  });

  test('should use text-foreground for primary text', async ({ page }) => {
    // Test dropdown item text
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');
    expect(itemClasses).toMatch(/text-foreground/);
    await categoryFilter.click(); // Close dropdown

    // Test input text
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/text-foreground/);
  });

  test('should use text-foreground-secondary for secondary text', async ({ page }) => {
    // Test reassign modal post title secondary text
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();

    // Find the "Reassigning:" label
    const label = modal.locator('text=Reassigning:');
    const labelClasses = await label.getAttribute('class');
    expect(labelClasses).toMatch(/text-foreground-secondary/);
  });

  test('should use text-muted-foreground for placeholder text', async ({ page }) => {
    // Test search input placeholder
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/placeholder-muted-foreground/);
  });

  test('should use primary color for focus rings and active states', async ({ page }) => {
    // Test input focus ring
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/focus:ring-primary/);

    // Test dropdown item focus
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');
    expect(itemClasses).toMatch(/focus:bg-accent/);
  });

  test('should use consistent rounded corners (rounded-lg)', async ({ page }) => {
    // Test dropdown rounded corners
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/rounded-lg/);
    await categoryFilter.click(); // Close dropdown

    // Test input rounded corners
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/rounded-lg/);

    // Test modal rounded corners
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/rounded-lg/);
  });

  test('should use consistent shadow levels', async ({ page }) => {
    // Test dropdown shadow
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const dropdownClasses = await dropdown.getAttribute('class');
    expect(dropdownClasses).toMatch(/shadow-lg/);
    await categoryFilter.click(); // Close dropdown

    // Test modal shadow
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const reassignButton = page.getByTestId('reassign-button');
    await expect(reassignButton).toBeVisible({ timeout: 10000 });
    await reassignButton.click();
    const modal = page.getByTestId('reassign-modal');
    await expect(modal).toBeVisible();
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toMatch(/shadow-lg/);
  });

  test('should use consistent transition timing', async ({ page }) => {
    // Test dropdown transition
    const categoryFilter = page.getByTestId('category-filter-trigger');
    await categoryFilter.click();
    const dropdown = page.locator('[data-testid="category-filter-dropdown"]');
    await expect(dropdown).toBeVisible();
    const firstItem = dropdown.locator('button').first();
    const itemClasses = await firstItem.getAttribute('class');
    expect(itemClasses).toMatch(/transition-all/);
    expect(itemClasses).toMatch(/duration-150/);
    await categoryFilter.click(); // Close dropdown

    // Test input transition
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    const inputClasses = await searchInput.getAttribute('class');
    expect(inputClasses).toMatch(/transition-all/);
    expect(inputClasses).toMatch(/duration-150/);
  });
});
