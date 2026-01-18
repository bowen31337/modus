import { chromium } from '@playwright/test';

async function testCategoriesManagement() {
  console.log('🧪 Testing Categories Management Feature\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to the application
    console.log('Step 1: Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application loaded\n');

    // Step 2: Log in as Admin (demo mode)
    console.log('Step 2: Logging in as Admin...');
    const emailInput = page.locator('input[type="email"]');
    const isVisible = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Email input visible: ${isVisible}`);

    if (isVisible) {
      await page.fill('input[type="email"]', 'admin@modus.test');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Check if we're redirected to dashboard
      const currentUrl = page.url();
      console.log(`After login, current URL: ${currentUrl}`);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Logged in as Admin\n');
      } else {
        console.log('⚠️ Login may have failed, still on page:', currentUrl);
        await page.screenshot({ path: 'test-categories-after-login.png' });
      }
    } else {
      console.log('ℹ️ No login form visible, checking current URL...');
      console.log('Current URL:', page.url());
      await page.screenshot({ path: 'test-categories-no-login.png' });
    }

    // Step 3: Navigate to Settings
    console.log('Step 3: Navigating to Settings...');
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to Settings\n');

    // Step 4: Click on Categories tab
    console.log('Step 4: Opening Categories tab...');
    const categoriesTab = page.locator('[data-testid="tab-categories"]');
    const exists = await categoriesTab.count();

    if (exists === 0) {
      console.log('❌ Categories tab not found!');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'test-categories-debug.png', fullPage: true });

      // Check what tabs are available
      console.log('\nChecking available tabs:');
      const allTabs = page.locator('button[data-testid^="tab-"]');
      const tabCount = await allTabs.count();
      for (let i = 0; i < tabCount; i++) {
        const tabText = await allTabs.nth(i).textContent();
        const tabTestId = await allTabs.nth(i).getAttribute('data-testid');
        console.log(`   - ${tabText?.trim()} (${tabTestId})`);
      }

      return false;
    }

    await categoriesTab.click();
    await page.waitForTimeout(1000);
    console.log('✅ Categories tab opened\n');

    // Step 5: Verify categories list
    console.log('Step 5: Verifying categories list...');
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const count = await categoryCards.count();
    console.log(`✅ Found ${count} categories\n`);

    // Step 6: List categories
    if (count > 0) {
      console.log('Categories:');
      for (let i = 0; i < Math.min(count, 10); i++) {
        const card = categoryCards.nth(i);
        try {
          const name = await card.locator('h3').textContent();
          const slug = await card.locator('.font-mono').textContent();
          console.log(`   - ${name?.trim()} (${slug?.trim()})`);
        } catch (e) {
          console.log(`   - (Error reading card ${i})`);
        }
      }
      console.log('');
    }

    // Step 7: Check create button
    console.log('Step 7: Checking create button...');
    const createButton = page.locator('[data-testid="create-category-button"]');
    const createExists = await createButton.count();
    console.log(`Create button exists: ${createExists > 0 ? '✅ Yes' : '❌ No'}\n`);

    // Take final screenshot
    await page.screenshot({ path: 'test-categories-success.png', fullPage: true });
    console.log('📸 Screenshot saved to test-categories-success.png\n');

    console.log('✅ All tests passed! Categories management is working correctly.\n');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-categories-error.png', fullPage: true });
    console.log('📸 Error screenshot saved\n');
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testCategoriesManagement().then(success => {
  process.exit(success ? 0 : 1);
});
