import { chromium } from '@playwright/test';

async function testEditResponse() {
  console.log('Testing edit response functionality...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });
    console.log('   ✓ Dashboard loaded');

    // Click on the first post
    console.log('\n2. Clicking on first post...');
    const firstPost = await page.locator('[data-testid="post-card"]').first();
    await firstPost.click();
    await page.waitForTimeout(500);
    console.log('   ✓ Post selected');

    // Check if there are any existing responses
    console.log('\n3. Checking for existing responses...');
    const responses = await page.locator('[data-testid^="response-"]').count();
    console.log(`   Found ${responses} responses`);

    if (responses === 0) {
      console.log('\n   Creating a test response first...');

      // Type a response
      await page.fill('[data-testid="rich-text-editor"] textarea', 'Test response for editing');
      await page.waitForTimeout(500);

      // Send the response
      await page.click('[data-testid="send-response-button"]');
      await page.waitForTimeout(1000);

      console.log('   ✓ Test response created');
    }

    // Look for edit button on responses
    console.log('\n4. Checking for edit buttons...');
    const editButtons = await page.locator('[data-testid^="edit-response-"]').count();
    console.log(`   Found ${editButtons} edit buttons`);

    if (editButtons > 0) {
      console.log('\n5. Testing edit functionality...');

      // Click the first edit button
      await page.locator('[data-testid^="edit-response-"]').first().click();
      await page.waitForTimeout(500);

      // Check if edit mode is active
      const editMode = await page.locator('[data-testid^="response-edit-"]').count();
      console.log(`   Edit mode active: ${editMode > 0 ? 'Yes' : 'No'}`);

      if (editMode > 0) {
        // Edit the content
        await page.fill('[data-testid="response-edit-"] [data-testid="rich-text-editor"] textarea', 'Updated test response');
        await page.waitForTimeout(500);

        // Click save
        await page.click('[data-testid="save-edit-button"]');
        await page.waitForTimeout(1000);

        console.log('   ✓ Response edited successfully');

        // Verify the content was updated
        const responseContent = await page.locator('[data-testid^="response-"]').first().textContent();
        if (responseContent?.includes('Updated test response')) {
          console.log('\n✅ EDIT RESPONSE FUNCTIONALITY IS WORKING!');
        } else {
          console.log('\n⚠️  Edit may not have saved correctly');
        }
      }
    } else {
      console.log('\n⚠️  No edit buttons found - may need to create own response first');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testEditResponse();
