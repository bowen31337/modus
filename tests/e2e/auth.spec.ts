import { test, expect } from '@playwright/test';

test.describe('Authentication - Logout & Protected Routes', () => {
  test('should display logout button in left rail', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for dashboard to load
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Check for logout button
    const logoutButton = page.getByTitle('Logout');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeEnabled();
  });

  test('should redirect to login page when logout button is clicked', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for dashboard to load
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Remove Next.js dev overlay using JavaScript
    await page.evaluate(() => {
      const overlay = document.querySelector('nextjs-portal');
      if (overlay) {
        overlay.remove();
      }
    });

    // Click logout button normally
    await page.getByTitle('Logout').click();

    // Wait for navigation to login page
    await page.waitForURL(/.*login/, { timeout: 10000 });

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow access to dashboard without authentication in demo mode', async ({ page }) => {
    // In demo mode (when Supabase is not configured), authentication is not required
    // Try to access dashboard directly without logging in
    await page.goto('/dashboard');

    // Should NOT redirect to login page in demo mode - should allow access
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should allow access to all sub-routes without authentication in demo mode', async ({ page, context }) => {
    // Clear cookies to ensure no authentication
    await context.clearCookies();

    // In demo mode, all routes should be accessible without authentication
    // Note: /dashboard/queue and /dashboard/assigned redirect to /dashboard (client-side filters)
    // Only /dashboard/settings has its own page with different layout
    const routes = [
      { path: '/dashboard', expectedUrl: /.*dashboard$/, testId: 'queue-pane' },
      { path: '/dashboard/queue', expectedUrl: /.*dashboard$/, testId: 'queue-pane' }, // redirects to /dashboard
      { path: '/dashboard/assigned', expectedUrl: /.*dashboard$/, testId: 'queue-pane' }, // redirects to /dashboard
      { path: '/dashboard/settings', expectedUrl: /.*dashboard\/settings$/, testId: 'settings-page' },
    ];

    for (const { path, expectedUrl, testId } of routes) {
      await page.goto(path);
      // Should NOT redirect to login in demo mode
      await expect(page).toHaveURL(expectedUrl, { timeout: 10000 });
      await expect(page.getByTestId(testId)).toBeVisible();
    }
  });

  test('should allow access to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify three-pane layout is visible
    await expect(page.getByTestId('left-rail')).toBeVisible();
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should show dashboard when accessing login route while already authenticated in demo mode', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to login page
    await page.goto('/login');

    // In demo mode, should redirect to dashboard if already logged in
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should maintain dashboard accessibility after logout and re-login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for dashboard to load
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Remove Next.js dev overlay using JavaScript
    await page.evaluate(() => {
      const overlay = document.querySelector('nextjs-portal');
      if (overlay) {
        overlay.remove();
      }
    });

    // Logout
    await page.getByTitle('Logout').click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);

    // Login again
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify dashboard is accessible again
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });
});
