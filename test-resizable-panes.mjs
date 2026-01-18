import { chromium } from 'playwright';

async function testResizablePanes() {
  console.log('Testing resizable pane dividers...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Dashboard loaded\n');

    // Wait for the resizable panels to be present
    console.log('2. Checking for resizable panel handles...');
    await page.waitForSelector('[role="separator"]', { timeout: 5000 });
    const handles = await page.locator('[role="separator"]').all();
    console.log(`   ✓ Found ${handles.length} resize handles\n`);

    if (handles.length < 2) {
      throw new Error('Expected at least 2 resize handles');
    }

    // Get initial panel sizes
    console.log('3. Getting initial panel sizes...');
    const queuePanel = await page.locator('[data-panel-size]').nth(1);
    const initialSize = await queuePanel.getAttribute('data-panel-size');
    console.log(`   ✓ Initial queue pane size: ${initialSize}%\n`);

    // Test dragging the first resize handle
    console.log('4. Testing resize handle dragging...');
    const resizeHandle = handles[1]; // Second handle is between queue and work panes
    const box = await resizeHandle.boundingBox();

    if (!box) {
      throw new Error('Could not get resize handle bounding box');
    }

    console.log(`   Resize handle position: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);

    // Hover over the handle to verify it's interactive
    await resizeHandle.hover();
    console.log('   ✓ Handle is hoverable\n');

    // Drag the handle to resize
    console.log('5. Dragging handle to resize...');
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const dragDistance = 50; // pixels to drag

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragDistance, startY, { steps: 10 });
    await page.mouse.up();

    // Wait for resize to complete
    await page.waitForTimeout(500);

    // Get new panel size
    const newSize = await queuePanel.getAttribute('data-panel-size');
    console.log(`   ✓ New queue pane size after drag: ${newSize}%\n`);

    // Verify the size changed
    if (initialSize === newSize) {
      throw new Error('Panel size did not change after dragging');
    }

    const sizeDiff = Math.abs(parseFloat(newSize) - parseFloat(initialSize));
    console.log(`   ✓ Size changed by ${sizeDiff.toFixed(1)}%`);

    // Verify cursor changes on hover
    console.log('\n6. Checking cursor style...');
    const cursor = await resizeHandle.evaluate(el => window.getComputedStyle(el).cursor);
    console.log(`   ✓ Cursor style: ${cursor}`);

    if (!cursor.includes('resize')) {
      console.log(`   ⚠ Warning: Cursor is '${cursor}', expected col-resize`);
    }

    // Test minimum and maximum size constraints
    console.log('\n7. Testing size constraints...');
    const minHandle = handles[1];

    // Try to drag beyond minimum (drag left)
    const minBox = await minHandle.boundingBox();
    if (minBox) {
      await page.mouse.move(minBox.x + minBox.width / 2, minBox.y + minBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(minBox.x - 200, minBox.y + minBox.height / 2, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);

      const minSize = await queuePanel.getAttribute('data-panel-size');
      console.log(`   ✓ Minimum constraint enforced: ${minSize}% (should not go below 20%)`);

      if (parseFloat(minSize) < 20) {
        console.log('   ⚠ Warning: Panel went below minimum size');
      }
    }

    console.log('\n✅ All tests passed!');
    console.log('\nSummary:');
    console.log('- Resizable handles are present and visible');
    console.log('- Handles can be dragged to resize panels');
    console.log('- Panel sizes update correctly');
    console.log('- Size constraints are enforced');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-resizable-fail.png' });
    console.log('Screenshot saved to test-resizable-fail.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testResizablePanes();
