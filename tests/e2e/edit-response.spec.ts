import { test, expect } from '@playwright/test';

test.describe('Edit Response', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the data store to ensure clean state
    await page.goto('http://localhost:3002/api/v1/test/reset', { method: 'POST' });
    await page.waitForTimeout(500);

    // Navigate to dashboard
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Agent can edit their previously submitted response', async ({ page }) => {
    // Step 1: Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();

    expect(postCount).toBeGreaterThan(0);
    console.log(`Found ${postCount} posts`);

    // Step 2: Click on the first post to open it
    await posts.first().click();
    await page.waitForTimeout(500);

    // Step 3: Check if there are any existing responses
    let hasOwnResponse = false;
    const responseElements = page.locator('[data-testid^="response-"]');
    const responseCount = await responseElements.count();

    console.log(`Found ${responseCount} responses`);

    if (responseCount === 0) {
      // Create a test response first
      console.log('Creating a test response...');
      await page.fill('[data-testid="rich-text-editor"] textarea', 'Original response for testing edit functionality');
      await page.waitForTimeout(300);

      // Send the response
      await page.click('[data-testid="send-response-button"]');
      await page.waitForTimeout(1000);

      // Verify response was created
      const newResponseCount = await page.locator('[data-testid^="response-"]').count();
      expect(newResponseCount).toBeGreaterThan(0);
      console.log('Test response created');
    }

    // Step 4: Look for edit button on responses
    // Only own responses should have edit buttons
    const editButtons = page.locator('[data-testid^="edit-response-"]');
    const editButtonCount = await editButtons.count();

    console.log(`Found ${editButtonCount} edit buttons`);

    expect(editButtonCount).toBeGreaterThan(0, 'Should have at least one editable response');

    // Step 5: Click the first edit button
    await editButtons.first().click();
    await page.waitForTimeout(500);

    // Step 6: Verify edit mode is active
    const editMode = page.locator('[data-testid^="response-edit-"]');
    await expect(editMode.first()).toBeVisible();
    console.log('Edit mode activated');

    // Step 7: Edit the content
    const editedContent = 'Updated response content - edited by agent';
    await page.fill('[data-testid="response-edit-"] [data-testid="rich-text-editor"] textarea', editedContent);
    await page.waitForTimeout(300);

    // Step 8: Save the changes
    await page.click('[data-testid="save-edit-button"]');
    await page.waitForTimeout(1000);

    // Step 9: Verify the response was updated
    // Edit mode should be closed
    await expect(editMode.first()).not.toBeVisible();

    // The response should now show the updated content
    const responseContent = page.locator('[data-testid^="response-"]').first();
    await expect(responseContent).toContainText(editedContent);
    console.log('Response updated successfully');

    // Step 10: Verify the timestamp was updated (updated_at should reflect the change)
    // Note: In the UI, we only show created_at, but the API returns updated_at
    // For now, we just verify the content was updated
  });

  test('Edit button only appears for own responses', async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Click on the first post
    await page.locator('[data-testid="post-card"]').first().click();
    await page.waitForTimeout(500);

    // Check responses
    const responses = page.locator('[data-testid^="response-"]');
    const responseCount = await responses.count();

    if (responseCount > 0) {
      // Check each response for edit button
      for (let i = 0; i < responseCount; i++) {
        const response = responses.nth(i);
        const responseText = await response.textContent();

        // Check if it has "You" badge (indicating own response)
        const hasYouBadge = await response.locator('text=You').count() > 0;

        // Check for edit button
        const editButton = response.locator('[data-testid^="edit-response-"]');
        const hasEditButton = await editButton.count() > 0;

        if (hasYouBadge) {
          expect(hasEditButton).toBe(true);
          console.log(`Response ${i + 1}: Own response - has edit button ✓`);
        } else {
          // Non-own responses should not have edit buttons
          expect(hasEditButton).toBe(false);
          console.log(`Response ${i + 1}: Other response - no edit button ✓`);
        }
      }
    } else {
      console.log('No responses found to test edit button visibility');
    }
  });

  test('Can cancel editing without saving changes', async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Click on the first post
    await page.locator('[data-testid="post-card"]').first().click();
    await page.waitForTimeout(500);

    // Look for edit button
    const editButtons = page.locator('[data-testid^="edit-response-"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount === 0) {
      test.skip(true, 'No editable responses found');
      return;
    }

    // Get original content
    const firstResponse = page.locator('[data-testid^="response-"]').first();
    const originalContent = await firstResponse.textContent();

    // Click edit button
    await editButtons.first().click();
    await page.waitForTimeout(500);

    // Verify edit mode is active
    const editMode = page.locator('[data-testid^="response-edit-"]');
    await expect(editMode.first()).toBeVisible();

    // Change the content
    await page.fill('[data-testid="response-edit-"] [data-testid="rich-text-editor"] textarea', 'This change should not be saved');
    await page.waitForTimeout(300);

    // Click cancel
    await page.click('[data-testid="cancel-edit-button"]');
    await page.waitForTimeout(500);

    // Verify edit mode is closed
    await expect(editMode.first()).not.toBeVisible();

    // Verify content is unchanged
    await expect(firstResponse).toContainText(originalContent || '');
    console.log('Edit cancelled successfully - content unchanged');
  });

  test('Cannot save empty response when editing', async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Click on the first post
    await page.locator('[data-testid="post-card"]').first().click();
    await page.waitForTimeout(500);

    // Look for edit button
    const editButtons = page.locator('[data-testid^="edit-response-"]');
    const editButtonCount = await editButtons.count();

    if (editButtonCount === 0) {
      test.skip(true, 'No editable responses found');
      return;
    }

    // Click edit button
    await editButtons.first().click();
    await page.waitForTimeout(500);

    // Clear the content
    await page.fill('[data-testid="response-edit-"] [data-testid="rich-text-editor"] textarea', '');
    await page.waitForTimeout(300);

    // Try to save - button should be disabled
    const saveButton = page.locator('[data-testid="save-edit-button"]');
    await expect(saveButton).toBeDisabled();
    console.log('Save button correctly disabled for empty content');
  });
});
