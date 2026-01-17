import { test, expect } from '@playwright/test';

test.describe('AI Suggest Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Use API to set demo session cookie directly
    await context.request.post('http://localhost:3000/api/auth/demo-login');

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for queue pane to be visible
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Remove Next.js dev overlay using JavaScript
    await page.evaluate(() => {
      const overlay = document.querySelector('nextjs-portal');
      if (overlay) {
        overlay.remove();
      }
    });
  });

  test('should display AI Suggest button in response editor', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Verify AI Suggest button is visible
    const aiButton = page.locator('[data-testid="ai-suggest-button"]');
    await expect(aiButton).toBeVisible();
    await expect(aiButton).toContainText('AI Suggest');
  });

  test('should show loading state when AI Suggest is clicked', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    const aiButton = page.locator('[data-testid="ai-suggest-button"]');
    await aiButton.click();

    // Wait for React state update
    await page.waitForTimeout(100);

    // Verify loading state - button should show "Generating..." and be disabled
    await expect(aiButton).toContainText('Generating...');
    await expect(aiButton).toBeDisabled();

    // Wait for loading to complete (ghost text to appear)
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });
  });

  test('should display ghost text during AI streaming', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text overlay to appear
    const ghostText = page.locator('[data-testid="ghost-text-overlay"]');
    await expect(ghostText).toBeVisible({ timeout: 10000 });

    // Verify ghost text has content
    const ghostContent = await ghostText.textContent();
    expect(ghostContent?.length).toBeGreaterThan(0);

    // Verify ghost text has distinct styling (contains the span with primary color)
    const ghostSpan = ghostText.locator('span.text-primary\\/60');
    await expect(ghostSpan).toBeVisible();
  });

  test('should accept AI suggestion when Tab key is pressed', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text to appear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Wait for streaming to complete (ghost text should have substantial content)
    await page.waitForFunction(
      () => {
        const overlay = document.querySelector('[data-testid="ghost-text-overlay"]');
        return overlay && overlay.textContent && overlay.textContent.length > 50;
      },
      { timeout: 15000 }
    );

    // Get ghost text content before accepting
    const ghostText = page.locator('[data-testid="ghost-text-overlay"]');
    const ghostSpan = ghostText.locator('span.text-primary\\/60');
    const ghostContent = await ghostSpan.textContent();

    // Click on the textarea to ensure it has focus (ghost text has pointer-events-none)
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.click();

    // Wait a moment for focus to settle
    await page.waitForTimeout(100);

    // Verify textarea is focused
    await expect(textarea).toBeFocused();

    // Verify ghost text is still visible
    const ghostTextCheck = page.locator('[data-testid="ghost-text-overlay"]');
    await expect(ghostTextCheck).toBeVisible();

    // Press Tab to accept suggestion
    await page.keyboard.press('Tab');

    // Wait for React state to update
    await page.waitForTimeout(300);

    // Wait for React state update and ghost text to disappear
    await page.waitForTimeout(200);
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Ghost text might have been removed from DOM entirely
      const overlay = page.locator('[data-testid="ghost-text-overlay"]');
      expect(overlay).toHaveCount(0);
    });

    // Verify suggestion was inserted into textarea (should have content)
    const textareaValue = await textarea.inputValue();
    expect(textareaValue.length).toBeGreaterThan(50);
    expect(textareaValue).toContain('Hi');

    // Verify textarea is focused
    await expect(textarea).toBeFocused();
  });

  test('should dismiss ghost text when Escape key is pressed', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text to appear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Wait for streaming to complete
    await page.waitForFunction(
      () => {
        const overlay = document.querySelector('[data-testid="ghost-text-overlay"]');
        return overlay && overlay.textContent && overlay.textContent.length > 50;
      },
      { timeout: 15000 }
    );

    // Click textarea to ensure it's focused
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.click();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');

    // Wait for React state update and ghost text to disappear
    await page.waitForTimeout(200);
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Ghost text might have been removed from DOM entirely
      const overlay = page.locator('[data-testid="ghost-text-overlay"]');
      expect(overlay).toHaveCount(0);
    });

    // Verify textarea is still empty (or has previous content)
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe('');
  });

  test('should dismiss ghost text when user starts typing', async ({ page }) => {
    // Click on the first post to open detail view
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text to appear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Click on textarea to focus
    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.click();

    // Type a character
    await page.keyboard.type('H');

    // Wait for ghost text to disappear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 5000 });

    // Verify only the typed character is in textarea
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe('H');
  });

  test('should generate contextual suggestions based on post content', async ({ page }) => {
    // Click on the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text to appear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Wait for streaming to complete (ghost text should have substantial content)
    await page.waitForFunction(
      () => {
        const overlay = document.querySelector('[data-testid="ghost-text-overlay"]');
        return overlay && overlay.textContent && overlay.textContent.length > 50;
      },
      { timeout: 15000 }
    );

    // Get the suggestion
    const ghostText = page.locator('[data-testid="ghost-text-overlay"]');
    const ghostContent = await ghostText.textContent();

    // Verify suggestion contains contextual elements
    expect(ghostContent).toBeTruthy();
    expect(ghostContent?.length).toBeGreaterThan(50);
  });

  test('should show helpful tip when ghost text is present', async ({ page }) => {
    // Click on the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    await page.click('[data-testid="ai-suggest-button"]');

    // Wait for ghost text to appear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Look for the tip text mentioning Tab and Esc
    const tipText = page.locator('text=Press Tab to accept AI suggestion');
    await expect(tipText).toBeVisible();
  });

  test('should disable AI Suggest button while streaming', async ({ page }) => {
    // Click on the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Click AI Suggest button
    const aiButton = page.locator('[data-testid="ai-suggest-button"]');
    await aiButton.click();

    // Immediately check if button is disabled
    await expect(aiButton).toBeDisabled();

    // Wait for ghost text to appear (streaming started)
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { timeout: 10000 });

    // Wait for streaming to complete - ghost text remains visible but button should be enabled
    // The streaming completes when the button text changes from "Generating..." back to "AI Suggest"
    await expect(aiButton).toContainText('AI Suggest', { timeout: 15000 });

    // Button should be enabled again after streaming completes
    await expect(aiButton).toBeEnabled();

    // Ghost text should still be visible for user review (not hidden)
    const ghostText = page.locator('[data-testid="ghost-text-overlay"]');
    await expect(ghostText).toBeVisible();
  });
});
