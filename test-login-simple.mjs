import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log('Filling in credentials...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'test123');

    console.log('Checking form action...');
    const formAction = await page.locator('form').getAttribute('action');
    console.log('Form action:', formAction);

    // Look for the hidden input that Next.js uses for server actions
    const hiddenInput = await page.locator('form input[type="hidden"]').count();
    console.log('Hidden inputs in form:', hiddenInput);

    if (hiddenInput > 0) {
      const hiddenValue = await page.locator('form input[type="hidden"]').first().inputValue();
      console.log('Hidden input name:', await page.locator('form input[type="hidden"]').first().getAttribute('name'));
      console.log('Hidden input value (first 50 chars):', hiddenValue.substring(0, 50));
    }

    console.log('Clicking submit button...');
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('Success! Navigated to dashboard');
    console.log('Current URL:', page.url());

  } catch (error) {
    console.error('Error:', error.message);
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'debug-login-simple.png' });
  } finally {
    await browser.close();
  }
})();
