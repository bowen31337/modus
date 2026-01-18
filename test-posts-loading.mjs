#!/usr/bin/env node

/**
 * Quick test to check if posts load in the dashboard
 */

import { chromium } from 'playwright';

async function testPostsLoading() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set demo session cookie
  await context.addCookies([
    {
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    },
  ]);

  try {
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { timeout: 10000 });

    console.log('Waiting for queue pane...');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    console.log('Waiting 2 seconds for posts to load...');
    await page.waitForTimeout(2000);

    console.log('Checking for post cards...');
    const postCards = page.locator('[data-testid^="post-card-"]');
    const count = await postCards.count();

    console.log(`Found ${count} post cards`);

    if (count > 0) {
      const firstCard = postCards.first();
      const isVisible = await firstCard.isVisible();
      console.log(`First card is visible: ${isVisible}`);

      const firstCardHtml = await firstCard.innerHTML();
      console.log(`First card HTML (first 200 chars): ${firstCardHtml.substring(0, 200)}`);
    } else {
      console.log('No post cards found!');
      console.log('Checking for loading state...');

      const skeletons = page.locator('[data-testid^="skeleton-"]');
      const skeletonCount = await skeletons.count();
      console.log(`Found ${skeletonCount} skeleton cards`);

      const errorState = page.locator('[data-testid="error-state"]');
      const hasError = await errorState.isVisible();
      console.log(`Has error state: ${hasError}`);

      if (hasError) {
        const errorMessage = await errorState.textContent();
        console.log(`Error message: ${errorMessage}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/posts-check.png', fullPage: true });
    console.log('Screenshot saved to /tmp/posts-check.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPostsLoading();
