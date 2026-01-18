import { expect, test } from '@playwright/test';

test.describe('Post Detail View and Assignment', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set the demo session cookie directly to authenticate
    // This bypasses the login form and directly establishes a session
    await context.addCookies([
      {
        name: 'modus_demo_session',
        value: 'active',
        path: '/',
        domain: 'localhost',
        httpOnly: true,
      },
    ]);

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for the queue to load
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 5000 });
  });

  test('should display post detail view when a post is selected', async ({ page }) => {
    // Click on the first post card
    const firstPostCard = page.getByTestId('post-card-1');
    await expect(firstPostCard).toBeVisible();
    await firstPostCard.click();

    // Verify work pane is visible
    const workPane = page.getByTestId('work-pane');
    await expect(workPane).toBeVisible();

    // Verify post title is displayed in work pane
    const postTitle = page.getByTestId('post-title');
    await expect(postTitle).toBeVisible();
    await expect(postTitle).toContainText('Unable to access my account');
  });

  test('should auto-assign post to current agent on click', async ({ page }) => {
    // Click on an unassigned post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify assignment indicator appears in work pane header (first occurrence)
    const workPane = page.getByTestId('work-pane');
    const assignedIndicator = workPane.getByText('Assigned to you').first();
    await expect(assignedIndicator).toBeVisible();

    // Verify release button is visible (post is auto-assigned on click)
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    await expect(releaseButton).toContainText('Release');
  });

  test('should display full post content in content section', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify content section is visible
    const contentSection = page.getByTestId('post-content-section');
    await expect(contentSection).toBeVisible();

    // Verify excerpt is displayed
    const contentText = contentSection.locator('p');
    await expect(contentText).toBeVisible();
    await expect(contentText).not.toBeEmpty();
  });

  test('should display user context sidebar with author info', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify user context sidebar is visible
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toBeVisible();

    // Verify author name is displayed
    await expect(sidebar).toContainText('john_doe');

    // Verify post history is displayed
    await expect(sidebar).toContainText('Post History');
  });

  test('should show first-time poster indicator for new users', async ({ page }) => {
    // Click on a post from a first-time poster (post 1 has postCount: 1)
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify user context sidebar shows post count
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toContainText('1 posts');
  });

  test('should display sentiment indicator in user context sidebar', async ({ page }) => {
    // Click on a post with sentiment (post 1 has negative sentiment)
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify sentiment is displayed in sidebar
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toContainText('Negative Sentiment');
  });

  test('should display post metadata in user context sidebar', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify post ID is displayed
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toContainText('Post ID:');

    // Verify category is displayed
    await expect(sidebar).toContainText('Account Issues');
  });

  test('should show assignment status in user context sidebar', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify assignment status is displayed
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toContainText('Assignment');
    await expect(sidebar).toContainText('Assigned to you');
  });

  test('should show release button after auto-assignment', async ({ page }) => {
    // Click on a post (auto-assigns on click)
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify release button is visible (post is assigned)
    const releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    await expect(releaseButton).toContainText('Release');
  });

  test('should display response editor with all controls', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify response textarea is visible
    const responseTextarea = page.getByTestId('response-textarea');
    await expect(responseTextarea).toBeVisible();
    await expect(responseTextarea).toHaveAttribute(
      'placeholder',
      'Type your response here... (Press R to focus)'
    );

    // Verify template button is visible
    const templateButton = page.getByTestId('template-trigger-button');
    await expect(templateButton).toBeVisible();

    // Verify AI suggest button is visible
    const aiButton = page.getByTestId('ai-suggest-button');
    await expect(aiButton).toBeVisible();

    // Verify send response button is visible
    const sendButton = page.getByTestId('send-response-button');
    await expect(sendButton).toBeVisible();
  });

  test('should show assigned indicator on post card after selection', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify the post card shows as selected (aria-pressed=true)
    await expect(postCard).toHaveAttribute('aria-pressed', 'true');

    // Verify assignment indicator appears in work pane header
    const workPane = page.getByTestId('work-pane');
    const assignedIndicator = workPane.getByText('Assigned to you').first();
    await expect(assignedIndicator).toBeVisible();
  });

  test('should handle multiple post selections with correct assignment state', async ({ page }) => {
    // Select first post
    const postCard1 = page.getByTestId('post-card-1');
    await postCard1.click();

    // Verify first post is assigned (release button visible)
    let releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    await expect(releaseButton).toContainText('Release');

    // Verify first post card shows as selected
    await expect(postCard1).toHaveAttribute('aria-pressed', 'true');

    // Select second post
    const postCard2 = page.getByTestId('post-card-2');
    await postCard2.click();

    // Verify second post is also assigned (auto-assign on click)
    releaseButton = page.getByTestId('release-button');
    await expect(releaseButton).toBeVisible();
    await expect(releaseButton).toContainText('Release');

    // Verify second post card shows as selected
    await expect(postCard2).toHaveAttribute('aria-pressed', 'true');

    // Verify first post card is no longer selected
    await expect(postCard1).toHaveAttribute('aria-pressed', 'false');
  });

  test('should display resolve button in work pane header', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify resolve button is visible
    const resolveButton = page.getByTestId('resolve-button');
    await expect(resolveButton).toBeVisible();
    await expect(resolveButton).toContainText('Resolve');
  });

  test('should display priority and status badges in work pane header', async ({ page }) => {
    // Click on a post with P1 priority
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify priority badge (P1)
    const workPane = page.getByTestId('work-pane');
    await expect(workPane).toContainText('P1');

    // Verify status badge (open)
    await expect(workPane).toContainText('Open');
  });

  test('should show category indicator in user context sidebar', async ({ page }) => {
    // Click on a post
    const postCard = page.getByTestId('post-card-1');
    await postCard.click();

    // Verify category is displayed
    const sidebar = page.getByTestId('user-context-sidebar');
    await expect(sidebar).toContainText('Account Issues');
  });
});
