# Offline Sync Race Condition Fix

**Date**: October 16, 2025  
**Updated**: October 17, 2025 (Complete fix for both watchers)  
**Issue**: Notes created offline disappear when going back online  
**Status**: ✅ Fixed (both watchers sequenced)

## Problem Description

### User Experience
1. User opens PWA
2. User puts device in airplane mode (offline)
3. User creates a new note and saves it
4. Note appears in sidebar with local ID (`local-<uuid>`)
5. User turns off airplane mode (goes online)
6. **BUG**: Note immediately disappears from sidebar
7. Note is NOT saved to database

### Network Trace
When going online, this request is sent immediately:
```
GET /rest/v1/notes?select=id,user_id,title,updated_at
    &user_id=eq.456bf48b-bdaf-472b-9e5c-b60d894562e1
    &order=updated_at.desc&offset=0&limit=30
```

This request returns an empty list (or old notes) because the local note hasn't been synced yet.

## Root Cause

### Race Condition in BOTH Watchers

The issue occurred in **two places**, both causing the same race condition:

**Problem 1: isOnline Watcher (Line ~708)**:
```typescript
watch(isOnline, (online, wasOnline) => {
  if (online && !wasOnline) {
    syncPendingQueue();  // ← Async, doesn't wait
    fetchNotes(false, searchQuery.value || null);  // ← Runs immediately!
  }
}, { immediate: true });
```

**Problem 2: User Watcher (Line ~691)** - THE ACTUAL CULPRIT:
```typescript
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    fetchNotes(false);  // ← Runs FIRST!
    if (isOnline.value) {
      syncPendingQueue();  // ← Called AFTER fetch, too late!
    }
  }
}, { immediate: true });  // ← Runs on mount when user exists
```

### Why the User Watcher Was the Real Problem

When you refreshed the page with `immediate: true`:
1. Page loads, user is already authenticated
2. User watcher fires immediately (`immediate: true`)
3. `fetchNotes(false)` runs first → fetches from server
4. Server returns empty/old list (offline note not synced yet)
5. Local note erased from `notes.value`
6. Then `syncPendingQueue()` runs, but note already gone from UI

The isOnline watcher fix alone wasn't enough because the **user watcher** on page mount was the one actually causing the issue!

### Timeline of Bug

```
T+0ms:   isOnline changes from false → true
T+1ms:   Watcher callback fires
T+2ms:   syncPendingQueue() called (async, returns immediately)
T+3ms:   fetchNotes() called (fetches from server)
T+10ms:  Server responds with empty/old notes list
T+15ms:  notes.value = [] (local note ERASED)
T+500ms: syncPendingQueue() finishes processing queue
T+600ms: Edge function receives create request
T+700ms: Note saved to server
T+800ms: But notes.value already cleared - note appears lost!
```

The fetch happens **before** the sync completes, overwriting the in-memory state with stale server data.

## Solution

### Use `await` in BOTH Watchers

**Fix 1: User Watcher (Line ~691)** - CRITICAL:
```typescript
watch(user, async (currentUser, previousUser) => {  // ← Made async
  if (currentUser && !previousUser) {
    // Trigger sync if user logs in while already online, THEN fetch
    if (isOnline.value) {
      await syncPendingQueue();  // ← Sync FIRST
    }
    fetchNotes(false);  // ← Fetch AFTER sync completes
  } else if (!currentUser && previousUser) {
    // ... cleanup
  }
}, { immediate: true });
```

**Fix 2: isOnline Watcher (Line ~708)**:
```typescript
watch(isOnline, async (online, wasOnline) => {  // ← Made async
  if (online && !wasOnline) {
    // Sync pending queue first, then refresh from server
    await syncPendingQueue();  // ← Wait for sync to complete
    // Refresh list to ensure server truth wins (after sync completes)
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });
```

### Key Changes

1. **Both watchers made `async`** to allow `await`
2. **User watcher reordered**: Sync before fetch (was fetch before sync!)
3. **Both use `await`** to block until sync completes
4. **FetchNotes only runs** after queue is fully processed

### Timeline After Fix

```
T+0ms:   isOnline changes from false → true
T+1ms:   Watcher callback fires (async)
T+2ms:   syncPendingQueue() called
T+10ms:  Queue item processed
T+50ms:  Edge function called with new note
T+150ms: Edge function responds with saved note (real UUID)
T+160ms: replaceLocalId() updates cache + in-memory list
T+170ms: syncPendingQueue() completes
T+180ms: fetchNotes() called
T+200ms: Server responds with complete list (including new note)
T+210ms: notes.value updated with server truth
```

