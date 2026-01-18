import { test, expect } from '@playwright/test';

test.describe('Agent Management - Admin Role Change', () => {
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

    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await page.waitForSelector('[data-testid="settings-page"]', { timeout: 10000 });
  });

  test('should display Agents tab in navigation', async ({ page }) => {
    // Click on Agents tab
    await page.click('[data-testid="tab-agents"]');

    // Wait for agent management to load
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify agents tab is active
    const agentsTab = page.locator('[data-testid="tab-agents"]');
    await expect(agentsTab).toHaveClass(/bg-background-tertiary/);
  });

  test('should display all agents with their roles', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify 4 agent cards are displayed
    const agentCards = page.locator('[data-testid^="agent-card-"]');
    await expect(agentCards).toHaveCount(4);

    // Verify agent-1 has admin role
    const agent1Role = page.locator('[data-testid="agent-role-agent-1"]');
    await expect(agent1Role).toContainText('Admin');

    // Verify agent-2 has supervisor role
    const agent2Role = page.locator('[data-testid="agent-role-agent-2"]');
    await expect(agent2Role).toContainText('Supervisor');

    // Verify agent-3 has agent role
    const agent3Role = page.locator('[data-testid="agent-role-agent-3"]');
    await expect(agent3Role).toContainText('Agent');

    // Verify agent-4 has moderator role
    const agent4Role = page.locator('[data-testid="agent-role-agent-4"]');
    await expect(agent4Role).toContainText('Moderator');
  });

  test('should display role legend with all four roles', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify role legend is visible
    const legendText = await page.textContent('[data-testid="agent-management"]');
    expect(legendText).toContain('Roles & Permissions');
    expect(legendText).toContain('Admin');
    expect(legendText).toContain('Supervisor');
    expect(legendText).toContain('Moderator');
    expect(legendText).toContain('Agent');
  });

  test('should expand agent card to show details', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Click expand button on agent-2
    await page.click('[data-testid="expand-agent-agent-2"]');

    // Wait for details to appear
    await page.waitForSelector('[data-testid="agent-details-agent-2"]', { timeout: 5000 });

    // Verify account information is displayed
    const details = page.locator('[data-testid="agent-details-agent-2"]');
    await expect(details).toBeVisible();
    await expect(details).toContainText('agent-2');
    await expect(details).toContainText('user-agent-2');
  });

  test('should show role change editor when clicking Change Role button', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Expand agent card
    await page.click('[data-testid="expand-agent-agent-3"]');

    // Wait for details to appear
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });

    // Click Change Role button
    await page.click('[data-testid="edit-role-agent-3"]');

    // Verify role editor appears
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });
    const roleEditor = page.locator('[data-testid="role-editor-agent-3"]');
    await expect(roleEditor).toBeVisible();
    await expect(roleEditor).toContainText('Change Role for Agent C');
  });

  test('should display all four role options in editor', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Expand agent card and click Change Role
    await page.click('[data-testid="expand-agent-agent-3"]');
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-3"]');
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });

    // Verify all four role buttons are present
    await expect(page.locator('[data-testid="role-option-agent-agent-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-option-supervisor-agent-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-option-admin-agent-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-option-moderator-agent-3"]')).toBeVisible();
  });

  test('should disable the current role option', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Expand agent-3 (current role: agent)
    await page.click('[data-testid="expand-agent-agent-3"]');
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-3"]');
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });

    // Verify the "agent" role button is disabled
    const agentButton = page.locator('[data-testid="role-option-agent-agent-3"]');
    await expect(agentButton).toBeDisabled();
  });

  test('should change agent role from agent to supervisor', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify initial role is Agent
    const agent3Role = page.locator('[data-testid="agent-role-agent-3"]');
    await expect(agent3Role).toContainText('Agent');

    // Expand agent-3 and click Change Role
    await page.click('[data-testid="expand-agent-agent-3"]');
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-3"]');
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });

    // Click Supervisor role button
    await page.click('[data-testid="role-option-supervisor-agent-3"]');

    // Wait for role to update
    await page.waitForTimeout(1000);

    // Verify role changed to Supervisor
    await expect(agent3Role).toContainText('Supervisor');

    // Verify role editor is closed
    await expect(page.locator('[data-testid="role-editor-agent-3"]')).not.toBeVisible();
  });

  test('should change agent role from supervisor to admin', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify initial role is Supervisor
    const agent2Role = page.locator('[data-testid="agent-role-agent-2"]');
    await expect(agent2Role).toContainText('Supervisor');

    // Expand agent-2 and click Change Role
    await page.click('[data-testid="expand-agent-agent-2"]');
    await page.waitForSelector('[data-testid="agent-details-agent-2"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-2"]');
    await page.waitForSelector('[data-testid="role-editor-agent-2"]', { timeout: 5000 });

    // Click Admin role button
    await page.click('[data-testid="role-option-admin-agent-2"]');

    // Wait for role to update
    await page.waitForTimeout(1000);

    // Verify role changed to Admin
    await expect(agent2Role).toContainText('Admin');
  });

  test('should change agent role from moderator to agent', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify initial role is Moderator
    const agent4Role = page.locator('[data-testid="agent-role-agent-4"]');
    await expect(agent4Role).toContainText('Moderator');

    // Expand agent-4 and click Change Role
    await page.click('[data-testid="expand-agent-agent-4"]');
    await page.waitForSelector('[data-testid="agent-details-agent-4"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-4"]');
    await page.waitForSelector('[data-testid="role-editor-agent-4"]', { timeout: 5000 });

    // Click Agent role button
    await page.click('[data-testid="role-option-agent-agent-4"]');

    // Wait for role to update
    await page.waitForTimeout(1000);

    // Verify role changed to Agent
    await expect(agent4Role).toContainText('Agent');
  });

  test('should cancel role change when clicking Cancel button', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Expand agent-3 and click Change Role
    await page.click('[data-testid="expand-agent-agent-3"]');
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-3"]');
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });

    // Verify role editor is visible
    await expect(page.locator('[data-testid="role-editor-agent-3"]')).toBeVisible();

    // Click Cancel button
    await page.click('[data-testid="cancel-role-change-agent-3"]');

    // Verify role editor is closed
    await expect(page.locator('[data-testid="role-editor-agent-3"]')).not.toBeVisible();

    // Verify role remains unchanged
    const agent3Role = page.locator('[data-testid="agent-role-agent-3"]');
    await expect(agent3Role).toContainText('Agent');
  });

  test('should collapse agent card when clicking expand button again', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Expand agent card
    await page.click('[data-testid="expand-agent-agent-2"]');
    await page.waitForSelector('[data-testid="agent-details-agent-2"]', { timeout: 5000 });

    // Verify details are visible
    await expect(page.locator('[data-testid="agent-details-agent-2"]')).toBeVisible();

    // Click expand button again to collapse
    await page.click('[data-testid="expand-agent-agent-2"]');

    // Verify details are hidden
    await expect(page.locator('[data-testid="agent-details-agent-2"]')).not.toBeVisible();
  });

  test('should display correct status indicators for each agent', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // All agents should have status indicators
    const statusIndicators = page.locator('[data-testid^="agent-status-"]');
    await expect(statusIndicators).toHaveCount(4);
  });

  test('should display agent display names and user IDs', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify agent names are displayed
    const agentManagement = page.locator('[data-testid="agent-management"]');
    await expect(agentManagement).toContainText('Agent A');
    await expect(agentManagement).toContainText('Agent B');
    await expect(agentManagement).toContainText('Agent C');
    await expect(agentManagement).toContainText('Agent D');

    // Expand agent card to see user IDs
    await page.click('[data-testid="expand-agent-agent-1"]');
    await page.waitForSelector('[data-testid="agent-details-agent-1"]', { timeout: 5000 });

    const details = page.locator('[data-testid="agent-details-agent-1"]');
    await expect(details).toContainText('user-agent-1');
  });

  test('should persist role changes after page refresh', async ({ page }) => {
    // Navigate to Agents tab
    await page.click('[data-testid="tab-agents"]');
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Change agent-3 role to supervisor
    await page.click('[data-testid="expand-agent-agent-3"]');
    await page.waitForSelector('[data-testid="agent-details-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="edit-role-agent-3"]');
    await page.waitForSelector('[data-testid="role-editor-agent-3"]', { timeout: 5000 });
    await page.click('[data-testid="role-option-supervisor-agent-3"]');
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="agent-management"]', { timeout: 10000 });

    // Verify role is still Supervisor
    const agent3Role = page.locator('[data-testid="agent-role-agent-3"]');
    await expect(agent3Role).toContainText('Supervisor');
  });
});

test.describe('Agent Management - API Endpoints', () => {
  test('should update agent role via PATCH API', async ({ request }) => {
    // Update agent-3 role to admin
    const response = await request.patch('/api/v1/agents/agent-3', {
      data: {
        role: 'admin',
      },
    });

    // Verify successful response
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.data.role).toBe('admin');
    expect(result.message).toBe('Agent role updated successfully');
  });

  test('should validate role enum values', async ({ request }) => {
    // Try invalid role
    const response = await request.patch('/api/v1/agents/agent-1', {
      data: {
        role: 'invalid_role',
      },
    });

    // Should return validation error
    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent agent', async ({ request }) => {
    // Try updating non-existent agent
    const response = await request.patch('/api/v1/agents/non-existent', {
      data: {
        role: 'admin',
      },
    });

    expect(response.status()).toBe(404);

    const result = await response.json();
    expect(result.error).toBe('Agent not found');
  });

  test('should allow all four valid role values', async ({ request }) => {
    const roles = ['agent', 'supervisor', 'admin', 'moderator'];

    for (const role of roles) {
      const response = await request.patch('/api/v1/agents/agent-2', {
        data: { role },
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.data.role).toBe(role);
    }
  });
});
