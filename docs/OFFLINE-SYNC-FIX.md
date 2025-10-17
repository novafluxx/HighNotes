# Offline Sync Fix - Issue Resolution

**Date**: October 16, 2025  
**Issue**: Offline syncing not working when network access is restored  
**Status**: ✅ Fixed (with hotfix for temporal dead zone)

## Problem Analysis

### Root Cause
The offline sync mechanism had two critical issues:

1. **Missing `immediate: true` on isOnline watcher**: The watcher that monitors online status changes didn't run when the component mounted if the user was already online. This meant:
   - Users who logged in while online never triggered `syncPendingQueue()`
   - Queued operations from previous sessions remained unsynced

2. **No sync trigger on user login**: When a user logged in while already online, there was no mechanism to sync their pending queue. The sync only ran when transitioning from offline → online.

### Hotfix: Temporal Dead Zone Issue
**Date**: October 16, 2025  
**Error**: "Cannot access 'syncPendingQueue' before initialization"

**Issue**: After adding `immediate: true` to watchers, the watchers were defined BEFORE the `syncPendingQueue` function, causing a temporal dead zone (TDZ) violation when the immediate callbacks tried to call the function.

**Fix**: Moved both watchers to after the `syncPendingQueue` function definition (now at lines 690-714).

### Code Location
File: `app/composables/useNotes.ts`

**Before:**
```typescript
// Line 702-708 (old)
watch(isOnline, (online) => {
  if (online) {
    syncPendingQueue();
    fetchNotes(false, searchQuery.value || null);
  }
});

// Line 291-301 (old)
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    fetchNotes(false);
  } else if (!currentUser && previousUser) {
    // ... cleanup
  }
}, { immediate: true });
```

## Solution Implemented

### Fix #1: Add `immediate: true` to isOnline Watcher
```typescript
watch(isOnline, (online, wasOnline) => {
  if (online && !wasOnline) {
    syncPendingQueue();
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });
```

**Why this works:**
- `immediate: true` runs the watcher callback immediately on mount
- The condition `online && !wasOnline` ensures sync only runs on transitions to online (not repeatedly)
- On first run with `immediate: true`, `wasOnline` is `undefined`, so `!wasOnline` is `true`
- This catches users who are already online when the page loads

### Fix #2: Trigger Sync on User Login
```typescript
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    fetchNotes(false);
    // Trigger sync if user logs in while already online
    if (isOnline.value) {
      syncPendingQueue();
    }
  } else if (!currentUser && previousUser) {
    // ... cleanup
  }
}, { immediate: true });
```

**Why this works:**
- Detects user login events (`currentUser && !previousUser`)
- Explicitly checks if already online and triggers sync
- Covers the scenario: "User has queued operations → User closes app → User opens app later (still online) → User logs in"

## Sync Flow After Fix

### Scenario 1: User Already Online at Page Load
1. Page loads → `useNotes()` composable initializes
2. `watch(isOnline, ...)` runs immediately due to `immediate: true`
3. Since `isOnline.value === true` and `wasOnline === undefined`, sync triggers
4. Queue is processed, pending operations sync to server

### Scenario 2: User Goes Offline → Online
1. User saves notes while offline → Operations queued in IndexedDB
2. Network restored → `isOnline` changes from `false` to `true`
3. Watcher detects transition (`online && !wasOnline`)
4. `syncPendingQueue()` processes all queued operations FIFO
5. Local IDs replaced with server IDs via `replaceLocalId()`

### Scenario 3: User Logs In While Online
1. User opens app (online but not logged in)
2. User logs in → `user` changes from `null` to `User`
3. Watcher detects login (`currentUser && !previousUser`)
4. Check `isOnline.value` → `true`
5. Trigger `syncPendingQueue()` to sync any pending operations from previous session

### Scenario 4: User Logs In After Going Online
1. App starts offline → User creates notes (queued)
2. Network restored → `isOnline` triggers sync attempt
3. But user not logged in → `syncPendingQueue()` returns early (guard clause)
4. User logs in → Second watcher catches this
5. Since `isOnline.value === true`, sync runs successfully

