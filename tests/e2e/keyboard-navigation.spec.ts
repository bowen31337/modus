import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation - Queue', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([{
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    }]);

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for the queue pane to be visible
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Blur the search input to ensure it doesn't capture keyboard events
    await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.blur();
      }
      // Also focus the body to ensure keyboard events go to the document
      document.body.focus();
    });

    // Wait for the first post to be visible and have keyboard focus
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 5000 });
  });

  test('should navigate down in queue with J key', async ({ page }) => {
    // Get the first post card - should have focus by default (index 0)
    // Use first() to get the first post in the rendered list (regardless of ID)
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();

    // Check initial state - first post should be focused
    let firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class before J:', firstPostClass);

    // Verify the first post has the keyboard focus ring initially
    expect(firstPostClass).toContain('ring-2');
    expect(firstPostClass).toContain('ring-primary');

    // Press J to navigate down
    await page.keyboard.press('J');

    // Wait for React to re-render
    await page.waitForTimeout(300);

    // The second post should now be focused (use nth(1) for second in list)
    const secondPost = page.locator('[data-testid^="post-card-"]').nth(1);
    await expect(secondPost).toBeVisible();

    // Check the class of the second post
    const secondPostClass = await secondPost.getAttribute('class');
    console.log('Second post class after J:', secondPostClass);

    // Verify the focused post has the keyboard focus ring
    expect(secondPostClass).toContain('ring-2');
    expect(secondPostClass).toContain('ring-primary');

    // Verify the first post no longer has the focus ring
    firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class after J:', firstPostClass);
    expect(firstPostClass).not.toContain('ring-2');
  });

  test('should navigate up in queue with K key', async ({ page }) => {
    // Press J twice to go down
    await page.keyboard.press('J');
    await page.keyboard.press('J');
    await page.waitForTimeout(100);

    // Press K to navigate up
    await page.keyboard.press('K');
    await page.waitForTimeout(300);

    // Should be on the second post (index 1)
    const secondPost = page.locator('[data-testid^="post-card-"]').nth(1);
    const secondPostClass = await secondPost.getAttribute('class');
    console.log('Second post class after JJK:', secondPostClass);
    expect(secondPostClass).toContain('ring-2');
    expect(secondPostClass).toContain('ring-primary');
  });

  test('should open post with Enter key', async ({ page }) => {
    // Press Enter to open the first post
    await page.keyboard.press('Enter');

    // Verify work pane shows the post detail
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();
  });

  test('should wrap navigation at end of list', async ({ page }) => {
    // There are 5 posts, press J 6 times to wrap around
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('J');
      await page.waitForTimeout(150); // Increased delay for React re-render
    }

    await page.waitForTimeout(500);

    // Should be back at the first post (index 0)
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    const firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class after wrapping:', firstPostClass);
    expect(firstPostClass).toContain('ring-2');
    expect(firstPostClass).toContain('ring-primary');
  });

  test('should not navigate when typing in input field', async ({ page }) => {
    // Focus on the search input
    const searchInput = page.locator('input[type="search"]');
    await searchInput.click();

    // Type in the search field
    await searchInput.type('test');

    // Press J - should type 'j' instead of navigating
    await page.keyboard.press('J');

    // Verify the search input contains 'testJ' (J was typed, not navigation)
    await expect(searchInput).toHaveValue('testJ');
  });

  test('should reset focus when filters change', async ({ page }) => {
    // Navigate down
    await page.keyboard.press('J');
    await page.keyboard.press('J');
    await page.waitForTimeout(100);

    // Apply a filter - click the filter button to open dropdown
    const filterButton = page.locator('[data-testid="filter-controls-button"]');
    await filterButton.click();

    // Wait for dropdown to open
    await page.waitForSelector('text=Filters', { state: 'visible' });

    // Click on Category to expand the category section
    await page.locator('button:has-text("Category")').first().click();

    // Wait for category options to be visible
    await page.waitForSelector('[data-testid="filter-category-Account Issues"]', { state: 'visible' });

    // Click on Account Issues category
    await page.locator('[data-testid="filter-category-Account Issues"]').click();

    // Wait for filter to apply and React to re-render
    await page.waitForTimeout(500);

    // The first post should be focused again (focus resets on filter change)
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    const firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class after filter:', firstPostClass);
    expect(firstPostClass).toContain('ring-2');
    expect(firstPostClass).toContain('ring-primary');
  });
});
