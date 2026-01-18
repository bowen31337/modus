# Implementation Plan - Remaining 30 Features

## Overview
This plan addresses the 30 failing functional features needed to reach 100% completion. The work is organized by priority and dependency order.

---

## Phase 1: Security & Access Control (Critical) - ~2-3 days

### 1.1 Fix RLS Policies (Feature 64)
**Priority:** CRITICAL - Security vulnerability
**Estimated:** 4 hours

**Tasks:**
1. Review current RLS policies in `supabase/migrations/00002_rls_policies.sql`
2. Test RLS enforcement with API calls
3. Fix policy gaps:
   - Verify `posts_select` allows agents to see assigned posts
   - Verify `responses_select` properly filters internal notes
   - Check `has_role()` function logic
4. Add integration tests for RLS

**Files:**
- `supabase/migrations/00002_rls_policies.sql` - Update policies
- `tests/api/rls.test.ts` - Add RLS tests

**Test Steps:**
```bash
# Test RLS enforcement
pnpm test:api -- --testNamePattern="RLS"
```

---

### 1.2 Implement XSS Prevention (Feature 149)
**Priority:** CRITICAL - Security vulnerability
**Estimated:** 3 hours

**Tasks:**
1. Install DOMPurify or similar sanitization library
2. Sanitize post content on display
3. Sanitize user input on submission
4. Add tests for XSS vectors

**Files:**
- `apps/web/lib/sanitize.ts` - Sanitization utilities
- `apps/web/features/posts/components/PostContent.tsx` - Apply sanitization
- `apps/web/features/posts/components/ResponseEditor.tsx` - Sanitize input
- `tests/security/xss.test.ts` - XSS tests

**Implementation:**
```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}
```

---

### 1.3 Implement CSRF Protection (Feature 150)
**Priority:** CRITICAL - Security vulnerability
**Estimated:** 3 hours

**Tasks:**
1. Add CSRF token generation on session start
2. Include tokens in API requests
3. Validate tokens on state-changing endpoints
4. Add middleware for CSRF validation

**Files:**
- `apps/web/lib/csrf.ts` - CSRF token management
- `apps/web/middleware.ts` - CSRF validation
- `apps/web/lib/api/client.ts` - Add CSRF headers
- `tests/security/csrf.test.ts` - CSRF tests

**Implementation:**
```typescript
// Generate CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware validation
export function validateCsrf(token: string, sessionToken: string): boolean {
  // Compare token with session-stored token
}
```

---

### 1.4 Fix Admin Role Permissions (Feature 62)
**Priority:** HIGH - Blocks admin functionality
**Estimated:** 2 hours

**Tasks:**
1. Verify admin role check in `has_role()` function
2. Check RLS policies for admin access
3. Verify UI shows admin-only features
4. Test admin can access all endpoints

**Files:**
- `supabase/migrations/00002_rls_policies.sql` - Verify admin policies
- `apps/web/features/admin/` - Check component visibility
- `tests/api/admin-permissions.test.ts` - Admin permission tests

**Fix:**
```sql
-- Verify has_role function correctly handles admin
CREATE OR REPLACE FUNCTION has_role(required_role agent_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role agent_role;
BEGIN
    SELECT role INTO user_role
    FROM agents
    WHERE user_id = auth.uid();

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Role hierarchy: admin > supervisor > moderator > agent
    CASE required_role
        WHEN 'agent' THEN
            RETURN user_role IN ('agent', 'moderator', 'supervisor', 'admin');
        WHEN 'moderator' THEN
            RETURN user_role IN ('moderator', 'supervisor', 'admin');
        WHEN 'supervisor' THEN
            RETURN user_role IN ('supervisor', 'admin');
        WHEN 'admin' THEN
            RETURN user_role = 'admin';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 1.5 Fix Moderator Role Permissions (Feature 63)
**Priority:** HIGH
**Estimated:** 2 hours

**Tasks:**
1. Implement moderator-specific permissions
2. Add moderator role checks in UI
3. Verify moderator can access templates but not admin settings
4. Add tests for moderator role

**Files:**
- `apps/web/features/admin/components/` - Add role-based visibility
- `tests/api/moderator-permissions.test.ts` - Moderator tests

---

## Phase 2: Real-time Synchronization - ~2 days

### 2.1 Fix Supabase Realtime Subscription (Feature 88)
**Priority:** HIGH - Core feature
**Estimated:** 4 hours

**Tasks:**
1. Configure Realtime subscriptions in Supabase
2. Implement WebSocket connection in React
3. Add connection status indicator
4. Handle reconnection logic

**Files:**
- `apps/web/lib/realtime.ts` - Realtime subscription management
- `apps/web/features/queue/hooks/useRealtimePosts.ts` - Post updates
- `apps/web/components/ConnectionStatus.tsx` - UI indicator

**Implementation:**
```typescript
// lib/realtime.ts
import { createClient } from '@supabase/supabase-js';

