# E2E Test Investigation - Session 33

## Date: 2026-01-18

## Issue Summary

E2E tests for AI Suggest functionality and several other test files are failing because they cannot find post cards in the queue pane. The queue pane appears but shows "Total: 0" and "Loaded: 0", indicating that the API call to fetch posts is either failing or not being triggered.

## Root Causes Identified

### 1. Hardcoded Post ID Selectors (FIXED)

**Problem:** Tests were using hardcoded selectors like `[data-testid="post-card-1"]`, but the API returns posts with IDs like "3", "1", "2", "5", "4" in a different order.

**Solution:** Changed all instances to use dynamic selectors:
```typescript
// Before
await page.click('[data-testid="post-card-1"]');

// After
await page.locator('[data-testid^="post-card-"]').first().click();
```

**Files Fixed:**
- `tests/e2e/ai-suggest.spec.ts`
- `tests/e2e/internal-notes-styling.spec.ts`
- `tests/e2e/post-detail-assignment.spec.ts`
- `tests/e2e/reassign.spec.ts`
- `tests/e2e/release-assignment.spec.ts`
- `tests/e2e/response-templates.spec.ts`
- `tests/e2e/rich-text-editor.spec.ts`

### 2. Authentication Flow Issue (PARTIALLY INVESTIGATED)

**Problem:** Using `context.addCookies()` to set demo session cookies doesn't work properly with Next.js server-side rendering. The cookies are set in the browser context, but when the dashboard page is server-side rendered, the server checks for cookies using the `cookies()` function BEFORE the browser sends those cookies.

**Current State:**
- Three-pane-layout tests use `context.addCookies()` and work because they only test layout (don't need posts)
- Keyboard navigation tests use the login flow (fill form → click Sign In) and work properly
- AI suggest tests originally used `context.addCookies()` and failed
- AI suggest tests updated to use login flow but still failing

**Why Keyboard Navigation Tests Work:**
```typescript
// Fill in the form
await page.getByLabel('Email').fill('demo@example.com');
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Sign In' }).click();

// Wait for redirect
await page.waitForURL(/.*dashboard/);

// Wait for post cards
await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
```

**Why This Might Not Work for AI Suggest Tests:**
- The form uses a server action (`demoLoginAction`) in demo mode
- Server actions set cookies via the `cookies()` function
- There might be a timing issue where the redirect happens before cookies are fully set
- Or the tests are running in parallel and interfering with each other

### 3. Posts Not Loading in Queue Pane

**Observation:** The queue pane shows "Total: 0" / "Loaded: 0" even though:
- The API endpoint `/api/v1/posts` returns 5 posts when tested directly
- The queue pane component is visible
- The search and filter controls are rendered

**Possible Causes:**
1. **Network Request Failure:** The client-side fetch to `/api/v1/posts` might be failing silently
2. **Race Condition:** The test might be trying to click before the API call completes
3. **Filter/Sort State:** The default filters might be filtering out all posts
4. **Error State:** The API call might be throwing an error that's being caught

## Next Steps to Fix

### Option 1: Use Serial Test Execution
Run tests serially to avoid state interference:
```typescript
test.describe.serial('AI Suggest Functionality', () => {
  // tests...
});
```

### Option 2: Increase Wait Time
Add explicit wait for loading to complete:
```typescript
// Wait for loading state to finish
await page.waitForSelector('[data-testid="queue-pane"]:not(:has-text("Loading"))');

// Or wait for total count to update
await page.waitForFunction(() => {
  const totalText = document.querySelector('[data-testid="queue-stats-total"]')?.textContent;
  return totalText && parseInt(totalText) > 0;
});
```

### Option 3: Add Test ID for Loading State
Add a test ID to the loading skeleton or empty state so tests can wait for it to disappear:
```typescript
// In queue-pane.tsx
{loading && (
  <div data-testid="queue-loading">
    <PostCardSkeleton />
    <PostCardSkeleton />
  </div>
)}
```

```typescript
// In tests
await page.waitForSelector('[data-testid="queue-loading"]', { state: 'hidden' });
```

### Option 4: Debug Network Requests
Add listeners to track network requests in tests:
```typescript
page.on('request', request => {
  if (request.url().includes('/api/v1/posts')) {
    console.log('API Request:', request.url());
  }
});

page.on('response', response => {
  if (response.url().includes('/api/v1/posts')) {
    console.log('API Response:', response.status());
    response.json().then(data => console.log('API Data:', data));
  }
});
```

## Test Files Affected

All files that were updated to use dynamic selectors but still have authentication/loading issues:
1. `tests/e2e/ai-suggest.spec.ts` (9 tests failing)
2. `tests/e2e/internal-notes-styling.spec.ts` (needs verification)
3. `tests/e2e/post-detail-assignment.spec.ts` (needs verification)
4. `tests/e2e/reassign.spec.ts` (13 tests - currently passing?)
5. `tests/e2e/release-assignment.spec.ts` (needs verification)
6. `tests/e2e/response-templates.spec.ts` (needs verification)
7. `tests/e2e/rich-text-editor.spec.ts` (needs verification)

## Recommendation

For the next session:
1. **Add network request debugging** to see if API calls are being made
2. **Add test IDs for loading/error states** in queue-pane component
3. **Try serial test execution** to eliminate race conditions
4. **Verify authentication is actually working** by checking if cookies are set after login
5. **Consider mocking the API** in tests if the real API is unreliable in test environment

## Files Modified This Session

1. `tests/e2e/ai-suggest.spec.ts` - Updated authentication and selector approach
2. `tests/e2e/internal-notes-styling.spec.ts` - Fixed hardcoded selectors
3. `tests/e2e/post-detail-assignment.spec.ts` - Fixed hardcoded selectors
4. `tests/e2e/reassign.spec.ts` - Fixed hardcoded selectors
5. `tests/e2e/release-assignment.spec.ts` - Fixed hardcoded selectors
6. `tests/e2e/response-templates.spec.ts` - Fixed hardcoded selectors
7. `tests/e2e/rich-text-editor.spec.ts` - Fixed hardcoded selectors
8. `docs/e2e-test-investigation-session33.md` - This document

## Test Infrastructure Notes

- Playwright version: 1.57.0
- Test runner: Chromium (primary), Firefox (some tests)
- Next.js dev server: Port 3000
- Authentication: Demo mode (server actions with cookies)
- API: In-memory data store with 5 sample posts

## Related Sessions

- Session 32: Fixed filter dropdown and keyboard navigation issues
- Session 31: Implemented loading indicators and error states
- Session 30: Implemented AI API endpoints
- Session 29: Implemented responses API endpoint
