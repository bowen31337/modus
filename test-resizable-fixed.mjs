import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('Testing resizable panes (v2)...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Look for panels with data-panel-size attribute
    const panels = page.locator('[data-panel-size]');
    const panelCount = await panels.count();
    console.log(`Found ${panelCount} panels with data-panel-size attribute`);

    if (panelCount < 3) {
      console.log('\n⚠️  Not all panels have data-panel-size set');
      console.log('This means the ResizablePanel useEffect is not running.');
      console.log('\nChecking the HTML structure...');

      // Get the parent of queue pane
      const queuePane = page.locator('[data-testid="queue-pane"]');
      const parent = queuePane.locator('..');
      const parentHtml = await parent.innerHTML();
      console.log('Parent HTML snippet:', parentHtml.substring(0, 200));

      // Check for flex style
      const flexStyle = await parent.getAttribute('style');
      console.log('Parent style attribute:', flexStyle);
    } else {
      console.log('\n✓ All panels have data-panel-size attribute');

      // Get the second panel (queue pane)
      const queuePanel = panels.nth(1);
      const initialSize = await queuePanel.getAttribute('data-panel-size');
      console.log(`\nInitial queue panel size: ${initialSize}%`);

      // Find the resize handle
      const handles = page.locator('[role="separator"]');
      const handleCount = await handles.count();
      console.log(`Found ${handleCount} resize handles`);

      if (handleCount >= 2) {
        const secondHandle = handles.nth(1);
        const handleBox = await secondHandle.boundingBox();
        console.log(`Second handle at: x=${handleBox.x}`);

        // Drag
        console.log('\nDragging handle 100px to the right...');
        const startX = handleBox.x + handleBox.width / 2;
        const startY = handleBox.y + handleBox.height / 2;

        await page.mouse.move(startX, startY);
        await page.waitForTimeout(100);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.move(startX + 100, startY, { steps: 20 });
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(1000);

        // Check new size
        const newSize = await queuePanel.getAttribute('data-panel-size');
        console.log(`After drag - queue panel size: ${newSize}%`);

        const sizeDiff = Math.abs(parseFloat(newSize) - parseFloat(initialSize));
        console.log(`Size difference: ${sizeDiff.toFixed(1)}%`);

        if (sizeDiff > 0) {
          console.log('\n✅ PASS: Panes are resizable');
        } else {
          console.log('\n❌ FAIL: Panes did not resize');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

main();
