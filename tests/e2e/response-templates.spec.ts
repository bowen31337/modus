import { expect, test } from '@playwright/test';

test.describe('Response Templates', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();

    // Select a post to open work pane
    await page.getByTestId('post-card-1').click();
    // Wait a bit for the state to update
    await page.waitForTimeout(500);
    await expect(page.getByTestId('work-pane')).toBeVisible();
  });

  test('should display template trigger button', async ({ page }) => {
    // Verify template button is visible
    const templateButton = page.getByTestId('template-trigger-button');
    await expect(templateButton).toBeVisible();
    await expect(templateButton).toContainText('Templates');
  });

  test('should open template dropdown when clicking template button', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Verify dropdown is visible
    const dropdown = page.getByTestId('template-dropdown');
    await expect(dropdown).toBeVisible();

    // Verify search input is visible
    const searchInput = page.getByTestId('template-search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should display available templates in dropdown', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Verify template list is visible
    const templateList = page.getByTestId('template-list');
    await expect(templateList).toBeVisible();

    // Verify at least one template option is visible
    const firstTemplate = page.getByTestId('template-option-1');
    await expect(firstTemplate).toBeVisible();
    await expect(firstTemplate).toContainText('Welcome Message');
  });

  test('should filter templates based on search input', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    const searchInput = page.getByTestId('template-search-input');
    await searchInput.fill('Welcome');

    // Should only show matching templates
    const welcomeTemplate = page.getByTestId('template-option-1');
    await expect(welcomeTemplate).toBeVisible();

    // Verify non-matching template is hidden
    const issueTemplate = page.getByTestId('template-option-2');
    await expect(issueTemplate).not.toBeVisible();
  });

  test('should insert template content into response editor when selected', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Select the "Welcome Message" template
    const welcomeTemplate = page.getByTestId('template-option-1');
    await welcomeTemplate.click();

    // Verify dropdown is closed
    const dropdown = page.getByTestId('template-dropdown');
    await expect(dropdown).not.toBeVisible();

    // Verify template content is inserted into editor
    const editor = page.getByTestId('response-textarea');
    await expect(editor).toBeVisible();

    // Check that content contains template text
    const editorContent = await editor.inputValue();
    expect(editorContent).toContain('Thank you for reaching out');
  });

  test('should replace placeholders with actual values', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Select the "Welcome Message" template
    const welcomeTemplate = page.getByTestId('template-option-1');
    await welcomeTemplate.click();

    // Verify placeholders are replaced
    const editor = page.getByTestId('response-textarea');
    const editorContent = await editor.inputValue();

    // Should NOT contain raw placeholders
    expect(editorContent).not.toContain('{{authorName}}');
    expect(editorContent).not.toContain('{{title}}');
    expect(editorContent).not.toContain('{{agentName}}');
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Verify dropdown is open
    let dropdown = page.getByTestId('template-dropdown');
    await expect(dropdown).toBeVisible();

    // Click on the post title (outside the dropdown) to close
    await page.getByTestId('post-title').click();

    // Verify dropdown is closed
    dropdown = page.getByTestId('template-dropdown');
    await expect(dropdown).not.toBeVisible();
  });

  test('should close dropdown after selecting a template', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Select a template
    await page.getByTestId('template-option-1').click();

    // Verify dropdown is closed
    const dropdown = page.getByTestId('template-dropdown');
    await expect(dropdown).not.toBeVisible();
  });

  test('should show usage count for each template', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Verify usage count is displayed
    const welcomeTemplate = page.getByTestId('template-option-1');
    await expect(welcomeTemplate).toContainText('uses');
  });

  test('should allow typing after template insertion', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Select a template
    await page.getByTestId('template-option-1').click();

    // Get initial content
    const editor = page.getByTestId('response-textarea');
    const initialContent = await editor.inputValue();

    // Type additional text
    await editor.click();
    await page.keyboard.type(' Additional text');

    // Verify new text is added
    const newContent = await editor.inputValue();
    expect(newContent).toContain('Additional text');
  });

  test('should show template placeholders as tags', async ({ page }) => {
    const templateButton = page.getByTestId('template-trigger-button');
    await templateButton.click();

    // Select a template with placeholders
    const welcomeTemplate = page.getByTestId('template-option-1');
    await expect(welcomeTemplate).toContainText('authorName');
    await expect(welcomeTemplate).toContainText('title');
  });
});