export function setupRealtimeSubscription(
  channel: string,
  table: string,
  callback: (payload: any) => void
) {
  const supabase = createClient(url, key);

  return supabase
    .channel(channel)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table
    }, callback)
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
}
```

---

### 2.2 Fix Real-time Queue Updates (Feature 67)
**Priority:** HIGH
**Estimated:** 3 hours

**Tasks:**
1. Subscribe to `moderation_posts` table changes
2. Update queue UI on receiving changes
3. Add optimistic UI updates
4. Measure and ensure < 2 second update time

**Files:**
- `apps/web/features/queue/hooks/useRealtimePosts.ts`
- `apps/web/features/queue/components/QueuePane.tsx`

**Implementation:**
```typescript
// Update queue when receiving realtime event
const handlePostChange = (payload) => {
  if (payload.eventType === 'UPDATE') {
    updatePostInQueue(payload.new);
  } else if (payload.eventType === 'INSERT') {
    addPostToQueue(payload.new);
  }
};
```

---

### 2.3 Fix Real-time Status Updates (Feature 68)
**Priority:** HIGH
**Estimated:** 2 hours

**Tasks:**
1. Subscribe to post detail changes
2. Update status badge in real-time
3. Show notification when post is updated by another agent

**Files:**
- `apps/web/features/posts/hooks/useRealtimePost.ts`
- `apps/web/features/posts/components/PostDetail.tsx`

---

### 2.4 Implement Reconnection Logic (Feature 193)
**Priority:** MEDIUM
**Estimated:** 3 hours

**Tasks:**
1. Detect network disconnection
2. Queue actions while offline
3. Reconnect on network restore
4. Sync queued actions

**Files:**
- `apps/web/lib/realtime.ts` - Add reconnection logic
- `apps/web/hooks/useNetworkStatus.ts` - Network detection

---

## Phase 3: Database & Infrastructure - ~2 days

### 3.1 Fix Database Migrations (Feature 91)
**Priority:** HIGH - Deployment blocker
**Estimated:** 4 hours

**Tasks:**
1. Test migrations on fresh database
2. Verify all tables created correctly
3. Verify RLS policies applied
4. Verify pgvector extension enabled
5. Verify indexes created

**Files:**
- `supabase/migrations/00001_initial_schema.sql` - Fix if needed
- `supabase/migrations/00002_rls_policies.sql` - Fix if needed
- `scripts/test-migrations.sh` - Migration test script

**Test:**
```bash
# Reset and test migrations
supabase db reset
supabase migration list
# Verify all tables exist
psql -c "\dt"
```

---

### 3.2 Fix Seed Data (Feature 92)
**Priority:** MEDIUM - Development convenience
**Estimated:** 2 hours

**Tasks:**
1. Create seed script
2. Seed default categories
3. Seed default priority rules
4. Seed sample response templates
5. Verify data is usable immediately

**Files:**
- `supabase/seed.sql` - Seed data
- `scripts/seed-database.sh` - Seed script

**Seed Data:**
```sql
-- Default categories
INSERT INTO categories (name, slug, color, icon) VALUES
  ('General', 'general', '#6366f1', 'message-circle'),
  ('Technical', 'technical', '#8b5cf6', 'code'),
  ('Billing', 'billing', '#ec4899', 'credit-card');

-- Default priority rules
INSERT INTO priority_rules (name, condition_type, condition_value, action_type, action_value) VALUES
  ('First-time poster', 'author_post_count', '< 2', 'set_priority', 'P2');
