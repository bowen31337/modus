import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Set demo session cookie
  await context.addCookies([
    {
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', (msg) => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });

  // Get page content
  const content = await page.content();
  console.log('Page title:', await page.title());

  // Look for post cards
  const buttons = await page.locator('button').all();
  console.log('Total buttons found:', buttons.length);

  for (const button of buttons) {
    const text = await button.textContent();
    if (text && text.includes('Bug')) {
      console.log('Found bug post button:', text.substring(0, 100));
    }
  }

  // Check for queue pane
  const queuePane = page.getByTestId('queue-pane');
  const isVisible = await queuePane.isVisible();
  console.log('Queue pane visible:', isVisible);

  // Get all buttons in queue pane
  const queueButtons = await queuePane.locator('button').all();
  console.log('Buttons in queue pane:', queueButtons.length);

  for (const button of queueButtons) {
    const text = await button.textContent();
    console.log('Queue button text:', text?.substring(0, 50));
  }

  // Check for post cards specifically
  const postCards = await page.locator('[data-post-id]').all();
  console.log('Post cards with data-post-id:', postCards.length);

  // Check if posts array is empty
  const postsArray = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map((b) => ({
      text: b.textContent?.substring(0, 50),
      hasPostId: b.hasAttribute('data-post-id'),
    }));
  });
  console.log('All buttons on page:', JSON.stringify(postsArray, null, 2));

  await browser.close();
})();
