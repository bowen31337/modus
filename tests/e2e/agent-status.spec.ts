import { expect, test } from '@playwright/test';

test.describe('Agent Status Management', () => {
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

    // Wait for the queue to load (indicates dashboard is ready)
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
  });

  test('should display agent status indicator in left rail', async ({ page }) => {
    // Check that status indicator is visible
    const statusTrigger = page.getByTestId('agent-status-trigger');
    await expect(statusTrigger).toBeVisible();

    // Check that status indicator circle is visible
    const statusIndicator = page.getByTestId('status-indicator');
    await expect(statusIndicator).toBeVisible();
  });

  test('should display online status by default with correct color', async ({ page }) => {
    const statusIndicator = page.getByTestId('status-indicator');

    // Check that status has online color (emerald-500)
    await expect(statusIndicator).toHaveClass(/bg-emerald-500/);
  });

  test('should open status dropdown menu when clicked', async ({ page }) => {
    const statusTrigger = page.getByTestId('agent-status-trigger');

    // Click on status trigger
    await statusTrigger.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    // Check that all status options are visible
    await expect(page.getByTestId('status-option-online')).toBeVisible();
    await expect(page.getByTestId('status-option-busy')).toBeVisible();
    await expect(page.getByTestId('status-option-offline')).toBeVisible();
  });

  test('should change status to busy when busy option is clicked', async ({ page }) => {
    const statusTrigger = page.getByTestId('agent-status-trigger');
    const statusIndicator = page.getByTestId('status-indicator');

    // Initial status should be online (emerald)
    await expect(statusIndicator).toHaveClass(/bg-emerald-500/);

    // Click to open dropdown
    await statusTrigger.click();

    // Click on busy option
    await page.getByTestId('status-option-busy').click();

    // Status should change to busy (orange)
    await expect(statusIndicator).toHaveClass(/bg-orange-500/);
  });

  test('should change status to offline when offline option is clicked', async ({ page }) => {
    const statusTrigger = page.getByTestId('agent-status-trigger');
    const statusIndicator = page.getByTestId('status-indicator');

    // Initial status should be online (emerald)
    await expect(statusIndicator).toHaveClass(/bg-emerald-500/);

    // Click to open dropdown
    await statusTrigger.click();

    // Click on offline option
    await page.getByTestId('status-option-offline').click();

    // Status should change to offline (slate)
    await expect(statusIndicator).toHaveClass(/bg-slate-500/);
  });

  test('should display correct status descriptions in dropdown', async ({ page }) => {
    const statusTrigger = page.getByTestId('agent-status-trigger');

    // Open dropdown
    await statusTrigger.click();

    // Check online option
    await expect(page.getByTestId('status-option-online')).toContainText('Online');
    await expect(page.getByTestId('status-option-online')).toContainText(
      'Available for assignments'
    );

    // Check busy option
    await expect(page.getByTestId('status-option-busy')).toContainText('Busy');
    await expect(page.getByTestId('status-option-busy')).toContainText(
      'Not accepting new assignments'
    );

    // Check offline option
    await expect(page.getByTestId('status-option-offline')).toContainText('Offline');
    await expect(page.getByTestId('status-option-offline')).toContainText('Inactive');
  });

  test('should show status indicator in correct position in left rail', async ({ page }) => {
    const statusTrigger = page.getByTestId('agent-status-trigger');
    const leftRail = page.getByTestId('left-rail');

    // Status trigger should be within left rail
    const statusInRail = leftRail.locator('[data-testid="agent-status-trigger"]');
    await expect(statusInRail).toBeVisible();

    // Status should appear after logo and before navigation
    const logo = leftRail.locator('text=m');
    const statusPosition = await statusTrigger.boundingBox();
    const logoPosition = await logo.boundingBox();

    expect(statusPosition).toBeTruthy();
    expect(logoPosition).toBeTruthy();
    expect(statusPosition!.y).toBeGreaterThan(logoPosition!.y!);
  });
});
