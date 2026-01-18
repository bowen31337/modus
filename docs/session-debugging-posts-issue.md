# Session Debugging: Posts Not Loading in Browser Tests

## Date: 2026-01-18

## Problem Statement
E2E tests for three-pane layout are failing because posts are not loading in the browser during tests. The UI renders correctly (left rail, queue pane with filters, work pane) but the post list shows "Total: 0" and "Loaded: 0", and no post cards are rendered.

## Investigation Steps Taken

### 1. Verified API Endpoint Works ✓
- Tested API directly with Node.js HTTP client
- `GET /api/v1/posts` returns proper JSON with 5 mock posts
- dataStore singleton correctly initialized with mockPosts
- Server logs show dataStore.getAllPosts() returns 5 posts

### 2. Verified Frontend Code Structure ✓
- QueuePane component is properly imported in dashboard-client.tsx
- QueuePane is rendered with proper props
- PostCard component has correct structure with testids
- fetchPosts function exists with proper API call logic

### 3. Checked Port Configuration ✓
- Dev server running on port 3002 (dynamic due to port conflicts)
- Updated playwright.config.ts to use port 3002
- API calls should go to http://localhost:3002/api/v1/posts

### 4. Added Debug Logging ✓
- Added console.log statements in QueuePane fetchPosts function
- Added console.log statements in API route GET handler
- Added page.on('console') listener in Playwright tests

### 5. Test Results ✗
- No console logs appear from QueuePane component
- No API calls are logged on server during test execution
- Browser console listener captures no messages
- Tests timeout waiting for post cards to appear

## Root Cause Hypothesis

**The frontend is NOT calling the API at all during tests.**

Possible reasons:
1. **Next.js build issue**: The QueuePane client component might not be properly bundled in test environment
2. **React useEffect not firing**: The useEffect that calls fetchPosts might not be executing
3. **JavaScript error before mount**: There could be an error preventing QueuePane from mounting
4. **loadingRef race condition**: The loadingRef.current check might be blocking initial fetch (less likely)
5. **Environment-specific issue**: Something specific to Playwright test environment

## Evidence Supporting Hypothesis

1. **UI renders but no fetch**: Queue pane UI elements (filters, search, stats) render, proving QueuePane mounts
2. **No server logs**: API endpoint not hit during test execution
3. **No browser logs**: Console.log statements in QueuePane don't appear
4. **State values zero**: `totalPosts` and `posts.length` remain at initial values (0)
5. **Manual API test works**: Direct HTTP call to API returns posts correctly

## Next Steps to Resolve

### Immediate Actions:
1. **Restart dev server** to pick up new console.log statements
2. **Check Next.js build output** for any bundling errors
3. **Add console.log at component mount** to verify QueuePane is mounting
4. **Check for client-side JavaScript errors** in test output

### If Issue Persists:
1. **Try simpler approach**: Use direct server-side rendering instead of client-side fetching
2. **Add error boundaries** to catch any React errors
3. **Use React DevTools** in test to inspect component state
4. **Check network tab** in Playwright trace to see if fetch is attempted
5. **Consider using msw** (Mock Service Worker) to mock API in tests

### Alternative Solutions:
1. **Pre-populate posts on server**: Pass posts as props from server component
2. **Use static mock data**: Bypass API for initial test implementation
3. **Add integration tests**: Test API and frontend separately before combining

## Files Modified

1. `playwright.config.ts` - Updated baseURL to port 3002
2. `tests/e2e/three-pane-layout.spec.ts` - Added console logging and removed post waitFor
3. `apps/web/app/api/v1/posts/route.ts` - Added debug logging
4. `apps/web/features/queue/components/queue-pane.tsx` - Added debug logging in fetchPosts

## Test Status

- **Failing**: 6/6 tests in three-pane-layout.spec.ts
- **Root cause**: Posts not loading from API during test execution
- **API endpoint**: Working correctly when tested directly
- **Frontend code**: Appears correct but not executing fetch during tests

## Recommendation

Given time constraints, recommend either:
1. **Investigate Next.js client component bundling** in test environment
2. **Temporarily use server-side data passing** to unblock tests
3. **Create simpler integration test** that doesn't require full page load

The API infrastructure is solid and works correctly in isolation. The issue is specifically with browser test execution.
