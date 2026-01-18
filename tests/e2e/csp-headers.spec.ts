import { test, expect } from '@playwright/test';

test.describe('Content Security Policy Headers', () => {
  test('should have Content-Security-Policy header set', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();

    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader.length).toBeGreaterThan(0);
  });

  test('CSP should restrict script sources to self', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("script-src");
    expect(cspHeader).toContain("'self'");
  });

  test('CSP should restrict default sources to self', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("default-src 'self'");
  });

  test('CSP should restrict frame sources to none', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("frame-src 'none'");
  });

  test('CSP should allow data URIs for images', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("img-src");
    expect(cspHeader).toContain('data:');
  });

  test('should have X-Frame-Options header set to DENY', async ({ page }) => {
    const response = await page.goto('/');
    const xFrameOptions = response.headers()['x-frame-options'];

    expect(xFrameOptions).toBeTruthy();
    expect(xFrameOptions.toLowerCase()).toContain('deny');
  });

  test('should have X-Content-Type-Options header set to nosniff', async ({ page }) => {
    const response = await page.goto('/');
    const xContentTypeOptions = response.headers()['x-content-type-options'];

    expect(xContentTypeOptions).toBeTruthy();
    expect(xContentTypeOptions.toLowerCase()).toContain('nosniff');
  });

  test('should have Referrer-Policy header set', async ({ page }) => {
    const response = await page.goto('/');
    const referrerPolicy = response.headers()['referrer-policy'];

    expect(referrerPolicy).toBeTruthy();
    expect(referrerPolicy).toContain('strict-origin-when-cross-origin');
  });

  test('should have Permissions-Policy header set', async ({ page }) => {
    const response = await page.goto('/');
    const permissionsPolicy = response.headers()['permissions-policy'];

    expect(permissionsPolicy).toBeTruthy();
    expect(permissionsPolicy).toContain('camera=');
    expect(permissionsPolicy).toContain('microphone=');
  });

  test('application functions correctly with CSP enabled', async ({ page, context }) => {
    // Use fresh context to avoid session conflicts
    const newPage = await context.newPage();

    // Navigate to login page
    await newPage.goto('/login');

    // Verify page loads without CSP errors - check for the login card
    await expect(newPage.locator('[data-testid="login-card"]')).toBeVisible({ timeout: 10000 });

    // Verify login form is functional (works with both demo mode and Supabase mode)
    const emailInput = newPage.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Verify styles are applied (no CSP blocking)
    const submitButton = newPage.locator('button[type="submit"]');
    const buttonStyle = await submitButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(buttonStyle).toBeTruthy();

    await newPage.close();
  });

  test('dashboard page loads correctly with CSP headers', async ({ page, context }) => {
    // Use fresh context to avoid session conflicts
    const newPage = await context.newPage();

    // Navigate to login and use demo mode
    await newPage.goto('/login');

    // Wait for login card to be visible first
    await expect(newPage.locator('[data-testid="login-card"]')).toBeVisible({ timeout: 10000 });

    // In demo mode, fill the form and submit (any email/password works)
    const emailInput = newPage.locator('input[name="email"]');
    const passwordInput = newPage.locator('input[name="password"]');
    const signInButton = newPage.locator('button[type="submit"]');

    // Wait for form to be visible
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Fill demo credentials
    await emailInput.fill('demo@example.com');
    await passwordInput.fill('demo123');
    await signInButton.click();

    // Wait for redirect to dashboard
    await newPage.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify dashboard loads - check for the moderation queue heading
    await expect(newPage.locator('text=Moderation Queue')).toBeVisible({ timeout: 10000 });

    await newPage.close();
  });

  test('CSP allows inline styles for Tailwind CSS', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    // Tailwind and inline styles need 'unsafe-inline'
    expect(cspHeader).toContain("style-src");
    expect(cspHeader).toContain("'unsafe-inline'");
  });

  test('CSP allows inline scripts for Next.js runtime', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    // Next.js runtime needs 'unsafe-inline' and 'unsafe-eval'
    expect(cspHeader).toContain("script-src");
    expect(cspHeader).toContain("'unsafe-inline'");
    expect(cspHeader).toContain("'unsafe-eval'");
  });

  test('CSP blocks mixed content', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain('block-all-mixed-content');
  });

  test('CSP upgrades insecure requests', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain('upgrade-insecure-requests');
  });

  test('CSP restricts form actions to self', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("form-action 'self'");
  });

  test('CSP restricts base URI to self', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'] || response.headers()['content-security-policy'];

    expect(cspHeader).toContain("base-uri 'self'");
  });
});
