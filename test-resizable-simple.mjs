import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('Testing resizable panes...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Get queue pane
    const queuePane = page.locator('[data-testid="queue-pane"]');
    const initialBox = await queuePane.boundingBox();
    console.log(`Initial queue pane width: ${initialBox.width}px`);

    // Find handles
    const handles = page.locator('[role="separator"]');
    const handleCount = await handles.count();
    console.log(`Found ${handleCount} resize handles`);

    if (handleCount >= 2) {
      const secondHandle = handles.nth(1);
      const handleBox = await secondHandle.boundingBox();
      console.log(`Second handle at: x=${handleBox.x}`);

      // Check the panel size attribute
      const panelSizeAttr = await queuePane.getAttribute('data-panel-size');
      console.log(`Panel size attribute: ${panelSizeAttr}`);

      // Try to click and drag the handle
      console.log('\nAttempting to drag handle 100px to the right...');
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;

      // Move to handle
      await page.mouse.move(startX, startY);
      await page.waitForTimeout(100);

      // Press mouse button
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Drag
      await page.mouse.move(startX + 100, startY, { steps: 20 });
      await page.waitForTimeout(100);

      // Release
      await page.mouse.up();
      await page.waitForTimeout(1000);

      const newBox = await queuePane.boundingBox();
      const newPanelSizeAttr = await queuePane.getAttribute('data-panel-size');

      console.log(`After drag - queue pane width: ${newBox.width}px`);
      console.log(`After drag - panel size attribute: ${newPanelSizeAttr}`);
      console.log(`Width difference: ${newBox.width - initialBox.width}px`);

      if (Math.abs(newBox.width - initialBox.width) > 10) {
        console.log('\n✅ PASS: Panes are resizable');
      } else {
        console.log('\n❌ FAIL: Panes did not resize');
        console.log('\nNote: The feature may not be fully implemented.');
        console.log('The handles and UI are present, but the resize functionality');
        console.log('may need fixes to the state management or drag handler.');
      }
    } else {
      console.log('Not enough handles found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