```

---

### 3.3 Fix RAG Retrieval (Feature 90)
**Priority:** MEDIUM - AI feature
**Estimated:** 4 hours

**Tasks:**
1. Implement pgvector similarity search
2. Create RAG query function
3. Integrate with AI suggestion endpoint
4. Test retrieval quality

**Files:**
- `packages/logic/src/rag/retrieval.ts` - RAG implementation
- `apps/web/lib/api/ai.ts` - AI suggestion with RAG

**Implementation:**
```sql
-- Similarity search query
SELECT
  id,
  title,
  body_content,
  1 - (embedding <=> $1::vector(1536)) AS similarity
FROM moderation_posts
WHERE embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 5;
```

---

### 3.4 Fix Vector Embeddings (Feature 89)
**Priority:** MEDIUM - Already marked as stuck
**Estimated:** 3 hours (fixing worker timeouts)

**Tasks:**
1. Check embedding generation function
2. Verify OpenAI/embedding API integration
3. Add error handling for failed embeddings
4. Add retry logic for worker timeouts

**Files:**
- `packages/logic/src/ai/embeddings.ts` - Embedding generation
- `supabase/functions/generate_embedding.sql` - Database function

---

## Phase 4: Performance Optimization - ~2 days

### 4.1 Fix Application Load Time (Feature 93)
**Priority:** MEDIUM - User experience
**Estimated:** 4 hours

**Tasks:**
1. Profile page load with Lighthouse
2. Optimize bundle size (code splitting)
3. Implement lazy loading for components
4. Optimize database queries
5. Add loading skeletons

**Files:**
- `apps/web/next.config.js` - Optimize build
- `apps/web/features/queue/components/QueuePane.tsx` - Lazy load posts
- `apps/web/components/Skeleton.tsx` - Loading states

**Optimizations:**
```typescript
// Dynamic imports for heavy components
const PostDetail = dynamic(
  () => import('./features/posts/components/PostDetail'),
  { loading: () => <PostDetailSkeleton /> }
);

// Optimize queries with proper indexes
// Add query hints for pgvector
```

---

### 4.2 Fix UI Interaction Speed (Feature 94)
**Priority:** MEDIUM
**Estimated:** 3 hours

**Tasks:**
1. Profile React re-renders
2. Memoize expensive calculations
3. Use React.memo for components
4. Optimize state updates
5. Add useTransition for non-urgent updates

**Files:**
- `apps/web/features/queue/hooks/useOptimizedQueue.ts`
- `apps/web/features/posts/hooks/useOptimizedPost.ts`

**Optimizations:**
```typescript
// Memoize expensive computations
const filteredPosts = useMemo(() => {
  return applyFilters(posts, filters);
}, [posts, filters]);

// Use memo for components
export const PostCard = memo(PostCardComponent);

// useTransition for non-urgent updates
const [isPending, startTransition] = useTransition();
startTransition(() => {
  updateFilterState(newFilters);
});
```

---

### 4.3 Fix Virtual Scrolling for 10k Posts (Feature 192)
**Priority:** MEDIUM
**Estimated:** 4 hours

**Tasks:**
1. Implement react-window or react-virtualized
2. Replace current list with virtualized list
3. Test with 10,000 posts
4. Verify memory usage stays stable

**Files:**
- `apps/web/features/queue/components/VirtualizedQueue.tsx`
- `apps/web/features/queue/hooks/useVirtualizedPosts.ts`

**Implementation:**
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedQueue = ({ posts, height, width }) => (
  <List
    height={height}
    itemCount={posts.length}
    itemSize={80}
    width={width}
  >
    {({ index, style }) => (
      <PostCard post={posts[index]} style={style} />
    )}
  </List>
);
```

---

### 4.4 Fix Memory Stability (Feature 190)
**Priority:** MEDIUM
**Estimated:** 3 hours

**Tasks:**
1. Profile memory usage with Chrome DevTools
2. Fix memory leaks in event listeners
3. Clean up subscriptions on unmount
4. Optimize large data structures

**Files:**
- `apps/web/features/queue/hooks/useQueue.ts` - Add cleanup
- `apps/web/features/posts/hooks/usePost.ts` - Add cleanup