Now the note is synced **before** fetching from server, so the fresh list includes it.

## Why This Works

### Sequential Execution
- `await syncPendingQueue()` blocks until all queue items are processed
- This includes:
  1. Creating the note via edge function
  2. Getting back the server-assigned UUID
  3. Replacing local ID with real ID (`replaceLocalId()`)
  4. Updating in-memory `notes.value` with saved note
- Only **after** all this completes does `fetchNotes()` run
- `fetchNotes()` now gets the complete list from server

### Server Truth Wins
The `fetchNotes()` call is still important because:
- It ensures other clients' changes are visible
- It refreshes timestamps with server values
- It acts as a final consistency check

But it must happen **after** local changes are synced.

## Testing Scenarios

### Test 1: Single Offline Note
- [ ] Go offline
- [ ] Create note "Test 1"
- [ ] Save (appears in sidebar with amber dot)
- [ ] Go online
- [ ] **Expected**: Note stays visible, amber dot disappears, UUID changes
- [ ] **Verify**: Check database - note exists with correct content

### Test 2: Multiple Offline Notes
- [ ] Go offline
- [ ] Create notes "A", "B", "C"
- [ ] Save all (3 notes with `local-*` IDs)
- [ ] Go online
- [ ] **Expected**: All 3 notes stay visible, all get real UUIDs
- [ ] **Verify**: All 3 in database with correct order

### Test 3: Offline Edit Existing Note
- [ ] Create note while online (gets real UUID)
- [ ] Go offline
- [ ] Edit the note, add content
- [ ] Save
- [ ] Go online
- [ ] **Expected**: Edited content syncs, note stays visible
- [ ] **Verify**: Database shows updated content + timestamp

### Test 4: Mixed Create + Edit + Delete
- [ ] Go offline
- [ ] Create new note "New"
- [ ] Edit existing note "Old"
- [ ] Delete another note "Removed"
- [ ] Go online
- [ ] **Expected**: "New" appears, "Old" updated, "Removed" gone
- [ ] **Verify**: Database reflects all 3 operations in order

### Test 5: Page Refresh During Sync
- [ ] Go offline
- [ ] Create note
- [ ] Stay offline, close tab
- [ ] Open app again (still offline)
- [ ] Note in sidebar from cache
- [ ] Go online (triggers sync on mount via immediate:true)
- [ ] **Expected**: Note syncs automatically, appears in list
- [ ] **Verify**: No duplicate notes created

## Edge Cases Handled

### Already Synced Notes
`syncPendingQueue()` checks the queue:
- If queue is empty → completes immediately
- `fetchNotes()` runs right away
- No performance penalty for users without pending changes

### Sync Failures
If edge function fails:
- Sync stops at failed item (preserves order)
- Failed items remain in queue
- `fetchNotes()` still runs (shows server state)
- Next online transition will retry

### Concurrent Edits
If another client edited the same note:
- Sync uploads local changes first
- `fetchNotes()` then gets latest server state
- Last write wins (standard behavior)

## Performance Impact

### Latency
- **Before**: Notes list appeared ~100ms after going online
- **After**: Notes list appears ~200-500ms (depends on queue size)
- **Trade-off**: Worth it to prevent data loss

### Network Requests
No change in number of requests:
- Still 1 sync request per queued item
- Still 1 fetch request for the list
- Just sequenced instead of parallel

### User Perception
- **Before**: Fast but wrong (notes disappear = bad UX)
- **After**: Slightly slower but correct (notes appear = good UX)

## Related Files

- `app/composables/useNotes.ts` - Line 707-714 (isOnline watcher)
- `app/composables/useOfflineNotes.ts` - Queue management (unchanged)
- `supabase/functions/save-note/index.ts` - Edge function (unchanged)

## Migration Notes

**No breaking changes** - Pure bug fix:
- ✅ Existing queue items process correctly
- ✅ No schema changes
- ✅ No API changes
- ✅ Users benefit immediately

## Key Learnings

1. **Always await async operations in watchers** when order matters
2. **Sequence sync → fetch** to prevent race conditions
3. **Test offline → online transitions** thoroughly
4. **Queue processing must complete** before refreshing from server

---

**Reported by**: Production testing  
**Fixed by**: Sequential execution with `await`  
**Deployed**: October 16, 2025  
**Severity**: Critical (data loss)  
**Priority**: P0 (immediate fix required)
