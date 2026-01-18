import { test, expect } from '@playwright/test';

// Run tests sequentially to avoid interference between keyboard navigation tests
test.describe.serial('Keyboard Navigation - Queue', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[QueuePane]') || text.includes('Keyboard')) {
        console.log('Browser console:', text);
      }
    });

    // Navigate to login page first
    await page.goto('/login');

    // Wait for login page to load
    await page.waitForSelector('text=Sign in to your account', { timeout: 10000 });

    // Fill in demo credentials and sign in
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Wait for the queue pane to be visible
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });

    // Wait for the first post to be visible
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

    // Blur the search input to ensure it doesn't capture keyboard events
    await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.blur();
      }
      // Also focus the body to ensure keyboard events go to the document
      document.body.focus();
    });

    // Wait a moment for React effects to run and keyboard handler to be attached
    await page.waitForTimeout(500);

    // Debug: Check if keyboard handler marker exists
    const hasMarker = await page.evaluate(() => {
      return !!document.getElementById('keyboard-handler-attached');
    });
    console.log('Keyboard handler marker exists:', hasMarker);
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

    // Wait for focus to move to second post (wait for the ring-2 class to appear)
    // Also log the state for debugging
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      if (posts.length < 2) return false;
      const hasRing = posts[1].classList.contains('ring-2');
      if (!hasRing) {
        console.log('Post 1 classes:', posts[1].getAttribute('class'));
      }
      return hasRing;
    }, { timeout: 5000 });

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

    // Debug: Check the state before pressing Enter
    const debugState = await page.evaluate(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      return {
        postCount: posts.length,
        firstPostHasRing: posts[0]?.classList.contains('ring-2'),
        firstPostId: posts[0]?.getAttribute('data-testid'),
      };
    });
    console.log('Before Enter:', JSON.stringify(debugState, null, 2));

    // Press Enter to open the first post
    await page.keyboard.press('Enter');

    // Wait a moment for React to process the event
    await page.waitForTimeout(1000);

    // Debug: Check if work pane is visible
    const workPaneVisible = await page.locator('[data-testid="work-pane"]').isVisible().catch(() => false);
    console.log('Work pane visible after Enter:', workPaneVisible);

    // Debug: Check if selectedPost state changed
    const selectedPostState = await page.evaluate(() => {
      // Try to find the work pane content
      const workPane = document.querySelector('[data-testid="work-pane"]');
      const postTitle = document.querySelector('[data-testid="post-title"]');
      return {
        workPaneExists: !!workPane,
        postTitleExists: !!postTitle,
        postTitleText: postTitle?.textContent || null,
        bodyHasWorkPane: document.body.innerHTML.includes('data-testid="work-pane"'),
      };
    });
    console.log('Work pane state:', JSON.stringify(selectedPostState, null, 2));

    // Verify work pane shows the post detail
    // The work-pane testid is only present when a post is selected
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();

    // Close the detail view to clean up for the next test
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="work-pane"]')).toBeHidden();
  });

  test('should wrap navigation at end of list', async ({ page }) => {
    // Posts are sorted by priority (P1 first), so order is: id:1 (P1), id:4 (P1), id:5 (P1), id:6 (P1), id:3 (P2), id:2 (P3)
    // There are 6 posts, press J 5 times to go from index 0 to index 5 (last post in sorted order)
    // Then press J 1 more time to wrap to index 0 (first post)
    // Starting at index 0: 1 press -> index 1, 2 presses -> index 2, 3 presses -> index 3, 4 presses -> index 4, 5 presses -> index 5 (last)

    const allPosts = page.locator('[data-testid^="post-card-"]');
    const count = await allPosts.count();
    console.log(`Total posts for wrap test: ${count}`);

    // Ensure body has focus for keyboard events
    await page.evaluate(() => {
      document.body.focus();
      window.focus();
    });

    // Press J (count - 1) times to reach the last post
    for (let i = 0; i < count - 1; i++) {
      await page.keyboard.press('J');
      await page.waitForTimeout(1000);

      // Wait for focus to move to the expected position
      const expectedIndex = i + 1;
      await page.waitForFunction((idx) => {
        const posts = document.querySelectorAll('[data-testid^="post-card-"]');
        if (posts.length <= idx) return false;
        return posts[idx].classList.contains('ring-2');
      }, expectedIndex, { timeout: 10000 });

      // Debug: log the state after each press
      const state = await page.evaluate(() => {
        const posts = document.querySelectorAll('[data-testid^="post-card-"]');
        return Array.from(posts).map((p, i) => ({
          index: i,
          testId: p.getAttribute('data-testid'),
          hasRing: p.classList.contains('ring-2'),
        }));
      });
      console.log(`After J press ${i + 1}:`, JSON.stringify(state, null, 2));
    }

    // Verify the last post in sorted order (index count-1) is focused
    const lastPost = allPosts.nth(count - 1); // Last post in DOM
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
    // Ensure body has focus for keyboard events
    await page.evaluate(() => {
      document.body.focus();
      window.focus();
    });

    // Navigate down (with WebKit-friendly waits)
    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Debug: Check state after first J
    const stateAfterFirstJ = await page.evaluate(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      return Array.from(posts).map((p, i) => ({
        index: i,
        testId: p.getAttribute('data-testid'),
        hasRing: p.classList.contains('ring-2'),
      }));
    });
    console.log('State after first J:', JSON.stringify(stateAfterFirstJ, null, 2));

    await page.keyboard.press('J');
    await page.waitForTimeout(800);

    // Debug: Check state after second J
    const stateAfterSecondJ = await page.evaluate(() => {
      const posts = document.querySelectorAll('[data-testid^="post-card-"]');
      return Array.from(posts).map((p, i) => ({
        index: i,
        testId: p.getAttribute('data-testid'),
        hasRing: p.classList.contains('ring-2'),
      }));
    });
    console.log('State after second J:', JSON.stringify(stateAfterSecondJ, null, 2));

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

  test('should support browser back/forward navigation with post selection', async ({ page }) => {
    // Get the first two posts
    const allPosts = page.locator('[data-testid^="post-card-"]');
    const firstPost = allPosts.nth(0);
    const secondPost = allPosts.nth(1);

    // Get post IDs for URL verification
    const firstPostId = await firstPost.getAttribute('data-testid');
    const secondPostId = await secondPost.getAttribute('data-testid');
    console.log('First post ID:', firstPostId);
    console.log('Second post ID:', secondPostId);

    // Verify initial URL has no post parameter
    await expect(page).toHaveURL(/dashboard$/);

    // Click on the first post to open it
    await firstPost.click();
    await page.waitForTimeout(1000);

    // Verify URL now contains the first post ID
    const firstPostIdOnly = firstPostId?.replace('post-card-', '');
    await expect(page).toHaveURL(new RegExp(`dashboard\\?post=${firstPostIdOnly}`));

    // Verify work pane is visible with the first post
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();

    // Close the detail view
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    // Verify URL no longer has post parameter
    await expect(page).toHaveURL(/dashboard$/);

    // Click on the second post to open it
    await secondPost.click();
    await page.waitForTimeout(1000);

    // Verify URL now contains the second post ID
    const secondPostIdOnly = secondPostId?.replace('post-card-', '');
    await expect(page).toHaveURL(new RegExp(`dashboard\\?post=${secondPostIdOnly}`));

    // Verify work pane shows the second post
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();

    // Press browser back button
    await page.goBack();
    await page.waitForTimeout(1000);

    // Verify URL is back to the first post
    await expect(page).toHaveURL(new RegExp(`dashboard\\?post=${firstPostIdOnly}`));

    // Verify work pane shows the first post again
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });
    const postTitle = await page.locator('[data-testid="post-title"]').textContent();
    console.log('Post title after back:', postTitle);

    // Press browser forward button
    await page.goForward();
    await page.waitForTimeout(1000);

    // Verify URL is back to the second post
    await expect(page).toHaveURL(new RegExp(`dashboard\\?post=${secondPostIdOnly}`));

    // Verify work pane shows the second post again
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 10000 });

    // Press browser back twice to return to queue
    await page.goBack();
    await page.waitForTimeout(800);
    await page.goBack();
    await page.waitForTimeout(800);

    // Verify URL is back to dashboard without post parameter
    await expect(page).toHaveURL(/dashboard$/);

    // Verify work pane is hidden (back to queue)
    const workPane = page.locator('[data-testid="work-pane"]');
    await expect(workPane).toBeHidden();
  });
});
