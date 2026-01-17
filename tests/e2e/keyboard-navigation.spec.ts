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

    // Navigate directly to dashboard with hard reload
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

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

    // Ensure the page/document has focus for keyboard events
    await page.evaluate(() => {
      window.focus();
      document.body.focus();
    });

    // Check initial state - first post should be focused
    let firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class before J:', firstPostClass);

    // Verify the first post has the keyboard focus ring initially
    expect(firstPostClass).toContain('ring-2');
    expect(firstPostClass).toContain('ring-primary');

    // Debug: Check what element currently has focus
    const activeElement = await page.evaluate(() => {
      return document.activeElement?.tagName || 'no active element';
    });
    console.log('Active element before J:', activeElement);

    // Debug: Check if search input is focused
    const searchInputValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="search"]');
      return input ? (input as HTMLInputElement).value : 'no search input';
    });
    console.log('Search input value:', searchInputValue);

    // Press J to navigate down - use keyDown instead of press for better compatibility
    await page.keyboard.press('J');

    // Wait for React to re-render
    await page.waitForTimeout(1000);

    // Check the class of the second post directly
    const secondPostClass = await page.evaluate(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 2) return null;
      return posts[1].getAttribute('class');
    });
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
    // Get all posts to understand the order
    const allPosts = page.locator('[data-testid^="post-card-"]');
    const count = await allPosts.count();
    console.log(`Total posts: ${count}`);

    // Log the order of posts
    for (let i = 0; i < Math.min(count, 5); i++) {
      const post = allPosts.nth(i);
      const testId = await post.getAttribute('data-testid');
      console.log(`Post ${i}: ${testId}`);
    }

    // Press J twice to go down (with longer waits for WebKit)
    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Wait for focus to move to second post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 2) return false;
      return posts[1].classList.contains('ring-2');
    }, { timeout: 5000 });

    // Log state after first J
    const firstPost = page.locator('[data-testid^="post-card-"]').nth(0);
    const secondPost = page.locator('[data-testid^="post-card-"]').nth(1);
    const thirdPost = page.locator('[data-testid^="post-card-"]').nth(2);
    console.log('After first J - First post class:', await firstPost.getAttribute('class'));
    console.log('After first J - Second post class:', await secondPost.getAttribute('class'));
    console.log('After first J - Third post class:', await thirdPost.getAttribute('class'));

    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Wait for focus to move to third post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 3) return false;
      return posts[2].classList.contains('ring-2');
    }, { timeout: 5000 });

    // Log state after second J
    console.log('After second J - First post class:', await firstPost.getAttribute('class'));
    console.log('After second J - Second post class:', await secondPost.getAttribute('class'));
    console.log('After second J - Third post class:', await thirdPost.getAttribute('class'));

    // Press K to navigate up
    await page.keyboard.press('K');
    await page.waitForTimeout(800);

    // Wait for focus to move back to second post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 2) return false;
      return posts[1].classList.contains('ring-2');
    }, { timeout: 5000 });

    // Log state after K
    console.log('After K - First post class:', await firstPost.getAttribute('class'));
    console.log('After K - Second post class:', await secondPost.getAttribute('class'));
    console.log('After K - Third post class:', await thirdPost.getAttribute('class'));

    // Should be on the second post (index 1)
    const secondPostClass = await secondPost.getAttribute('class');
    console.log('Second post class after JJK:', secondPostClass);
    expect(secondPostClass).toContain('ring-2');
    expect(secondPostClass).toContain('ring-primary');
  });

  test('should open post with Enter key', async ({ page }) => {
    // The first post should already be focused (index 0) from beforeEach
    // Verify first post has focus ring
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toHaveClass(/ring-2/);
    await expect(firstPost).toHaveClass(/ring-primary/);

    // Press Enter to open the first post
    await page.keyboard.press('Enter');

    // Verify work pane shows the post detail
    // The work-pane testid is only present when a post is selected
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();
  });

  test('should wrap navigation at end of list', async ({ page }) => {
    // Posts are sorted by priority (P1 first), so order is: id:1 (P1), id:4 (P1), id:5 (P1), id:3 (P2), id:2 (P3)
    // There are 5 posts, press J 4 times to go from index 0 to index 4 (last post in sorted order)
    // Then press J 1 more time to wrap to index 0 (first post)
    // Starting at index 0: 1 press -> index 1, 2 presses -> index 2, 3 presses -> index 3, 4 presses -> index 4 (last)

    const allPosts = page.locator('[data-testid^="post-card-"]');
    const count = await allPosts.count();
    console.log(`Total posts for wrap test: ${count}`);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('J');
      await page.waitForTimeout(1000);

      // Wait for focus to move to the expected position
      const expectedIndex = i + 1;
      await page.waitForFunction((idx) => {
        const posts = document.querySelectorAll('[data-testid^="post-card-"]');
        if (posts.length <= idx) return false;
        return posts[idx].classList.contains('ring-2');
      }, expectedIndex, { timeout: 10000 });
    }

    // Verify the last post in sorted order (index 4, id:2 - P3) is focused
    // The last post in the DOM should be the one at index 4 after sorting by priority
    const lastPost = allPosts.nth(count - 1); // Last post in DOM (should be id:2 after sorting)
    const lastPostClass = await lastPost.getAttribute('class');
    expect(lastPostClass).toContain('ring-2');
    expect(lastPostClass).toContain('ring-primary');

    // Press J one more time to wrap around to the first post
    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Wait for focus to wrap back to first post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 1) return false;
      return posts[0].classList.contains('ring-2');
    }, { timeout: 5000 });

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
    // Navigate down (with WebKit-friendly waits)
    await page.keyboard.press('J');
    await page.waitForTimeout(800);
    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Wait for focus to move to third post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 3) return false;
      return posts[2].classList.contains('ring-2');
    }, { timeout: 5000 });

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
    await page.waitForTimeout(800);

    // Wait for focus to reset to first post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 1) return false;
      return posts[0].classList.contains('ring-2');
    }, { timeout: 5000 });

    // The first post should be focused again (focus resets on filter change)
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    const firstPostClass = await firstPost.getAttribute('class');
    console.log('First post class after filter:', firstPostClass);
    expect(firstPostClass).toContain('ring-2');
    expect(firstPostClass).toContain('ring-primary');
  });

  test('should close post detail view with Escape key', async ({ page }) => {
    // Verify first post has focus before opening
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toHaveClass(/ring-2/);
    await expect(firstPost).toHaveClass(/ring-primary/);

    // Press Enter to open the first post
    await page.keyboard.press('Enter');

    // Verify work pane shows the post detail
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();

    // Press Escape to close the detail view
    await page.keyboard.press('Escape');

    // Wait for the transition (WebKit needs more time)
    await page.waitForTimeout(800);

    // Verify work pane is no longer visible (returned to queue)
    // Note: work-pane testid is only present when a post is selected
    const workPane = page.locator('[data-testid="work-pane"]');
    await expect(workPane).toBeHidden();

    // Verify queue pane is visible
    await expect(page.locator('[data-testid="queue-pane"]')).toBeVisible();

    // Wait for focus to return to first post
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 1) return false;
      return posts[0].classList.contains('ring-2') && posts[0].classList.contains('ring-primary');
    }, { timeout: 5000 });

    // Verify we're back at the first post with focus
    const firstPostAfterEscape = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPostAfterEscape).toHaveClass(/ring-2/);
    await expect(firstPostAfterEscape).toHaveClass(/ring-primary/);
  });
});
