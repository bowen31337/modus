import { test, expect } from '@playwright/test';

test.describe('Rich Text Editor - Formatting Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display rich text editor with formatting toolbar', async ({ page }) => {
    // Click on a post to open detail view (use post-card-1 for first post)
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    // Verify rich text editor toolbar is visible
    await expect(page.locator('[data-testid="format-bold-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="format-italic-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="format-link-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="format-bulleted-list-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="format-numbered-list-button"]')).toBeVisible();
  });

  test('should apply bold formatting to selected text', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('This is bold text');
    await textarea.selectText();

    // Click bold button
    await page.locator('[data-testid="format-bold-button"]').click();

    // Verify bold formatting is applied
    await expect(textarea).toHaveValue('**This is bold text**');
  });

  test('should apply italic formatting to selected text', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('This is italic text');
    await textarea.selectText();

    // Click italic button
    await page.locator('[data-testid="format-italic-button"]').click();

    // Verify italic formatting is applied
    await expect(textarea).toHaveValue('*This is italic text*');
  });

  test('should insert link with URL prompt', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('https://example.com');
    });

    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('link text');
    await textarea.selectText();

    // Click link button
    await page.locator('[data-testid="format-link-button"]').click();

    // Verify link formatting is applied
    await expect(textarea).toHaveValue('[link text](https://example.com)');
  });

  test('should create bulleted list from selected text', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Item 1\nItem 2\nItem 3');
    await textarea.selectText();

    // Click bulleted list button
    await page.locator('[data-testid="format-bulleted-list-button"]').click();

    // Verify bulleted list formatting
    const value = await textarea.inputValue();
    expect(value).toContain('- Item 1');
    expect(value).toContain('- Item 2');
    expect(value).toContain('- Item 3');
  });

  test('should create numbered list from selected text', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('First\nSecond\nThird');
    await textarea.selectText();

    // Click numbered list button
    await page.locator('[data-testid="format-numbered-list-button"]').click();

    // Verify numbered list formatting
    const value = await textarea.inputValue();
    expect(value).toContain('1. First');
    expect(value).toContain('2. Second');
    expect(value).toContain('3. Third');
  });

  test('should insert formatting at cursor position without selection', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('Hello world');

    // Move cursor to position 5 (after "Hello")
    await textarea.press('ArrowLeft');
    await textarea.press('ArrowLeft');
    await textarea.press('ArrowLeft');
    await textarea.press('ArrowLeft');
    await textarea.press('ArrowLeft');

    // Click bold button - should insert **bold text** at cursor
    await page.locator('[data-testid="format-bold-button"]').click();

    // Verify the text contains bold formatting
    const value = await textarea.inputValue();
    expect(value).toContain('**bold text**');
  });

  test('should preserve existing text when applying formatting', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.fill('existing text');

    // Click bold button without selection (inserts at cursor)
    await page.locator('[data-testid="format-bold-button"]').click();

    // Verify both existing text and new formatting are present
    const value = await textarea.inputValue();
    expect(value).toContain('existing text');
    expect(value).toContain('**bold text**');
  });

  test('should allow typing in the editor', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await textarea.type('This is a test response');

    await expect(textarea).toHaveValue('This is a test response');
  });

  test('should have placeholder text in editor', async ({ page }) => {
    await page.locator('[data-testid="post-card-1"]').click();
    await page.waitForSelector('[data-testid="work-pane"]');

    const textarea = page.locator('[data-testid="response-textarea"]');
    await expect(textarea).toHaveAttribute('placeholder', /Type your response here/);
  });
});
