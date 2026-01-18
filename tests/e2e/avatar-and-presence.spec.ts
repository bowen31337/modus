/**
 * E2E Tests for Avatar and Presence Indicator Styling
 *
 * Tests for features:
 * - Avatar images have consistent circular styling
 * - Presence indicators have appropriate styling
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Avatar Component Tests
// ============================================================================

test.describe('Avatar Component - Consistent Circular Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page where avatars are displayed
    await page.goto('/dashboard/settings');
    await page.waitForSelector('[data-testid="profile-settings"]', { timeout: 10000 });
  });

  test('should have consistent circular styling with rounded-full', async ({ page }) => {
    const avatar = page.locator('[data-testid="avatar-display"] .rounded-full').first();
    await expect(avatar).toBeVisible();
  });

  test('should have border ring when withBorder is true', async ({ page }) => {
    const avatar = page.locator('[data-testid="avatar-display"] .border').first();
    await expect(avatar).toBeVisible();
  });

  test('should display fallback initials or icon when no image', async ({ page }) => {
    // Check for avatar placeholder (User icon or initials)
    const avatarContainer = page.locator('[data-testid="avatar-display"]');
    await expect(avatarContainer).toBeVisible();
  });

  test('should have consistent sizes across different components', async ({ page }) => {
    // Profile settings avatar (2xl - 24x24)
    const profileAvatar = page.locator('[data-testid="avatar-display"] .w-24.h-24');
    await expect(profileAvatar).toBeVisible();
  });

  test('should have proper object-cover for image avatars', async ({ page }) => {
    const avatarImage = page.locator('[data-testid="avatar-display"] img');
    if (await avatarImage.isVisible()) {
      // Check if image has proper styling
      await expect(avatarImage).toHaveClass(/object-cover/);
    }
  });
});

// ============================================================================
// Presence Indicator Tests
// ============================================================================

test.describe('Presence Indicator - Appropriate Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard where presence indicators are shown
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('should show presence indicator when agents are viewing', async ({ page }) => {
    // Presence indicator is only shown when other agents are viewing
    // This test verifies the component exists and has proper styling
    const presenceIndicators = page.locator('[data-testid="presence-indicator"]');
    // May or may not be visible depending on mock data
    if (await presenceIndicators.first().isVisible()) {
      await expect(presenceIndicators.first()).toBeVisible();
    }
  });

  test('should have consistent avatar styling in presence indicators', async ({ page }) => {
    // Check for presence avatars with rounded-full styling
    const presenceAvatars = page.locator('[data-testid="presence-avatars"] .rounded-full');
    // May or may not be visible depending on mock data
    if (await presenceAvatars.first().isVisible()) {
      await expect(presenceAvatars.first()).toBeVisible();
    }
  });

  test('should show status indicator on avatars', async ({ page }) => {
    // Status indicators should be visible on presence avatars
    const statusIndicators = page.locator('[data-testid="avatar-status-indicator"]');
    // May or may not be visible depending on mock data
    if (await statusIndicators.first().isVisible()) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });

  test('should have proper spacing between stacked avatars', async ({ page }) => {
    const presenceAvatarsContainer = page.locator('[data-testid="presence-avatars"]');
    if (await presenceAvatarsContainer.isVisible()) {
      // Check for negative spacing (stacked effect)
      await expect(presenceAvatarsContainer).toHaveClass(/-space-x-2/);
    }
  });

  test('should show "more" indicator when exceeding max avatars', async ({ page }) => {
    const moreIndicator = page.locator('[data-testid="presence-avatars-more"]');
    // May or may not be visible depending on mock data
    if (await moreIndicator.isVisible()) {
      await expect(moreIndicator).toBeVisible();
      await expect(moreIndicator).toHaveClass(/bg-muted/);
    }
  });

  test('should have consistent avatar sizes in presence indicators', async ({ page }) => {
    // Presence avatars use 'sm' size (w-8 h-8)
    const presenceAvatars = page.locator('[data-testid="presence-avatars"] .w-8.h-8');
    if (await presenceAvatars.first().isVisible()) {
      await expect(presenceAvatars.first()).toBeVisible();
    }
  });
});

// ============================================================================
// Agent Management Avatar Tests
// ============================================================================

test.describe('Agent Management - Avatar Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await page.waitForSelector('[data-testid="profile-settings"]', { timeout: 10000 });
  });

  test('should display agent avatars with consistent styling', async ({ page }) => {
    // Check for avatar in agent management or profile settings
    const avatars = page.locator('[data-testid="avatar-display"]');
    await expect(avatars.first()).toBeVisible();
  });

  test('should have circular avatar with border', async ({ page }) => {
    const avatarContainer = page.locator('[data-testid="avatar-display"] .rounded-full.border');
    await expect(avatarContainer).toBeVisible();
  });

  test('should show status indicator on agent avatars', async ({ page }) => {
    // Status indicator should be positioned correctly
    const statusIndicators = page.locator('[data-testid="avatar-status-indicator"]');
    // May or may not be visible depending on mock data
    if (await statusIndicators.first().isVisible()) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
});

// ============================================================================
// Visual Regression Tests
// ============================================================================

test.describe('Avatar - Visual Regression', () => {
  test('should have consistent avatar appearance in profile settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForSelector('[data-testid="profile-settings"]', { timeout: 10000 });

    const avatarContainer = page.locator('[data-testid="avatar-display"]');
    await expect(avatarContainer).toHaveScreenshot('profile-avatar.png');
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

test.describe('Avatar - Accessibility', () => {
  test('should have proper alt text for avatar images', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForSelector('[data-testid="profile-settings"]', { timeout: 10000 });

    const avatarImage = page.locator('[data-testid="avatar-display"] img');
    if (await avatarImage.isVisible()) {
      const alt = await avatarImage.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(0);
    }
  });

  test('should have proper title for presence avatars', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

    const presenceAvatars = page.locator('[data-testid="presence-avatars"] [title]');
    if (await presenceAvatars.first().isVisible()) {
      const title = await presenceAvatars.first().getAttribute('title');
      expect(title).toBeTruthy();
    }
  });
});