**Fixes:**
```typescript
useEffect(() => {
  const subscription = setupRealtimeSubscription();

  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

---

## Phase 5: Accessibility (A11y) - ~2 days

### 5.1 Implement Screen Reader Support (Feature 165)
**Priority:** MEDIUM - WCAG compliance
**Estimated:** 3 hours

**Tasks:**
1. Add semantic HTML to all components
2. Add ARIA labels to icon buttons
3. Implement live regions for updates
4. Test with screen reader

**Files:**
- `apps/web/features/queue/components/QueuePane.tsx` - Add landmarks
- `apps/web/features/posts/components/PostCard.tsx` - Add ARIA
- `apps/web/components/LiveRegion.tsx` - Announce updates

**Implementation:**
```tsx
// Icon button with ARIA label
<button aria-label="Assign post to me" onClick={handleAssign}>
  <UserPlusIcon />
</button>

// Live region for updates
<div role="status" aria-live="polite" aria-atomic="true">
  {updateMessage}
</div>
```

---

### 5.2 Implement ARIA Labels (Feature 166)
**Priority:** MEDIUM
**Estimated:** 2 hours

**Tasks:**
1. Add aria-label to all icon-only buttons
2. Add aria-expanded to dropdowns
3. Add aria-selected to list items
4. Add role attributes

**Files:**
- `apps/web/components/IconButton.tsx` - Add ARIA props
- `apps/web/features/queue/components/FilterDropdown.tsx` - Add ARIA

---

### 5.3 Fix Contrast Ratios (Feature 167)
**Priority:** MEDIUM
**Estimated:** 2 hours

**Tasks:**
1. Run axe-core audit
2. Fix low contrast text
3. Fix low contrast interactive elements
4. Verify 4.5:1 ratio for normal text

**Files:**
- `apps/web/tailwind.config.ts` - Adjust colors
- `apps/web/app/globals.css` - Fix custom styles

**Fixes:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Ensure sufficient contrast
        'slate-300': '#cbd5e1', // Lighter for better contrast
        'slate-400': '#94a3b8',
      }
    }
  }
}
```

---

### 5.4 Fix Tab Order (Feature 168)
**Priority:** MEDIUM
**Estimated:** 2 hours

**Tasks:**
1. Review tab order with keyboard navigation
2. Fix tabindex values
3. Implement focus trapping in modals
4. Add skip links

**Files:**
- `apps/web/features/layout/components/SkipLink.tsx`
- `apps/web/components/Modal.tsx` - Focus trap
- `apps/web/features/posts/components/PostDetail.tsx` - Tab order

---

### 5.5 Implement Reduced Motion (Feature 169)
**Priority:** LOW
**Estimated:** 1 hour

**Tasks:**
1. Add prefers-reduced-motion media queries
2. Disable animations when preference set
3. Test with reduced motion enabled

**Files:**
- `apps/web/app/globals.css` - Add media query

**CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Phase 6: Scalability & Concurrency - ~2 days

### 6.1 Fix Concurrent Operations (Feature 188)
**Priority:** MEDIUM
**Estimated:** 3 hours

**Tasks:**
1. Implement optimistic locking
2. Add conflict detection
3. Show conflict resolution UI
4. Test concurrent updates

**Files:**
- `supabase/migrations/00001_initial_schema.sql` - Add version column
- `apps/web/lib/api/posts.ts` - Add version checking
- `apps/web/features/posts/components/ConflictDialog.tsx`

**Implementation:**
```sql
-- Add version column to moderation_posts
ALTER TABLE moderation_posts ADD COLUMN version INTEGER DEFAULT 1;
```

```typescript
// Check version before update
const { data: current } = await supabase
  .from('moderation_posts')
  .select('version')
  .eq('id', postId)
  .single();

if (current.version !== expectedVersion) {
  throw new ConflictError('Post was modified by another agent');
}
```

---

### 6.2 Fix Database Indexes (Feature 189)
**Priority:** MEDIUM
**Estimated:** 2 hours

**Tasks:**
1. Verify all indexes exist
2. Run EXPLAIN on common queries
3. Add missing indexes
4. Test query performance

**Files:**
- `supabase/migrations/00001_initial_schema.sql` - Add indexes

