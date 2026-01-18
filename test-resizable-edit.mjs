#!/usr/bin/env node

/**
 * Test Script for QA PENDING Features
 *
 * 1. Pane dividers are draggable for custom sizing
 * 2. Agent can edit their previously submitted response
 */

import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testResizablePanes(page) {
  console.log('\n=== Test 1: Resizable Panes ===');

  try {
    // Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await sleep(1000);

    // Get initial queue pane width
    console.log('2. Getting initial queue pane dimensions...');
    const queuePane = page.locator('[data-testid="queue-pane"]');
    const initialBox = await queuePane.boundingBox();
    console.log(`   Initial width: ${initialBox.width}px`);

    // Look for resize handles
    console.log('3. Looking for resize handles...');

    // Try different selectors for resize handles
    const handleSelectors = [
      '[data-testid="resizable-handle"]',
      '[role="separator"]',
      '[data-radix-resizable-handle]',
      '.resize-handle'
    ];

    let handle = null;
    for (const selector of handleSelectors) {
      const handles = page.locator(selector);
      const count = await handles.count();
      console.log(`   Found ${count} handles with selector "${selector}"`);

      if (count > 0) {
        handle = handles.nth(1); // Get the second handle (between queue and work panes)
        break;
      }
    }

    if (!handle) {
      console.log('   ❌ FAIL: No resize handles found');
      return false;
    }

    // Get handle position
    console.log('4. Getting handle position...');
    const handleBox = await handle.boundingBox();
    if (!handleBox) {
      console.log('   ❌ FAIL: Could not get handle bounding box');
      return false;
    }

    console.log(`   Handle position: x=${handleBox.x}, y=${handleBox.y}`);
    console.log(`   Handle size: ${handleBox.width}x${handleBox.height}`);

    // Drag the handle
    console.log('5. Dragging handle to the right by 50px...');
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await page.mouse.move(startX, startY, { steps: 10 });
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY, { steps: 10 });
    await page.mouse.up();

    await sleep(1000);

    // Check if size changed
    console.log('6. Checking if queue pane size changed...');
    const newBox = await queuePane.boundingBox();
    console.log(`   New width: ${newBox.width}px`);

    const diff = newBox.width - initialBox.width;
    console.log(`   Width difference: ${diff.toFixed(1)}px`);

    if (Math.abs(diff) > 10) {
      console.log('   ✅ PASS: Pane divider is draggable and size changed');
      return true;
    } else {
      console.log('   ❌ FAIL: Pane size did not change significantly');
      return false;
    }

  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function testEditResponse(page) {
  console.log('\n=== Test 2: Edit Response ===');

  try {
    // Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
    await sleep(1000);

    // Select first post
    console.log('2. Selecting a post...');
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await firstPost.click();
    await sleep(1000);

    // Check for existing responses
    console.log('3. Checking for existing responses...');
    const editButton = page.locator('[data-testid^="edit-response-"]');
    const editCount = await editButton.count();

    console.log(`   Found ${editCount} edit buttons`);

    if (editCount === 0) {
      console.log('   ⚠️  No existing responses found. Creating one...');

      // Create a response first
      console.log('4. Creating a test response...');
      const textarea = page.locator('textarea[placeholder*="Type your response"]');
      await textarea.fill('This is a test response that will be edited.');
      await sleep(500);

      const postButton = page.locator('[data-testid="post-reply-button"]');
      await postButton.click();
      await sleep(1500);

      // Check for edit button again
      const newEditCount = await editButton.count();
      if (newEditCount === 0) {
        console.log('   ❌ FAIL: Could not create test response');
        return false;
      }
      console.log('   ✓ Test response created');
    }

    // Click edit button
    console.log('5. Clicking edit button...');
    const firstEditButton = editButton.first();
    await firstEditButton.click();
    await sleep(500);

    // Check if edit mode is active
    console.log('6. Verifying edit mode is active...');

    // Look for edit input or textarea
    const editInput = page.locator('textarea[placeholder*="Edit your response"]');
    const editInputCount = await editInput.count();

    if (editInputCount === 0) {
      // Try alternative selector
      const altEditInput = page.locator('[data-testid="edit-response-input"]');
      const altCount = await altEditInput.count();

      if (altCount === 0) {
        console.log('   ❌ FAIL: Edit input not found');
        return false;
      }
    }

    console.log('   ✓ Edit mode activated');

    // Update content
    console.log('7. Updating response content...');
    const inputToEdit = editInputCount > 0 ? editInput : page.locator('[data-testid="edit-response-input"]');
    await inputToEdit.fill('This is the edited response content.');
    await sleep(500);

    // Save changes
    console.log('8. Saving changes...');

    // Look for save button
    const saveButton = page.locator('[data-testid="save-edit-button"]');
    const saveCount = await saveButton.count();

    if (saveCount > 0) {
      await saveButton.click();
    } else {
      // Try alternative save button
      const altSave = page.locator('button:has-text("Save"), button:has-text("Update")');
      const altSaveCount = await altSave.count();

      if (altSaveCount === 0) {
        console.log('   ❌ FAIL: No save button found');
        return false;
      }
      await altSave.first().click();
    }

    await sleep(1500);

    // Verify update
    console.log('9. Verifying response was updated...');
    const responseContent = page.locator('[data-testid^="response-content-"]').first();
    const content = await responseContent.textContent();

    if (content && content.includes('edited response')) {
      console.log('   ✅ PASS: Response was successfully edited');
      return true;
    } else {
      console.log('   ❌ FAIL: Response content was not updated');
      console.log(`      Expected: "edited response"`);
      console.log(`      Actual: "${content}"`);
      return false;
    }

  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('QA PENDING Features Test');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
    slowMo: 50
  });

  const page = await browser.newPage();

  try {
    // Test 1: Resizable Panes
    const resizableResult = await testResizablePanes(page);

    // Test 2: Edit Response
    const editResult = await testEditResponse(page);

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Resizable Panes: ${resizableResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Edit Response: ${editResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');

    // Screenshot
    await page.screenshot({ path: 'test-qa-pending.png', fullPage: true });
    console.log('Screenshot saved to test-qa-pending.png');

    await browser.close();

    if (resizableResult && editResult) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
}

main();
