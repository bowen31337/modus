import { test, expect } from '@playwright/test';

test.describe('AI Suggest Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
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

    // Verify loading state
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

    // Get ghost text content before accepting
    const ghostText = page.locator('[data-testid="ghost-text-overlay"]');
    const ghostContent = await ghostText.textContent();

    // Press Tab to accept suggestion
    await page.keyboard.press('Tab');

    // Wait for ghost text to disappear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 5000 });

    // Verify suggestion was inserted into textarea
    const textarea = page.locator('[data-testid="response-textarea"]');
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe(ghostContent);

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

    // Press Escape to dismiss
    await page.keyboard.press('Escape');

    // Wait for ghost text to disappear
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 5000 });

    // Verify textarea is still empty (or has previous content)
    const textarea = page.locator('[data-testid="response-textarea"]');
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

    // Wait for streaming to complete
    await page.waitForSelector('[data-testid="ghost-text-overlay"]', { state: 'hidden', timeout: 15000 });

    // Button should be enabled again after streaming completes
    await expect(aiButton).toBeEnabled();
  });
});
