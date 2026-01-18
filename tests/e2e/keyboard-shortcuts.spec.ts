import { expect, test } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
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

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for posts to load
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });
  });

  test.describe('Keyboard Shortcut Tooltips', () => {
    test('should show tooltip on Reassign button with keyboard shortcut', async ({ page }) => {
      // Select the first post
      await page.click('[data-testid^="post-card-"]:first-child');

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]');

      // Wait for "Assign to Me" button first, then click it to assign the post
      await page.waitForSelector('[data-testid="assign-to-me-button"]');
      await page.click('[data-testid="assign-to-me-button"]');

      // Wait for Reassign button to appear
      await page.waitForSelector('[data-testid="reassign-button"]');

      // Hover over the Reassign button
      const reassignButton = page.locator('[data-testid="reassign-button"]');
      await reassignButton.hover();

      // Wait for tooltip to appear
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Verify tooltip contains keyboard shortcut
      await expect(tooltip).toContainText('Cmd+Shift+A');
    });

    test('should show tooltip on Resolve button', async ({ page }) => {
      // Select the first post
      await page.click('[data-testid^="post-card-"]:first-child');

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]');

      // Hover over the Resolve button
      const resolveButton = page.locator('[data-testid="resolve-button"]');
      await resolveButton.hover();

      // Wait for tooltip to appear
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Verify tooltip contains keyboard shortcut reference
      await expect(tooltip).toContainText('Cmd+Enter');
    });

    test('should show tooltip on Assign to Me button', async ({ page }) => {
      // Select the first post
      await page.click('[data-testid^="post-card-"]:first-child');

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]');

      // Hover over the Assign to Me button
      const assignButton = page.locator('[data-testid="assign-to-me-button"]');
      await assignButton.hover();

      // Wait for tooltip to appear
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Verify tooltip contains action description
      await expect(tooltip).toContainText('Assign');
    });

    test('should show tooltip on Release button', async ({ page }) => {
      // Select the first post
      await page.click('[data-testid^="post-card-"]:first-child');

      // Wait for work pane to load
      await page.waitForSelector('[data-testid="work-pane"]');

      // Assign the post first so Release button appears
      await page.click('[data-testid="assign-to-me-button"]');
      await page.waitForSelector('[data-testid="release-button"]');

      // Hover over the Release button
      const releaseButton = page.locator('[data-testid="release-button"]');
      await releaseButton.hover();

      // Wait for tooltip to appear
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Verify tooltip contains action description
      await expect(tooltip).toContainText('Release');
    });
  });

  test('should focus response editor when R key is pressed', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Press R key
    await page.keyboard.press('r');

    // Verify textarea is focused
    const textarea = page.locator('[data-testid="response-textarea"]');
    await expect(textarea).toBeFocused();
  });

  test('should not focus editor when R is pressed while typing in textarea', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Click on textarea and type
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.click();
    await textarea.fill('test');

    // Press R key while in textarea
    await page.keyboard.press('r');

    // Verify that 'r' was typed in the textarea (not intercepted)
    await expect(textarea).toHaveValue('testr');
  });

  test('should not trigger R key shortcut when no post is selected', async ({ page }) => {
    // Don't select any post - just press R
    await page.keyboard.press('r');

    // Verify work pane is still showing "No Post Selected"
    await expect(page.locator('text=No Post Selected')).toBeVisible();
  });

  test('should post response and resolve with Cmd+Enter', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Type a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('This is a test response');

    // Press Cmd+Enter (or Ctrl+Enter on non-Mac)
    await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+Enter`);

    // Verify response appears in activity history
    await page.waitForSelector('[data-testid^="response-"]', { timeout: 5000 });
    await expect(page.locator('text=This is a test response')).toBeVisible();
    await expect(page.locator('text=Activity History')).toBeVisible();

    // Verify the agent name is shown within the response element
    const responseElement = page.locator('[data-testid^="response-"]').filter({
      hasText: 'This is a test response',
    });
    await expect(responseElement.locator('text=Agent A')).toBeVisible();
  });

  test('should not submit with Cmd+Enter when textarea is empty', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Don't type anything - textarea is empty

    // Press Cmd+Enter
    await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+Enter`);

    // Verify no response appears (activity history should not be visible)
    await expect(page.locator('text=Activity History')).not.toBeVisible();
  });

  test('should show keyboard shortcut hint in placeholder', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Verify placeholder contains hint
    const textarea = page.locator('[data-testid="response-textarea"]');
    await expect(textarea).toHaveAttribute('placeholder', /Press R to focus/);
  });

  test('should show Cmd+Enter tip below editor', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Verify tip is visible
    await expect(page.locator('text=Cmd+Enter')).toBeVisible();
    await expect(page.locator('text=to send response and resolve')).toBeVisible();
  });

  test('should work with Ctrl+Enter on Windows/Linux', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Type a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Test with Ctrl+Enter');

    // Press Ctrl+Enter
    await page.keyboard.press('Control+Enter');

    // Verify response appears
    await page.waitForSelector('[data-testid^="response-"]', { timeout: 5000 });
    await expect(page.locator('text=Test with Ctrl+Enter')).toBeVisible();
  });

  test('should maintain focus after sending response with Cmd+Enter', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid^="post-card-"]:first-child');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]');

    // Type a response
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Response with focus test');

    // Press Cmd+Enter
    await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+Enter`);

    // Wait for response to appear
    await page.waitForSelector('[data-testid^="response-"]', { timeout: 5000 });

    // Verify textarea is cleared
    await expect(textarea).toHaveValue('');
  });
});
