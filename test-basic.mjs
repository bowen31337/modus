import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3002...');
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });

  // Take a screenshot
  await page.screenshot({ path: 'test-screenshot-basic.png' });
  console.log('Screenshot saved to test-screenshot-basic.png');

  // Check page content
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  console.log('Page content length:', content.length);

  // Check for errors
  const errors = [];
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }

  await browser.close();
  console.log('Test completed successfully!');
}

main().catch(console.error);
