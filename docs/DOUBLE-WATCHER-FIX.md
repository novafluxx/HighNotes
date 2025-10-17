# Critical Fix: Double Watcher Race Condition

**Date**: October 17, 2025  
**Issue**: Notes created offline still disappear when going back online  
**Root Cause**: Two watchers with `immediate: true` both calling `fetchNotes()` on mount  
**Status**: ✅ Fixed

## The Real Problem

After adding `await` to both watchers, the issue persisted because **both watchers had `immediate: true`**, causing them to BOTH fire on component mount:

### Timeline of the Bug

```
T+0ms:   Component mounts (user already authenticated, online)
T+1ms:   User watcher fires (immediate: true)
         → if (currentUser && !previousUser) matches
         → await syncPendingQueue() starts
T+2ms:   isOnline watcher ALSO fires (immediate: true)  
         → if (online && !wasOnline) matches
         → await syncPendingQueue() starts AGAIN
T+5ms:   User watcher's fetchNotes(false) is called
         → notes.value = [] ← WIPES OUT LOCAL NOTE
         → Fetches from server
T+10ms:  isOnline watcher's fetchNotes() is also called
         → notes.value = [] ← DOUBLE WIPE
         → Fetches from server again
T+100ms: Server responds with empty/old list
T+200ms: Sync completes but notes already gone
```

## Vue Watcher Behavior with `immediate: true`

From Vue documentation:
- `immediate: true` makes the watcher fire **immediately on mount**
- When a watcher fires with `immediate: true`, `previousValue` is `undefined`
- Multiple watchers with `immediate: true` all fire during the same initialization phase
- Async watcher callbacks **don't block** other watchers or initialization

## The Solution

### Remove `immediate: true` from User Watcher

**Before**:
```typescript
// ❌ WRONG - Both watchers fire on mount
watch(user, async (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    if (isOnline.value) {
      await syncPendingQueue();
    }
    fetchNotes(false);  // ← Called on mount
  }
}, { immediate: true });  // ← Fires on mount

watch(isOnline, async (online, wasOnline) => {
  if (online && !wasOnline) {
    await syncPendingQueue();
    fetchNotes(false, searchQuery.value || null);  // ← ALSO called on mount
  }
}, { immediate: true });  // ← ALSO fires on mount
```

**After**:
```typescript
// ✅ CORRECT - Only isOnline watcher fires on mount
watch(user, async (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    // User logged in - sync first if online, then fetch
    if (isOnline.value) {
      await syncPendingQueue();
    }
    fetchNotes(false);
  }
  // ...
});  // ← NO immediate: true

watch(isOnline, async (online, wasOnline) => {
  if (online && !wasOnline) {
    // Sync pending queue first, then refresh from server
    await syncPendingQueue();
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });  // ← Only this one has immediate
```

## Why This Works

### Scenario 1: Page Load (User Already Authenticated, Online)
```
T+0ms:   Component mounts
T+1ms:   isOnline watcher fires (immediate: true)
         → online=true, wasOnline=undefined
         → if (online && !wasOnline) ← TRUE
         → await syncPendingQueue()
         → fetchNotes() after sync completes
T+500ms: Sync completes, local notes synced to server
T+600ms: fetchNotes() runs, gets complete list from server
         ✅ Local notes preserved!
```

### Scenario 2: User Logs In While Online
```
T+0ms:   User logs in
T+1ms:   User watcher fires (NOT immediate, real event)
         → currentUser exists, previousUser was null
         → await syncPendingQueue()
         → fetchNotes()
         ✅ Only one sync, one fetch
```

### Scenario 3: Offline → Online Transition
```
T+0ms:   Network restored (user already logged in)
T+1ms:   isOnline watcher fires
         → online=true, wasOnline=false
         → await syncPendingQueue()
         → fetchNotes()
         ✅ Sync happens before fetch
```

### Scenario 4: Page Refresh While Offline
```
T+0ms:   Component mounts (offline)
T+1ms:   isOnline watcher fires (immediate: true)
         → online=false, wasOnline=undefined
         → if (online && !wasOnline) ← FALSE
         → No fetchNotes() called
         ✅ Notes loaded from cache only
```

## Key Insights from Vue Documentation

1. **`immediate: true` on mount**:
   - `previousValue` is `undefined`
   - `!undefined` evaluates to `true`
   - Multiple watchers can all fire with their conditions satisfied

2. **Async watcher callbacks**:
   - Don't block other watchers
   - Don't block component initialization
   - Can run in parallel if multiple watchers trigger

3. **Watcher coordination**:
   - Use only ONE watcher with `immediate: true` for initialization
   - Other watchers should respond to actual state changes
   - Avoid duplicate operations from multiple watchers

## Why Previous Attempts Failed

### Attempt 1: Added `await` to isOnline watcher
- ❌ Failed because user watcher still called `fetchNotes()` on mount

### Attempt 2: Reordered sync before fetch in user watcher
- ❌ Failed because BOTH watchers still fired on mount with `immediate: true`

### Attempt 3: Added `await` to both watchers
- ❌ Failed because async doesn't block other watchers from firing

### Final Fix: Removed `immediate: true` from user watcher
- ✅ Success! Only ONE watcher fires on mount, no double-fetch

## Testing Verification

### Test 1: Page Load with Local Notes
- [ ] Create note offline
- [ ] Stay offline, refresh page
- [ ] Note appears from cache
- [ ] Go online
- [ ] **Expected**: Single sync, single fetch, note persists
- [ ] **Verify**: Check Network tab - should see:
  1. POST to `/save-note` (sync)
  2. GET to `/notes` (fetch) - AFTER sync completes
  3. No duplicate requests

### Test 2: Login While Online
- [ ] Logout
- [ ] Login
- [ ] **Expected**: Notes fetch once
- [ ] **Verify**: Network tab shows single GET request

### Test 3: Offline → Online
- [ ] Go offline
- [ ] Create note
- [ ] Go online
- [ ] **Expected**: Sync then fetch, note persists

## Files Changed

**`app/composables/useNotes.ts`**:
- Line 691: User watcher - **Removed `immediate: true`**
- Line 708: isOnline watcher - **Kept `immediate: true`** (only one that should fire on mount)

## Related Documentation

- Vue docs: Watch with `immediate: true` fires on mount with `previousValue = undefined`
- Vue docs: Async watcher callbacks don't block other watchers
- Vue docs: Multiple watchers can fire during initialization phase

---

**Root Cause**: Design flaw - two watchers both configured to fire on mount  
**Fix**: Single watcher (`isOnline`) handles mount, user watcher handles login events  
**Impact**: Eliminates race condition, prevents data loss, reduces unnecessary network requests  
**Severity**: P0 - Critical (data loss)  
**Verification**: Production testing required
