import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    // Check for the main heading
    await expect(page.getByText('m.')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();

    // Check for email and password inputs
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Check for sign in button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display demo mode message when Supabase is not configured', async ({ page }) => {
    await page.goto('/login');

    // In demo mode (without Supabase configured), should show demo message
    await expect(page.getByText('Demo Mode')).toBeVisible();
  });

  test('should redirect to dashboard after login in demo mode', async ({ page }) => {
    await page.goto('/login');

    // Fill in the form (in demo mode, any credentials work)
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');

    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should redirect to dashboard even with empty form in demo mode', async ({ page }) => {
    await page.goto('/login');

    // In demo mode, the form redirects immediately without validation
    // Click sign in without filling any fields
    await page.getByRole('button', { name: 'Sign In' }).click();

    // In demo mode, it redirects immediately
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should redirect to dashboard even with invalid email in demo mode', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid email format
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('password123');

    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();

    // In demo mode with invalid email, the form redirects to dashboard
    // since demo mode bypasses validation
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
