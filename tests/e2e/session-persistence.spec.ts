import { expect, test } from '@playwright/test';

test.describe('Session Persistence', () => {
  test('should persist session across page refresh', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Wait for dashboard to load
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Wait a bit for cookies to be set
    await page.waitForTimeout(1000);

    // Verify session cookie is set (either modus_session or modus_demo_session)
    const cookies = await context.cookies();
    console.log(
      'All cookies:',
      cookies.map((c) => ({ name: c.name, value: c.value?.substring(0, 50) }))
    );
    const sessionCookie = cookies.find(
      (c) => c.name === 'modus_session' || c.name === 'modus_demo_session'
    );
    expect(sessionCookie).toBeDefined();

    // Reload the page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Session cookie should still be present (either one)
    const cookiesAfterReload = await context.cookies();
    const sessionCookieAfterReload = cookiesAfterReload.find(
      (c) => c.name === 'modus_session' || c.name === 'modus_demo_session'
    );
    expect(sessionCookieAfterReload).toBeDefined();
  });

  test('should persist session across browser restart', async ({ browser, context }) => {
    // Login and create session
    const page = await context.newPage();
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for dashboard to load
    await expect(page.getByTestId('queue-pane')).toBeVisible();
    await page.waitForTimeout(1000);

    // Verify session cookie is set (either modus_session or modus_demo_session)
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === 'modus_session' || c.name === 'modus_demo_session'
    );
    expect(sessionCookie).toBeDefined();

    // Save session state
    const storageState = await context.storageState();

    // Close all pages and context
    await page.close();
    await context.close();

    // Create new context with saved storage state
    const newContext = await browser.newContext({
      storageState: storageState,
    });

    // Create new page and navigate to dashboard
    const newPage = await newContext.newPage();
    await newPage.goto('/dashboard');

    // Should be authenticated (not redirected to login)
    await expect(newPage).toHaveURL(/.*dashboard/);
    await expect(newPage.getByTestId('queue-pane')).toBeVisible();

    // Cleanup
    await newPage.close();
    await newContext.close();
  });

  test('should maintain session data integrity across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Check session API to get session data
    const sessionResponse1 = await page.request.get('/api/v1/auth/session');
    expect(sessionResponse1.ok()).toBe(true);
    const sessionData1 = await sessionResponse1.json();

    // Verify session has required fields
    expect(sessionData1.data).toHaveProperty('agent_id');
    expect(sessionData1.data).toHaveProperty('email');
    expect(sessionData1.data).toHaveProperty('display_name');
    expect(sessionData1.data).toHaveProperty('role');
    expect(sessionData1.data).toHaveProperty('expires_at');

    // Store session data for comparison
    const agentId = sessionData1.data.agent_id;
    const email = sessionData1.data.email;
    const displayName = sessionData1.data.display_name;
    const role = sessionData1.data.role;

    // Reload page
    await page.reload();

    // Check session API again
    const sessionResponse2 = await page.request.get('/api/v1/auth/session');
    expect(sessionResponse2.ok()).toBe(true);
    const sessionData2 = await sessionResponse2.json();

    // Session data should be the same
    expect(sessionData2.data.agent_id).toBe(agentId);
    expect(sessionData2.data.email).toBe(email);
    expect(sessionData2.data.display_name).toBe(displayName);
    expect(sessionData2.data.role).toBe(role);
  });

  test('should preserve session across multiple tab navigations', async ({ context }) => {
    // Login in first tab
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.getByLabel('Email').fill('demo@example.com');
    await page1.getByLabel('Password').fill('password123');
    await page1.getByRole('button', { name: 'Sign In' }).click();
    await expect(page1).toHaveURL(/.*dashboard/);

    // Open second tab and navigate to dashboard
    const page2 = await context.newPage();
    await page2.goto('/dashboard');

    // Second tab should be authenticated (shared cookies)
    await expect(page2).toHaveURL(/.*dashboard/);
    await expect(page2.getByTestId('queue-pane')).toBeVisible();

    // Both tabs should have access
    await expect(page1.getByTestId('queue-pane')).toBeVisible();
    await expect(page2.getByTestId('queue-pane')).toBeVisible();

    // Cleanup
    await page1.close();
    await page2.close();
  });

  test('should handle session expiration gracefully', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify session exists
    const sessionResponse1 = await page.request.get('/api/v1/auth/session');
    expect(sessionResponse1.ok()).toBe(true);

    // Delete session cookie to simulate expiration
    await context.clearCookies();

    // Reload page
    await page.reload();

    // In demo mode, should still allow access (demo session fallback)
    // but in production would redirect to login
    await expect(page).toHaveURL(/.*dashboard/);

    // Session API should return demo session or 401
    const sessionResponse2 = await page.request.get('/api/v1/auth/session');
    expect(sessionResponse2.ok() || sessionResponse2.status() === 401).toBe(true);
  });
});
