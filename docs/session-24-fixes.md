# Session 24 - Critical Bug Fix: Playwright Port Mismatch

## Date: 2026-01-18

## Summary

Fixed a critical configuration bug in the Playwright test setup that was causing widespread test failures. The Playwright config was pointing to port 3002 while the dev server runs on port 3000.

## Root Cause

**File:** `playwright.config.ts`

The `baseURL` was set to `http://localhost:3002` but the Next.js dev server runs on port 3000 by default.

```typescript
// BEFORE (incorrect)
use: {
  baseURL: 'http://localhost:3002',
  ...
}

// AFTER (correct)
use: {
  baseURL: 'http://localhost:3000',
  ...
}
```

## Impact

This configuration mismatch caused:
- All E2E tests to fail with timeout errors
- Tests unable to find elements because they were hitting the wrong port
- "Work pane not found" errors because clicks weren't registering
- Apparent "state not updating" issues that were actually network connectivity issues

## Solution

Updated `playwright.config.ts`:
1. Changed `baseURL` from port 3002 to port 3000
2. Updated comments to reflect correct port and command

## Verification

After the fix:
- ✓ All 13 reassign tests now pass (100%)
- ✓ Work pane appears correctly after clicking post cards
- ✓ Reassign button is visible and functional
- ✓ State management working as expected

## Files Modified

1. `playwright.config.ts` - Fixed baseURL port from 3002 to 3000
2. Removed temporary debug test files created during investigation

## Technical Investigation Process

1. Identified symptom: Reassign tests failing with "reassign-button not found"
2. Investigated PostCard click handlers - confirmed they were correctly wired
3. Checked WorkPane conditional rendering - found test ID only present when post selected
4. Created debug tests to check if state was updating
5. Discovered work pane count was 0, indicating click wasn't working
6. Noticed test URL was `http://localhost:3002/dashboard` while server runs on 3000
7. Found Playwright config had wrong port
8. Fixed config and verified all tests pass

## Notes

- This was a simple configuration error with major impact
- The dev server has always run on port 3000 (standard Next.js default)
- The port 3002 in Playwright config was likely a leftover from previous testing setup
- All E2E tests should now work correctly with the correct port
