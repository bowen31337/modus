import { expect, test } from '@playwright/test';

test('should click on post card and see work pane', async ({ page, context }) => {
  // Set demo session cookie
  await context.addCookies([
    {
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Wait for posts to load
  await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

  // Get the first post card
  const firstPost = page.locator('[data-testid^="post-card-"]').first();
  await expect(firstPost).toBeVisible();

  // Log the class before click
  const classBefore = await firstPost.getAttribute('class');
  console.log('Class before click:', classBefore);

  // Check if the post card is a button
  const isButton = await firstPost.evaluate((el) => {
    return el.tagName === 'BUTTON';
  });
  console.log('Is button:', isButton);

  // Check the onClick handler on the button
  const onClickHandler = await firstPost.evaluate((el) => {
    const button = el as HTMLButtonElement;
    // Check if onclick attribute exists
    return {
      tagName: button.tagName,
      onclick: button.getAttribute('onclick'),
      onClickProperty: !!button.onclick,
    };
  });
  console.log('Button details:', JSON.stringify(onClickHandler, null, 2));

  // Check the queue pane state - what is the selectedPostId?
  const queueState = await page.evaluate(() => {
    // Try to find the QueuePane component's state by looking at the DOM
    const posts = document.querySelectorAll('[data-testid^="post-card-"]');
    return {
      postCount: posts.length,
      firstPostTestId: posts[0]?.getAttribute('data-testid'),
      firstPostAriaPressed: posts[0]?.getAttribute('aria-pressed'),
    };
  });
  console.log('Queue state:', JSON.stringify(queueState, null, 2));

  // Add a click event listener via evaluate to log when clicked
  // Use capture phase to catch the event before React's synthetic event system
  await page.evaluate(() => {
    const posts = document.querySelectorAll('[data-testid^="post-card-"]');
    posts.forEach((post, i) => {
      // Add listener in capture phase to see if click reaches the button
      post.addEventListener(
        'click',
        (e) => {
          console.log(`[Test] Post ${i} clicked (capture phase)!`, e.isTrusted);
        },
        { capture: true }
      );

      // Also add bubble phase listener
      post.addEventListener(
        'click',
        (e) => {
          console.log(`[Test] Post ${i} clicked (bubble phase)!`, e.isTrusted);
        },
        { capture: false }
      );
    });
    // Also add a window-level listener
    window.addEventListener(
      'click',
      (e) => {
        console.log(
          '[Test] Window click on:',
          (e.target as HTMLElement)?.tagName,
          (e.target as HTMLElement)?.getAttribute('data-testid')
        );
      },
      { capture: true }
    );
  });

  // Click on the first post card using click()
  console.log('Clicking on first post card...');
  await firstPost.click({ timeout: 10000 });

  // Wait a bit for React to re-render
  await page.waitForTimeout(2000);

  // Check if work pane is visible
  const workPane = page.locator('[data-testid="work-pane"]');
  const isVisible = await workPane.isVisible().catch(() => false);
  console.log('Work pane visible:', isVisible);

  // Check if there's a "No Post Selected" message
  const noPostSelected = await page
    .locator('text=No Post Selected')
    .isVisible()
    .catch(() => false);
  console.log('No Post Selected visible:', noPostSelected);

  // Check the selected post state
  const selectedState = await page.evaluate(() => {
    const workPane = document.querySelector('[data-testid="work-pane"]');
    const postTitle = document.querySelector('[data-testid="post-title"]');
    return {
      workPaneExists: !!workPane,
      postTitleText: postTitle?.textContent || null,
    };
  });
  console.log('Selected state:', JSON.stringify(selectedState, null, 2));

  // Check if the first post is selected (has aria-pressed=true)
  const ariaPressed = await firstPost.getAttribute('aria-pressed');
  console.log('First post aria-pressed:', ariaPressed);

  // Take a screenshot
  await page.screenshot({ path: 'reports/test-click.png' });
});

test('should click on post card using JavaScript dispatch', async ({ page, context }) => {
  // Set demo session cookie
  await context.addCookies([
    {
      name: 'modus_demo_session',
      value: 'active',
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Wait for posts to load
  await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });

  // Click using JavaScript dispatchEvent
  console.log('Clicking using JavaScript dispatchEvent...');
  const result = await page.evaluate(() => {
    const firstPost = document.querySelector('[data-testid^="post-card-"]');
    if (!firstPost) {
      return { error: 'No post card found' };
    }

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    firstPost.dispatchEvent(clickEvent);

    // Check if the click triggered anything
    return {
      postTestId: firstPost.getAttribute('data-testid'),
      postTagName: firstPost.tagName,
      clickDispatched: true,
      disabled: (firstPost as HTMLButtonElement).disabled,
    };
  });
  console.log('Evaluate result:', JSON.stringify(result, null, 2));

  // Wait a bit for React to re-render
  await page.waitForTimeout(2000);

  // Check if work pane is visible
  const workPane = page.locator('[data-testid="work-pane"]');
  const isVisible = await workPane.isVisible().catch(() => false);
  console.log('Work pane visible:', isVisible);

  // Check if there's a "No Post Selected" message
  const noPostSelected = await page
    .locator('text=No Post Selected')
    .isVisible()
    .catch(() => false);
  console.log('No Post Selected visible:', noPostSelected);

  // Check the selected post state
  const selectedState = await page.evaluate(() => {
    const workPane = document.querySelector('[data-testid="work-pane"]');
    const postTitle = document.querySelector('[data-testid="post-title"]');
    return {
      workPaneExists: !!workPane,
      postTitleText: postTitle?.textContent || null,
    };
  });
  console.log('Selected state:', JSON.stringify(selectedState, null, 2));
});
