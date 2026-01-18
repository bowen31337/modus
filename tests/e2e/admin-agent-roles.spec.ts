import { expect, test } from '@playwright/test';

test.describe('Admin - Agent Role Management', () => {
  test.beforeEach(async ({ page }) => {
    // Just navigate to the base URL to ensure server is running
    // API tests don't need authentication or UI setup
    await page.goto('/');
  });

  test('should allow admin to change agent role via API', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.patch('/api/v1/agents/agent-1', {
      data: { role: 'supervisor' },
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data.role).toBe('supervisor');
    expect(data.message).toBe('Agent role updated successfully');
  });

  test('should validate role enum values', async ({ page }) => {
    // Test with invalid role
    const response = await page.request.patch('/api/v1/agents/agent-1', {
      data: { role: 'invalid_role' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  test('should update agent from agent to admin role', async ({ page }) => {
    // First, get the current agent
    const getResponse = await page.request.get('/api/v1/agents/agent-1');
    const originalData = await getResponse.json();
    expect(originalData.data.role).toBeDefined();

    // Update to admin
    const patchResponse = await page.request.patch('/api/v1/agents/agent-1', {
      data: { role: 'admin' },
    });

    expect(patchResponse.ok()).toBe(true);
    const data = await patchResponse.json();
    expect(data.data.role).toBe('admin');
  });

  test('should update agent from supervisor to moderator role', async ({ page }) => {
    // agent-2 is a supervisor
    const patchResponse = await page.request.patch('/api/v1/agents/agent-2', {
      data: { role: 'moderator' },
    });

    expect(patchResponse.ok()).toBe(true);
    const data = await patchResponse.json();
    expect(data.data.role).toBe('moderator');
  });

  test('should return 404 for non-existent agent', async ({ page }) => {
    const response = await page.request.patch('/api/v1/agents/non-existent-agent', {
      data: { role: 'admin' },
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Agent not found');
  });

  test('should verify role change persists across requests', async ({ page }) => {
    // Change role to supervisor
    await page.request.patch('/api/v1/agents/agent-3', {
      data: { role: 'supervisor' },
    });

    // Verify the change persisted
    const getResponse = await page.request.get('/api/v1/agents/agent-3');
    const data = await getResponse.json();
    expect(data.data.role).toBe('supervisor');
  });

  test('should accept all valid role values', async ({ page }) => {
    const validRoles = ['agent', 'supervisor', 'admin', 'moderator'];

    for (const role of validRoles) {
      const response = await page.request.patch('/api/v1/agents/agent-1', {
        data: { role },
      });

      expect(response.ok()).toBe(
        true,
        `Failed to set role to "${role}". Status: ${response.status()}`
      );
      const data = await response.json();
      expect(data.data.role).toBe(role);
    }
  });
});
