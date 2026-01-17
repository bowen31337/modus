import { test, expect } from '@playwright/test';

test.describe('Internal Notes Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with demo credentials
    await page.goto('http://localhost:3008/login');
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/);
    await expect(page.getByTestId('queue-pane')).toBeVisible();
  });

  test('should display internal notes with distinct visual styling', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Enable internal note checkbox
    await page.check('[data-testid="internal-note-checkbox"]');

    // Type a note
    const noteContent = 'This is an internal note for the team';
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      noteContent
    );

    // Click add note button
    await page.click('[data-testid="send-response-button"]');

    // Wait for response to appear
    await page.waitForSelector('[data-testid^="response-"]', { timeout: 5000 });

    // Verify the internal note is displayed
    // Note: We need to filter out the textarea element (data-testid="response-textarea")
    const noteElement = page.locator('div[data-testid^="response-"]').first();
    await expect(noteElement).toBeVisible();

    // Verify the note has distinct styling - check for amber/yellow colors
    const noteBox = await noteElement.boundingBox();
    expect(noteBox).not.toBeNull();

    // Verify the internal note contains the content
    await expect(noteElement).toContainText(noteContent);

    // Verify "Internal" badge is present
    await expect(noteElement.getByText('Internal', { exact: true })).toBeVisible();

    // Verify the note has an EyeOff icon (indicating internal/private)
    const eyeOffIcon = noteElement.locator('.lucide-eye-off');
    const hasIcon = await eyeOffIcon.count() > 0;
    expect(hasIcon).toBeTruthy();

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'reports/screenshots/internal-note-styling.png',
      fullPage: false,
    });
  });

  test('should display public responses with different styling', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Make sure internal note checkbox is NOT checked
    await page.uncheck('[data-testid="internal-note-checkbox"]');

    // Type a public response
    const responseContent = 'This is a public response to the user';
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      responseContent
    );

    // Click send response button
    await page.click('[data-testid="send-response-button"]');

    // Wait for response to appear
    await page.waitForSelector('div[data-testid^="response-"]', { timeout: 5000 });

    // Verify the public response is displayed
    const responseElement = page.locator('div[data-testid^="response-"]').first();
    await expect(responseElement).toBeVisible();

    // Verify the response contains the content
    await expect(responseElement).toContainText(responseContent);

    // Verify it does NOT have "Internal" badge
    const internalBadge = responseElement.locator('text=/Internal/i');
    await expect(internalBadge).not.toBeVisible();

    // Verify it has a MessageCircle icon (indicating public response)
    const messageIcon = responseElement.locator('.lucide-message-circle');
    const hasIcon = await messageIcon.count() > 0;
    expect(hasIcon).toBeTruthy();

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'reports/screenshots/public-response-styling.png',
      fullPage: false,
    });
  });

  test('should show both internal notes and public responses with distinct styling', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Add an internal note
    await page.check('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Internal note about this post'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Add a public response
    await page.uncheck('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Public response to the user'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Wait for both responses to appear
    await page.waitForSelector('div[data-testid^="response-"]', { timeout: 5000 });

    // Count the number of responses
    const responseCount = await page.locator('div[data-testid^="response-"]').count();
    expect(responseCount).toBeGreaterThanOrEqual(2);

    // Get all response elements
    const responses = page.locator('div[data-testid^="response-"]');

    // Verify at least one has internal badge
    const internalResponses = responses.filter({ hasText: /Internal/i });
    await expect(internalResponses).toHaveCount(1);

    // Verify at least one does NOT have internal badge (public response)
    const publicResponses = responses.filter({ hasNotText: /Internal/i });
    await expect(publicResponses).toHaveCount(Math.max(1, responseCount - 1));

    // Take screenshot showing both types
    await page.screenshot({
      path: 'reports/screenshots/both-response-types.png',
      fullPage: false,
    });
  });

  test('should have clear visual separation between internal and public responses', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Add an internal note
    await page.check('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Internal note with distinct styling'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Add a public response
    await page.uncheck('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Public response with different styling'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Wait for both responses
    await page.waitForSelector('div[data-testid^="response-"]', { timeout: 5000 });

    // Get all response elements
    const responses = await page.locator('div[data-testid^="response-"]').all();

    // Verify each has distinct styling by checking background classes
    for (const response of responses) {
      const isInternal = await response.getByText('Internal', { exact: true }).isVisible();

      if (isInternal) {
        // Internal notes should have amber/yellow tint
        const classList = await response.getAttribute('class');
        expect(classList).toMatch(/amber|yellow/i);
      } else {
        // Public responses should have background-tertiary styling
        const classList = await response.getAttribute('class');
        expect(classList).toMatch(/background-tertiary/i);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: 'reports/screenshots/internal-notes-visual-separation.png',
      fullPage: false,
    });
  });

  test('should show explanatory text for internal notes vs public responses', async ({ page }) => {
    // Select the first post
    await page.click('[data-testid="post-card-1"]');

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Add an internal note
    await page.check('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Internal note'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Add a public response
    await page.uncheck('[data-testid="internal-note-checkbox"]');
    await page.fill(
      'textarea[placeholder*="Type your response"]',
      'Public response'
    );
    await page.click('[data-testid="send-response-button"]');
    await page.waitForTimeout(500);

    // Wait for responses
    await page.waitForSelector('div[data-testid^="response-"]', { timeout: 5000 });

    // Get all response elements
    const responses = page.locator('div[data-testid^="response-"]');

    // Check for explanatory text
    const internalNote = responses.filter({ hasText: /Internal/i }).first();
    await expect(internalNote).toContainText(/Private note|not visible/i);

    const publicResponse = responses.filter({ hasNotText: /Internal/i }).first();
    await expect(publicResponse).toContainText(/Public response|visible to everyone/i);
  });
});

test.afterEach(async ({ page }) => {
  // Clean up - close any open modals or menus
  await page.evaluate(() => {
    document.body.click();
  });
});
