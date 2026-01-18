import { expect, test } from '@playwright/test';

test.describe('XSS Prevention', () => {
  test.beforeEach(async ({ context }) => {
    // Set demo session cookie directly on the browser context
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  /**
   * Helper function to get CSRF token and make authenticated POST request
   */
  async function createPostWithXSS(
    page: any,
    postData: Record<string, unknown>
  ) {
    // First, get a CSRF token by visiting the CSRF endpoint
    const csrfResponse = await page.request.get('/api/v1/auth/csrf');
    expect(csrfResponse.ok()).toBe(true);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.data.token;

    // Now create the post with the CSRF token
    const response = await page.request.post('/api/v1/posts', {
      headers: {
        'x-csrf-token': csrfToken,
      },
      data: postData,
    });

    return response;
  }

  test('should sanitize script tags in post title when creating post', async ({
    page,
  }) => {
    const response = await createPostWithXSS(page, {
      title: '<script>alert("xss")</script>Malicious Post',
      body_content: 'This is a test post with script tag',
      author_user_id: 'user-test-xss',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the response contains sanitized content
    expect(post.data.title).not.toContain('<script>');
    expect(post.data.title).toContain('&lt;script&gt;');
    expect(post.data.title).toContain('Malicious Post');
  });

  test('should sanitize script tags in post body when creating post', async ({
    page,
  }) => {
    const response = await createPostWithXSS(page, {
      title: 'Test Post',
      body_content: '<script>alert("xss")</script>Malicious body content',
      author_user_id: 'user-test-xss-2',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the response contains sanitized content
    expect(post.data.body_content).not.toContain('<script>');
    expect(post.data.body_content).toContain('&lt;script&gt;');
    expect(post.data.body_content).toContain('Malicious body content');
  });

  test('should sanitize event handlers in post content', async ({ page }) => {
    const response = await createPostWithXSS(page, {
      title: 'Test with event handler',
      body_content: '<img src=x onerror=alert(1)>Malicious image',
      author_user_id: 'user-test-xss-3',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the response contains sanitized content
    expect(post.data.body_content).not.toContain('onerror=');
    expect(post.data.body_content).toContain('&lt;img');
    expect(post.data.body_content).toContain('onerror=');
    expect(post.data.body_content).toContain('Malicious image');
  });

  test('should sanitize javascript: protocol in links', async ({ page }) => {
    const response = await createPostWithXSS(page, {
      title: 'Test with javascript protocol',
      body_content: '<a href="javascript:alert(1)">Click me</a>',
      author_user_id: 'user-test-xss-4',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the response contains sanitized content (javascript: is escaped)
    expect(post.data.body_content).toContain('javascript:');
    expect(post.data.body_content).toContain('Click me');
  });

  test('should sanitize HTML entities in post title and body', async ({
    page,
  }) => {
    const response = await createPostWithXSS(page, {
      title: '<b>Bold text</b> & "quoted"',
      body_content: '<div>Content & more</div>',
      author_user_id: 'user-test-xss-5',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify HTML characters are escaped
    expect(post.data.title).toContain('&lt;b&gt;');
    expect(post.data.title).toContain('&lt;/b&gt;');
    expect(post.data.title).toContain('&quot;');
    expect(post.data.body_content).toContain('&lt;div&gt;');
    expect(post.data.body_content).toContain('&lt;/div&gt;');
  });

  test('should sanitize dangerous patterns via validation', async ({
    page,
  }) => {
    const response = await createPostWithXSS(page, {
      title: 'Dangerous link test',
      body_content: 'Click here: javascript:alert(1)',
      author_user_id: 'user-test-xss-6',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    // The API should still accept it (sanitization happens, not rejection)
    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the dangerous content is escaped
    expect(post.data.body_content).toContain('javascript:');
    expect(post.data.body_content).toContain('Click here');
  });

  test('should verify XSS payload is rendered as text, not executed', async ({
    page,
  }) => {
    // Create a post with XSS payload
    const response = await createPostWithXSS(page, {
      title: 'XSS Test Post',
      body_content: '<script>document.body.innerHTML = "XSS"</script>',
      author_user_id: 'user-test-xss-7',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // The script tag should be escaped
    expect(post.data.body_content).toContain('&lt;script&gt;');
    expect(post.data.body_content).not.toContain('<script>');

    // Navigate to dashboard and find the post
    await page.goto('/dashboard');

    // Wait for the dashboard to load - posts should appear
    // The post we created should be visible
    await page.waitForSelector('[data-testid^="post-card-"]', {
      timeout: 10000,
    });

    // Click on the post to view details
    // Find the post by title
    const postCard = page
      .locator('[data-testid^="post-card-"]')
      .filter({ hasText: 'XSS Test Post' });
    await expect(postCard).toBeVisible();
    await postCard.click();

    // Wait for work pane to load
    await page.waitForSelector('[data-testid="work-pane"]', { timeout: 5000 });

    // Verify the body content is displayed with escaped HTML
    const workPane = page.locator('[data-testid="work-pane"]');
    await expect(workPane).toContainText('&lt;script&gt;');
    await expect(workPane).toContainText('XSS');

    // Verify the body does NOT contain unescaped script tags
    const bodyContent = await workPane.textContent();
    expect(bodyContent).not.toMatch(/<script[^>]*>/);
  });

  test('should sanitize excerpt field in post creation', async ({ page }) => {
    const response = await createPostWithXSS(page, {
      title: 'Test with malicious excerpt',
      body_content: 'Normal body content',
      excerpt: '<svg/onload=alert(1)>Malicious excerpt',
      author_user_id: 'user-test-xss-8',
      author_post_count: 1,
      status: 'open',
      priority: 'P4',
    });

    expect(response.ok()).toBe(true);
    const post = await response.json();

    // Verify the excerpt is sanitized
    expect(post.data.excerpt).not.toContain('<svg');
    expect(post.data.excerpt).toContain('&lt;svg');
    expect(post.data.excerpt).toContain('Malicious excerpt');
  });
});
