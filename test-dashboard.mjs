import { chromium } from '@playwright/test';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error' && !text.includes('Failed to load resource')) {
      errors.push(text);
    }
  });

  page.on('pageerror', (error) => {
    console.log('Page error:', error.message);
    errors.push(error.message);
  });

  console.log('=== Testing Dashboard with Login ===\n');

  // Step 1: Navigate to login page
  console.log('Step 1: Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  // Step 2: Check for demo mode indicator
  const demoModeIndicator = await page.locator('text=Demo Mode Active').count();
  console.log('Demo mode indicator found:', demoModeIndicator > 0);

  // Step 3: Fill in login form (demo mode accepts any credentials)
  console.log('\nStep 2: Filling login form...');
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.fill('input[name="password"]', 'anypassword');
  console.log('Credentials filled');

  // Step 4: Click login button and wait for navigation
  console.log('\nStep 3: Submitting login form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('After login URL:', page.url());

  // Step 5: Now navigate to dashboard (should have session cookie)
  console.log('\nStep 4: Navigating to dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Dashboard URL:', page.url());

  // Step 6: Check for queue pane
  console.log('\nStep 5: Checking for queue pane...');
  try {
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    console.log('Queue pane found: true');
  } catch (e) {
    console.log('Queue pane found: false (timeout)');
  }

  // Step 7: Wait for posts to load (with retry logic)
  console.log('\nStep 6: Waiting for posts to load...');
  let postCount = 0;
  for (let i = 0; i < 10; i++) {
    postCount = await page.locator('[data-testid^="post-card-"]').count();
    if (postCount > 0) {
      break;
    }
    console.log(`  Attempt ${i + 1}: Still loading...`);
    await sleep(500); // Wait 500ms between checks
  }
  console.log('Number of post cards found:', postCount);

  // Step 8: Get post card content if posts exist
  if (postCount > 0) {
    console.log('\nPost titles:');
    const titles = await page.locator('[data-testid^="post-card-"] [data-testid="post-title"]').allTextContents();
    titles.forEach((title, i) => {
      console.log(`  ${i + 1}. ${title}`);
    });
  } else {
    // Check for empty state
    const emptyState = await page.locator('text=No posts found').count();
    console.log('Empty state found:', emptyState > 0);
  }

  // Step 9: Test API endpoint directly
  console.log('\nStep 7: Testing API endpoint directly...');
  try {
    const response = await page.goto('http://localhost:3000/api/v1/posts', { waitUntil: 'networkidle' });
    const apiText = await response.text();
    console.log('API Response status:', response.status());
    console.log('API Response body:', apiText.substring(0, 1000));
  } catch (e) {
    console.log('API Error:', e.message);
  }

  // Step 10: Take screenshot
  console.log('\nStep 8: Taking screenshot...');
  await page.screenshot({ path: 'test-dashboard.png', fullPage: true });
  console.log('Screenshot saved to test-dashboard.png');

  if (errors.length > 0) {
    console.log('\nTotal console errors:', errors.length);
    errors.forEach(e => console.log('  -', e));
  } else {
    console.log('\nNo console errors detected');
  }

  await browser.close();
  console.log('\n=== Test completed ===');
}

main().catch(console.error);
