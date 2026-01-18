import { chromium } from '@playwright/test';

async function testCategoriesPage() {
  console.log('🧪 Testing Categories Page Access\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'test-categories-page-1.png' });
    console.log('Screenshot 1 saved\n');

    // Check URL
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Try to access settings directly (might be redirected to login if not authenticated)
    console.log('\nTrying to access settings page...');
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-categories-page-2.png' });
    console.log('Screenshot 2 saved');
    console.log('Current URL after settings navigation:', page.url());

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testCategoriesPage();
