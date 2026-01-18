import { expect, test } from '@playwright/test';

test.describe('RLS (Row Level Security) Policies', () => {
  test.describe('Admin Role Access', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill('admin@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });
      await expect(page.getByTestId('queue-pane')).toBeVisible({ timeout: 10000 });
    });

    test('should allow admin to view all agents', async ({ page }) => {
      const response = await page.request.get('/api/v1/agents');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should allow admin to update any agent role', async ({ page }) => {
      const response = await page.request.patch('/api/v1/agents/agent-1', {
        data: { role: 'supervisor' },
      });
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data.role).toBe('supervisor');
    });

    test('should allow admin to delete posts', async ({ page }) => {
      // First create a post to delete
      const createResponse = await page.request.post('/api/v1/posts', {
        data: {
          title: 'Test post for deletion',
          body: 'This post will be deleted',
          author_name: 'Test User',
          author_id: 'user-test-123',
        },
      });
      expect(createResponse.ok()).toBe(true);
      const createdPost = await createResponse.json();

      // Now delete it
      const deleteResponse = await page.request.delete(
        `/api/v1/posts/${createdPost.data.id}`
      );
      expect(deleteResponse.ok()).toBe(true);
    });

    test('should allow admin to create priority rules', async ({ page }) => {
      const response = await page.request.post('/api/v1/rules', {
        data: {
          name: 'Test Admin Rule',
          description: 'Rule created by admin',
          conditions: [{ field: 'title', operator: 'contains', value: 'urgent' }],
          action: { type: 'set_priority', value: 'P1' },
          position: 1,
        },
      });
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data.name).toBe('Test Admin Rule');
    });
  });

  test.describe('Agent Role Access (Limited)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as regular agent
      await page.goto('/login');
      await page.getByLabel('Email').fill('agent@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });
      await expect(page.getByTestId('queue-pane')).toBeVisible({ timeout: 10000 });
    });

    test('should allow agent to view all agents', async ({ page }) => {
      const response = await page.request.get('/api/v1/agents');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data).toBeDefined();
    });

    test('should deny agent from updating another agent role', async ({ page }) => {
      const response = await page.request.patch('/api/v1/agents/agent-2', {
        data: { role: 'admin' },
      });
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });

    test('should deny agent from creating priority rules', async ({ page }) => {
      const response = await page.request.post('/api/v1/rules', {
        data: {
          name: 'Test Agent Rule',
          description: 'Rule created by agent (should fail)',
          conditions: [{ field: 'title', operator: 'contains', value: 'test' }],
          action: { type: 'set_priority', value: 'P3' },
          position: 1,
        },
      });
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });

    test('should allow agent to view posts', async ({ page }) => {
      const response = await page.request.get('/api/v1/posts');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should allow agent to create responses', async ({ page }) => {
      const response = await page.request.post('/api/v1/posts/post-1/responses', {
        data: {
          content: 'Test response from agent',
          is_internal_note: false,
        },
      });
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data.content).toContain('Test response');
    });
  });

  test.describe('Role Hierarchy Verification', () => {
    const roles = ['agent', 'moderator', 'supervisor', 'admin'];

    for (const role of roles) {
      test(`should verify ${role} role can access agent-level resources`, async ({ page }) => {
        // Login with the specific role
        await page.goto('/login');
        await page.getByLabel('Email').fill(`${role}@example.com`);
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });

        // Agent-level resources should be accessible to all roles
        const response = await page.request.get('/api/v1/posts');
        expect(response.ok()).toBe(true);
      });
    }
  });

  test.describe('Unauthorized Access Prevention', () => {
    test('should deny access to agents endpoint without authentication', async ({ page }) => {
      const response = await page.request.get('/api/v1/agents');
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });

    test('should deny role update without admin privileges', async ({ page }) => {
      // Login as moderator (not admin)
      await page.goto('/login');
      await page.getByLabel('Email').fill('moderator@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Try to update role (should fail - only admin can do this)
      const response = await page.request.patch('/api/v1/agents/agent-1', {
        data: { role: 'admin' },
      });
      expect(response.status()).toBe(403);
    });
  });

  test.describe('RLS Policy Enforcement on Posts', () => {
    test('should allow supervisor to assign posts to any agent', async ({ page }) => {
      // Login as supervisor
      await page.goto('/login');
      await page.getByLabel('Email').fill('supervisor@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Assign post to another agent (should succeed)
      const response = await page.request.post('/api/v1/posts/post-1/assign', {
        data: { agentId: 'agent-2' },
      });
      expect(response.ok()).toBe(true);
    });

    test('should allow agent to assign unassigned posts to themselves', async ({ page }) => {
      // Login as agent
      await page.goto('/login');
      await page.getByLabel('Email').fill('agent@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Assign unassigned post to self (should succeed)
      const response = await page.request.post('/api/v1/posts/post-2/assign');
      expect(response.ok()).toBe(true);
    });
  });

  test.describe('Audit Log Access Control', () => {
    test('should allow admin to view all audit logs', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill('admin@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      const response = await page.request.get('/api/v1/audit');
      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.data).toBeDefined();
    });

    test('should allow agent to view only their own audit logs', async ({ page }) => {
      // Login as agent
      await page.goto('/login');
      await page.getByLabel('Email').fill('agent@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Agent can view audit logs (filtered by their agent_id on backend)
      const response = await page.request.get('/api/v1/audit');
      expect(response.ok()).toBe(true);
    });
  });
});
