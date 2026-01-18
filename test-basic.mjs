import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('Screenshot saved to test-screenshot.png');

  // Check page content
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page content length:', content.length);

  // Check for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }

  await browser.close();
  console.log('Test complete!');
}

main().catch(console.error);