**Missing indexes to add:**
```sql
-- Composite indexes for filtered queries
CREATE INDEX idx_posts_status_priority ON moderation_posts(status, priority);
CREATE INDEX idx_posts_assigned_status ON moderation_posts(assigned_to_id, status);

-- Covering index for queue queries
CREATE INDEX idx_posts_queue_covering ON moderation_posts
  (status, priority, created_at DESC)
  INCLUDE (title, excerpt, category_id, assigned_to_id);
```

---

### 6.3 Fix 100 Concurrent Agents (Feature 191)
**Priority:** MEDIUM
**Estimated:** 4 hours

**Tasks:**
1. Set up load testing infrastructure
2. Test with 100 simulated agents
3. Monitor Supabase connection limits
4. Optimize connection pooling
5. Add rate limiting

**Files:**
- `tests/load/100-agents.test.ts` - Load test
- `apps/web/lib/api/client.ts` - Connection pooling

**Load Test:**
```typescript
// tests/load/100-agents.test.ts
import { test, expect } from '@playwright/test';

test('100 concurrent agents', async ({ browser }) => {
  const agents = [];

  // Create 100 browser contexts
  for (let i = 0; i < 100; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    agents.push(page);
  }

  // Perform concurrent operations
  await Promise.all(agents.map(page =>
    page.goto('/queue')
  ));

  // Verify all loaded successfully
});
```

---

### 6.4 Fix Memory Under Load (Feature 190)
**Priority:** MEDIUM
**Estimated:** 2 hours

**Tasks:**
1. Profile with 100 concurrent users
2. Fix memory leaks
3. Optimize data structures
4. Add garbage collection hints

---

## Phase 7: Testing & Build - ~1 day

### 7.1 Fix Unit Tests (Feature 157)
**Priority:** MEDIUM
**Estimated:** 3 hours

**Tasks:**
1. Run `pnpm test`
2. Fix failing tests
3. Add missing tests
4. Ensure coverage thresholds

**Files:**
- `packages/logic/src/**/*.test.ts` - Unit tests
- `vitest.config.ts` - Coverage settings

---

### 7.2 Fix E2E Tests (Feature 158)
**Priority:** MEDIUM
**Estimated:** 4 hours

**Tasks:**
1. Run `pnpm test:e2e`
2. Fix failing E2E tests
3. Add missing critical path tests
4. Ensure tests are deterministic

**Files:**
- `tests/e2e/**/*.spec.ts` - E2E tests
- `playwright.config.ts` - Test configuration

---

### 7.3 Fix Production Build (Feature 160)
**Priority:** HIGH - Deployment blocker
**Estimated:** 2 hours

**Tasks:**
1. Run `pnpm build`
2. Fix build errors
3. Fix runtime errors in production mode
4. Test production build locally

**Files:**
- `apps/web/next.config.js` - Build configuration
- `apps/web/package.json` - Dependencies

---

## Phase 8: Environment & Polish - ~0.5 day

### 8.1 Fix Environment Validation (Feature 161)
**Priority:** LOW
**Estimated:** 1 hour

**Tasks:**
1. Verify env validation logic
2. Test with missing env vars
3. Update .env.example

**Files:**
- `apps/web/lib/env.ts` - Validation
- `apps/web/.env.example` - Documentation

---

## Total Time Estimate

| Phase | Features | Time Estimate |
|-------|----------|---------------|
| 1. Security & Access | 5 | 14 hours (1.75 days) |
| 2. Real-time | 4 | 12 hours (1.5 days) |
| 3. Database & Infrastructure | 4 | 13 hours (1.6 days) |
| 4. Performance | 4 | 14 hours (1.75 days) |
| 5. Accessibility | 5 | 10 hours (1.25 days) |
| 6. Scalability | 4 | 11 hours (1.4 days) |
| 7. Testing & Build | 3 | 9 hours (1.1 days) |
| 8. Environment | 1 | 1 hour (0.1 days) |
| **TOTAL** | **30** | **84 hours (10.5 days)** |

---

## Daily Work Plan

