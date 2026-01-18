import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('Agent Management - Admin View', () => {
  test('Admin can view list of all agents', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login form (demo mode accepts any credentials)
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit login form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });

    // Navigate to settings
    await page.goto(`${BASE_URL}/dashboard/settings`);

    // Click on the Agents tab
    const agentsTab = page.getByTestId('tab-agents');
    await expect(agentsTab).toBeVisible();
    await agentsTab.click();

    // Wait for the agent management section to load
    const agentManagement = page.getByTestId('agent-management');
    await expect(agentManagement).toBeVisible();

    // Verify that agent cards are displayed
    const agentCards = page.getByTestId(/agent-card-/);
    await expect(agentCards.first()).toBeVisible();

    // Verify at least one agent is displayed
    const agentCount = await agentCards.count();
    console.log(`Found ${agentCount} agent cards`);
    expect(agentCount).toBeGreaterThan(0);

    // Verify agent status indicators are visible
    const statusIndicators = page.getByTestId(/agent-status-/);
    await expect(statusIndicators.first()).toBeVisible();

    // Verify agent role badges are visible
    const roleBadges = page.getByTestId(/agent-role-/);
    await expect(roleBadges.first()).toBeVisible();

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/agent-management-view.png' });
  });
});