## Testing Checklist

To verify the fix works:

### Test 1: Already Online Login
- [ ] Open browser DevTools → Network tab
- [ ] Disconnect network (Offline mode)
- [ ] Open app → Create/edit notes → Save (queued locally)
- [ ] Reconnect network
- [ ] Refresh page → Log in
- [ ] **Expected**: Notes sync automatically within 1-2 seconds
- [ ] **Verify**: Check browser console for sync messages (if logging enabled)
- [ ] **Verify**: Check IndexedDB → `queue` store should be empty

### Test 2: Offline → Online Transition
- [ ] Log in while online
- [ ] Open browser DevTools → Network → Go offline
- [ ] Create/edit notes → Save (queued)
- [ ] Go back online (toggle in DevTools)
- [ ] **Expected**: Notes sync immediately without refresh
- [ ] **Verify**: Notes list refreshes with server timestamps
- [ ] **Verify**: Local IDs (`local-<uuid>`) replaced with real UUIDs

### Test 3: Multiple Queue Items
- [ ] Go offline
- [ ] Create 3 new notes
- [ ] Edit 2 existing notes
- [ ] Delete 1 note
- [ ] Go online
- [ ] **Expected**: All 6 operations sync in FIFO order
- [ ] **Verify**: No duplicate notes created
- [ ] **Verify**: Deleted note doesn't reappear

### Test 4: Page Reload While Online
- [ ] Queue some operations while offline
- [ ] Stay offline → Close tab
- [ ] Reconnect network
- [ ] Open app again → Log in
- [ ] **Expected**: Sync happens automatically after login
- [ ] **Verify**: Queue cleared, operations persisted

## Additional Improvements

### Guard Clause in syncPendingQueue
The function already has proper guards:
```typescript
if (!isOnline.value || !isLoggedIn.value || !user.value || syncing.value) return;
```

This prevents:
- ❌ Syncing while offline
- ❌ Syncing without authentication
- ❌ Concurrent sync operations (race conditions)
- ✅ Only one sync runs at a time

### FIFO Queue Processing
The queue processing maintains order:
1. Reads queue sorted by `timestamp` (oldest first)
2. Processes items sequentially (not parallel)
3. Tracks local→server ID mappings within the run
4. Re-runs if items were skipped (waiting for ID remapping)

### Error Handling
On sync failure:
- Stops processing (preserves queue order)
- Leaves failed items in queue for retry
- Next online transition or login will retry

## Related Files

- `app/composables/useNotes.ts` - Main fix location (lines 291-305, 706-712)
- `app/composables/useOfflineNotes.ts` - Queue management (no changes needed)
- `supabase/functions/save-note/index.ts` - Server endpoint (no changes needed)

## Performance Considerations

### No Performance Regression
- `immediate: true` adds one extra watcher call on mount
- The guard clause `if (online && !wasOnline)` prevents redundant syncs
- Sync is already debounced by the `syncing` flag
- No additional network requests beyond necessary syncs

### Memory Impact
- Watchers are cleaned up automatically when component unmounts
- `onScopeDispose` already handles realtime channel cleanup
- No memory leaks introduced

## Migration Notes

**No breaking changes** - This is a pure bug fix:
- ✅ Existing queue items still process correctly
- ✅ Local ID format unchanged (`local-<uuid>`)
- ✅ Server API contract unchanged
- ✅ IndexedDB schema unchanged

## Deployment

### Steps
1. Commit changes to `app/composables/useNotes.ts`
2. Deploy via standard deployment process (e.g., `pnpm build && deploy`)
3. No database migrations needed
4. No environment variable changes needed
5. Users benefit immediately on next page load

### Rollback
If issues occur:
```bash
git revert <commit-hash>
pnpm build && deploy
```

The queue will remain intact and retry on next online transition.

---

**Fix verified by**: Code review and architectural analysis  
**Tested by**: [Pending - use checklist above]  
**Approved by**: [Pending]
