// Simple test to verify search input is working
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Set up demo session cookie
  await page.context().addCookies([{
    name: 'modus_demo_session',
    value: 'active',
    domain: 'localhost',
    path: '/',
  }];

  await page.goto('http://localhost:3001/dashboard');

  // Wait for queue pane to load
  await page.waitForSelector('[data-testid="queue-pane"]');

  // Get search input
  const searchInput = page.getByTestId('search-input');

  // Type search term
  await searchInput.fill('browser');

  // Wait for filtering
  await page.waitForTimeout(1000);

  // Check filtered results
  const queuePane = page.locator('[data-testid="queue-pane"]');
  const text = await queuePane.textContent();

  console.log('Queue pane text:', text);
  console.log('Contains "Feature request: Dark mode":', text.includes('Feature request: Dark mode'));
  console.log('Contains "Unable to access my account":', text.includes('Unable to access my account'));

  await browser.close();
})();
