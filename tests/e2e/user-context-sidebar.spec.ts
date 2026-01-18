/**
 * E2E Test: User Context Sidebar - Clear Information Hierarchy
 * Feature: User context sidebar has clear information hierarchy
 *
 * Test Steps:
 * 1. Navigate to the dashboard and select a post
 * 2. Verify the user context sidebar is visible
 * 3. Verify clear section headers with proper typography
 * 4. Verify visual separation between sections
 * 5. Verify highlighted important information
 * 6. Verify consistent card styling with subtle borders
 */

import { expect, test } from '@playwright/test';

test.describe('User Context Sidebar - Clear Information Hierarchy', () => {
  test.beforeEach(async ({ page, context }) => {
    // Listen for console messages
    page.on('console', (msg) => {
      console.log('Browser console:', msg.type(), msg.text());
    });

    // Set demo session cookie
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for the queue pane to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Select a post to show the user context sidebar
    const firstPost = page.getByRole('button').filter({ hasText: 'Unable to access' }).first();
    await firstPost.click();

    // Wait for the work pane to show the selected post
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('should have a sticky header with clear title and description', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify sticky header exists
    const header = sidebar.locator('div').filter({ hasText: 'User Context' }).first();
    await expect(header).toBeVisible();

    // Verify header has title
    const title = sidebar.locator('h2:has-text("User Context")');
    await expect(title).toBeVisible();

    // Verify header has description
    const description = sidebar.locator('p:has-text("Author information and post metadata")');
    await expect(description).toBeVisible();
  });

  test('should have clear section headers with proper typography', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify all section headers exist with proper styling
    const sectionHeaders = [
      'Author',
      'Analysis',
      'Assignment',
      'Post History',
      'Metadata',
      'Quick Stats',
    ];

    for (const headerText of sectionHeaders) {
      const header = sidebar.locator(`h3:has-text("${headerText}")`);
      await expect(header).toBeVisible();

      // Verify headers have uppercase styling
      const classList = await header.getAttribute('class');
      expect(classList).toContain('uppercase');
    }
  });

  test('should have visually separated sections with consistent card styling', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify Author card has proper styling - look for the container with the avatar and text
    const authorCard = sidebar.locator('div.bg-background-tertiary').first();
    await expect(authorCard).toBeVisible();

    // Verify cards have border and background
    const cardClasses = await authorCard.getAttribute('class');
    expect(cardClasses).toContain('bg-background-tertiary');
    expect(cardClasses).toContain('border');
    expect(cardClasses).toContain('rounded-lg');
  });

  test('should highlight important information (first-time poster)', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Look for first-time poster indicator
    // Note: This depends on the selected post having author.postCount === 0
    const firstTimeIndicator = sidebar.locator('text=First-time poster');
    if (await firstTimeIndicator.isVisible({ timeout: 2000 })) {
      // Verify it has warning styling
      const classes = await firstTimeIndicator.getAttribute('class');
      expect(classes).toContain('bg-yellow-500');
      expect(classes).toContain('text-yellow-400');
      expect(classes).toContain('border');
    }
  });

  test('should have consistent spacing between sections', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify the container has consistent spacing
    // Look for the main content container (not the sticky header)
    const container = sidebar.locator('div.p-4').nth(1);
    const containerClasses = await container.getAttribute('class');
    expect(containerClasses).toContain('space-y-5');
  });

  test('should display author information prominently', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify author avatar is visible
    const authorAvatar = sidebar.locator('div.w-10.h-10.bg-primary\\/20');
    await expect(authorAvatar).toBeVisible();

    // Verify author name is displayed
    const authorName = sidebar.locator('p.text-sm.font-medium');
    await expect(authorName).toBeVisible();

    // Verify "Community Member" label
    const memberLabel = sidebar.locator('p:has-text("Community Member")');
    await expect(memberLabel).toBeVisible();
  });

  test('should display analysis section with sentiment and category', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify Analysis section header
    const analysisHeader = sidebar.locator('h3:has-text("Analysis")');
    await expect(analysisHeader).toBeVisible();

    // Verify sentiment is displayed (should be visible for most posts)
    const sentiment = sidebar.locator('span:has-text("Sentiment")');
    await expect(sentiment.first()).toBeVisible();

    // Verify category is displayed
    const category = sidebar.locator('span:has-text("Technical Support")');
    if (await category.isVisible({ timeout: 2000 })) {
      expect(await category.getAttribute('class')).toContain('text-foreground');
    }
  });

  test('should display assignment status clearly', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify Assignment section header
    const assignmentHeader = sidebar.locator('h3:has-text("Assignment")');
    await expect(assignmentHeader).toBeVisible();

    // Should show "Unassigned" or "Assigned to you"
    const unassigned = sidebar.locator('text=Unassigned');
    const assignedToYou = sidebar.locator('text=Assigned to you');
    const isVisible = await unassigned.isVisible({ timeout: 2000 }).catch(() => false) ||
                      await assignedToYou.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display metadata in key-value format', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify Metadata section header
    const metadataHeader = sidebar.locator('h3:has-text("Metadata")');
    await expect(metadataHeader).toBeVisible();

    // Verify Post ID is displayed
    const postIdLabel = sidebar.locator('span:has-text("Post ID")');
    await expect(postIdLabel).toBeVisible();

    // Verify Created timestamp is displayed
    const createdLabel = sidebar.locator('span:has-text("Created")');
    await expect(createdLabel).toBeVisible();

    // Verify Priority is displayed
    const priorityLabel = sidebar.locator('span:has-text("Priority")');
    await expect(priorityLabel).toBeVisible();
  });

  test('should display quick stats in grid layout', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify Quick Stats section header
    const statsHeader = sidebar.locator('h3:has-text("Quick Stats")');
    await expect(statsHeader).toBeVisible();

    // Verify grid layout with 2 columns
    const gridContainer = sidebar.locator('div.grid.grid-cols-2');
    await expect(gridContainer).toBeVisible();

    // Verify Posts stat
    const postsStat = sidebar.locator('div:has-text("Posts")').first();
    await expect(postsStat).toBeVisible();

    // Verify Status stat
    const statusStat = sidebar.locator('div:has-text("Status")').first();
    await expect(statusStat).toBeVisible();
  });

  test('should have hover effects on interactive cards', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Find the author card (the one with the avatar and user info)
    const authorCard = sidebar.locator('div.bg-background-tertiary').first();

    // Verify hover border transition
    const cardClasses = await authorCard.getAttribute('class');
    expect(cardClasses).toContain('hover:border-border');
    expect(cardClasses).toContain('transition-colors');
  });

  test('should use monospace font for technical IDs', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Find the Post ID value
    const postIdValue = sidebar.locator('span.font-mono').first();
    await expect(postIdValue).toBeVisible();

    // Verify monospace font class
    const fontClasses = await postIdValue.getAttribute('class');
    expect(fontClasses).toContain('font-mono');
  });

  test('should have priority badges with correct color coding', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Find the priority badge
    const priorityBadge = sidebar.locator('span.font-mono').filter({ hasText: /P[1-5]/ });
    await expect(priorityBadge.first()).toBeVisible();

    // Verify it has rounded styling
    const badgeClasses = await priorityBadge.first().getAttribute('class');
    expect(badgeClasses).toContain('rounded');
    expect(badgeClasses).toContain('px-1.5');
    expect(badgeClasses).toContain('py-0.5');
  });

  test('should be scrollable when content overflows', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Verify overflow-y-auto class
    const sidebarClasses = await sidebar.getAttribute('class');
    expect(sidebarClasses).toContain('overflow-y-auto');
  });

  test('should have backdrop blur on sticky header', async ({ page }) => {
    const sidebar = page.getByTestId('user-context-sidebar');

    // Find the sticky header
    const stickyHeader = sidebar.locator('div.bg-background-secondary\\/95');
    await expect(stickyHeader).toBeVisible();

    // Verify backdrop blur
    const headerClasses = await stickyHeader.getAttribute('class');
    expect(headerClasses).toContain('backdrop-blur-sm');
  });
});
