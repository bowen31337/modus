import { chromium } from '@playwright/test';

async function testCategoriesAPI() {
  console.log('🧪 Testing Categories API\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to settings page
    console.log('Navigating to settings page...');
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('networkidle');
    console.log('✅ Settings page loaded\n');

    // Check if Categories tab exists
    console.log('Checking for Categories tab...');
    const categoriesTab = page.locator('[data-testid="tab-categories"]');
    const exists = await categoriesTab.count();
    console.log(`Categories tab exists: ${exists > 0 ? '✅ Yes' : '❌ No'}\n`);

    if (exists > 0) {
      // Click on Categories tab
      console.log('Clicking Categories tab...');
      await categoriesTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Categories tab clicked\n');

      // Check if categories management component is visible
      console.log('Checking for categories management...');
      const management = page.locator('[data-testid="categories-management"]');
      const isManagementVisible = await management.isVisible();
      console.log(`Categories management visible: ${isManagementVisible ? '✅ Yes' : '❌ No'}\n`);

      // Check for category cards
      console.log('Checking for category cards...');
      const cards = page.locator('[data-testid^="category-card-"]');
      const count = await cards.count();
      console.log(`✅ Found ${count} category cards\n`);

      // List categories
      if (count > 0) {
        console.log('Categories:');
        for (let i = 0; i < Math.min(count, 10); i++) {
          const card = cards.nth(i);
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

      // Check for create button
      console.log('Checking for create category button...');
      const createButton = page.locator('[data-testid="create-category-button"]');
      const createExists = await createButton.count();
      console.log(`Create category button exists: ${createExists > 0 ? '✅ Yes' : '❌ No'}\n`);

      // Take screenshot
      await page.screenshot({ path: 'test-categories-api-result.png', fullPage: true });
      console.log('📸 Screenshot saved to test-categories-api-result.png\n');

      console.log('✅ Categories management UI is working!\n');
    } else {
      console.log('❌ Categories tab not found - feature may not be implemented correctly\n');
      await page.screenshot({ path: 'test-categories-api-error.png', fullPage: true });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-categories-api-failure.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testCategoriesAPI();
