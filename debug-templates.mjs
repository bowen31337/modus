import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.fill('input[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);

  // Navigate to settings
  await page.goto('http://localhost:3000/dashboard/settings');
  await page.waitForSelector('[data-testid="settings-page"]');

  // Click Templates tab
  await page.click('[data-testid="tab-templates"]');
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/template-page.png', fullPage: true });

  // Check for elements
  const createButton = await page.querySelector('[data-testid="create-template-button"]');
  const templateCard = await page.querySelector('[data-testid="template-card-1"]');
  const searchInput = await page.querySelector('[data-testid="template-search-input"]');

  console.log('Create Template Button:', createButton ? '✓ Found' : '✗ Not Found');
  console.log('Template Card 1:', templateCard ? '✓ Found' : '✗ Not Found');
  console.log('Search Input:', searchInput ? '✓ Found' : '✗ Not Found');

  // Get all testids on page
  const testIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]');
    return Array.from(elements).map(el => el.getAttribute('data-testid'));
  });

  console.log('\nAll testids on page:');
  testIds.sort().forEach(id => console.log('  -', id));

  await browser.close();
})();