### Week 1
- **Day 1:** Phase 1 - Security & Access Control (Features 62, 63, 64, 149, 150)
- **Day 2:** Phase 2 - Real-time Synchronization (Features 67, 68, 88, 193)
- **Day 3:** Phase 3 - Database & Infrastructure (Features 89, 90, 91, 92)
- **Day 4:** Phase 4 - Performance Optimization (Features 93, 94, 190, 192)
- **Day 5:** Phase 5 - Accessibility (Features 165, 166, 167, 168, 169)

### Week 2
- **Day 6:** Phase 6 - Scalability (Features 188, 189, 191)
- **Day 7:** Phase 7 - Testing & Build (Features 157, 158, 160)
- **Day 8:** Phase 8 - Environment (Feature 161) + Integration testing
- **Day 9:** Bug fixes and polish
- **Day 10:** Final QA and deployment preparation

---

## Key Files to Modify

### Database
- `supabase/migrations/00001_initial_schema.sql` - Add indexes, version column
- `supabase/migrations/00002_rls_policies.sql` - Fix RLS policies
- `supabase/seed.sql` - Add seed data

### Backend/Logic
- `packages/logic/src/rag/retrieval.ts` - RAG implementation
- `packages/logic/src/ai/embeddings.ts` - Embedding generation
- `packages/logic/src/validation/index.ts` - Validation schemas

### Frontend
- `apps/web/lib/realtime.ts` - Realtime subscriptions
- `apps/web/lib/sanitize.ts` - XSS sanitization
- `apps/web/lib/csrf.ts` - CSRF protection
- `apps/web/features/queue/` - Queue components
- `apps/web/features/posts/` - Post components
- `apps/web/features/admin/` - Admin components

### Tests
- `tests/security/xss.test.ts` - XSS tests
- `tests/security/csrf.test.ts` - CSRF tests
- `tests/api/rls.test.ts` - RLS tests
- `tests/load/100-agents.test.ts` - Load tests

---

## Risk Mitigation

### Risk 1: Worker Session Timeouts
**Mitigation:**
- Increase timeout limits in test configuration
- Optimize long-running operations
- Add progress indicators for async operations

### Risk 2: Supabase Connection Limits
**Mitigation:**
- Implement connection pooling
- Use Supabase connection pooling config
- Add exponential backoff for retries

### Risk 3: Complex RLS Policies
**Mitigation:**
- Test RLS policies incrementally
- Add debug logging for policy evaluation
- Use Supabase SQL editor to test policies

### Risk 4: Performance Degradation
**Mitigation:**
- Profile before and after each optimization
- Use React DevTools profiler
- Monitor bundle size

---

## Success Criteria

All 30 features must pass with:
- ✅ `passes: true`
- ✅ `is_dev_done: true`
- ✅ `is_qa_passed: true`
- ✅ No `is_stuck: true`
- ✅ No `dev_failure_count > 0` (or acceptable retries)

---

## Notes

1. **Worker Timeouts:** Many features show "Worker session timed out" errors. This may indicate:
   - Tests need longer timeouts
   - Implementations are inefficient
   - Worker environment has resource constraints

2. **QA Reports:** Check `modus/qa-reports/feature-{XX}-*.json` for detailed failure information

3. **Git History:** Use `git log --oneline -20` to see recent changes and patterns

4. **Test Environment:** Ensure `.env.local` has all required variables before testing

5. **Supabase:** Ensure Supabase local instance is running for testing:
   ```bash
   supabase start
   supabase status
   ```

---

## Quick Wins (Low Effort, High Impact)

1. **Feature 161** (Env validation) - 1 hour
2. **Feature 169** (Reduced motion) - 1 hour
3. **Feature 166** (ARIA labels) - 2 hours
4. **Feature 167** (Contrast ratios) - 2 hours

These 4 features can be completed in ~6 hours and improve accessibility and polish.

---

## Next Steps

1. Start with **Phase 1: Security & Access Control** (Days 1-2)
2. Move to **Phase 2: Real-time Synchronization** (Days 3-4)
3. Continue through remaining phases in order
4. Run QA tests after each feature is implemented
5. Update `feature_list.json` with new status
6. Commit changes after each feature completion

**Command to check progress:**
```bash
FAILING=$(grep -c '"passes": false' feature_list.json) && \
TOTAL=$(grep -c '"passes":' feature_list.json) && \
echo "Progress: $((TOTAL - FAILING)) / $TOTAL features passing"
```
