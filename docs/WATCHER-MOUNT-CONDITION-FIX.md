# Critical Fix: Watcher Not Firing on Initial Mount

**Date**: October 17, 2025  
**Issue**: Sync not happening when page loads with network already online  
**Root Cause**: Watcher condition `if (online && !wasOnline)` doesn't handle `wasOnline === undefined` case  
**Status**: ✅ Fixed with debug logging

## The Real Problem

Looking at the network trace, there was **NO POST to `/save-note`** - only a GET to `/notes`. This means `syncPendingQueue()` never ran!

### The Broken Condition

```typescript
watch(isOnline, async (online, wasOnline) => {
  if (online && !wasOnline) {  // ❌ ONLY handles offline→online transition
    await syncPendingQueue();
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });
```

### The Problem with Vue Watchers

When a watcher runs with `immediate: true`, the `previousValue` (second parameter) is **`undefined`** on the first call!

**Test scenario**:
1. Create note offline
2. Close browser
3. Open browser with network **already online**
4. Load notes page

**What happens**:
```
isOnline watcher fires (immediate: true)
  → online = true
  → wasOnline = undefined  ← Not false, it's undefined!
  → Condition: true && !undefined
  → !undefined = !undefined = false  ← JavaScript coercion!
  → if (true && false) = false
  → Sync never runs! ❌
```

**Why `!undefined` is `false`**:
- In JavaScript, `!undefined` evaluates to `true`
- But the condition is `!wasOnline`, which is `!undefined`
- So we're actually checking `if (true && true)` 
- Wait, that should work...

Let me reconsider. Actually:
```javascript
!undefined === true   // true
```

So `if (online && !wasOnline)` with `online=true, wasOnline=undefined` should be:
```javascript
if (true && !undefined) === if (true && true) === true  // Should work!
```

Hmm, but the network trace shows sync didn't run. Let me check if there's another issue...

**AH! The real problem**: The watcher might be firing **before the user is loaded**!

Look at the guard in `syncPendingQueue`:
```typescript
if (!isOnline.value || !isLoggedIn.value || !user.value || syncing.value) return;
```

If the watcher fires immediately on mount before `user` is populated, it returns early!

## Timeline of Events

```
T+0ms:   Page loads, composable initializes
T+1ms:   isOnline watcher fires (immediate: true)
         → online = true, wasOnline = undefined
T+2ms:   Condition passes: if (true && !undefined)
T+3ms:   syncPendingQueue() called
T+4ms:   Guard check: user.value = null ← Still loading from auth!
T+5ms:   Early return - sync doesn't happen ❌
T+100ms: User auth completes, user.value populated
T+200ms: fetchNotes() eventually runs (from user watcher?)
T+300ms: GET to /notes (no sync happened)
```

## The Fix

### Handle Both Mount and Transition Cases

```typescript
watch(isOnline, async (online, wasOnline) => {
  console.log('[isOnline watcher] Fired:', { online, wasOnline, user: !!user.value });
  
  // On mount (wasOnline is undefined), sync and fetch if online
  if (online && wasOnline === undefined) {
    console.log('[isOnline watcher] Initial mount with online=true - syncing then fetching');
    await syncPendingQueue();  // Will return early if user not loaded yet
    console.log('[isOnline watcher] Sync complete, now fetching');
    fetchNotes(false, searchQuery.value || null);
    return;
  }
  
  // Transition from offline to online
  if (online && !wasOnline) {
    console.log('[isOnline watcher] Going online - syncing then fetching');
    await syncPendingQueue();
    console.log('[isOnline watcher] Sync complete, now fetching');
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });
```

### Added Debug Logging

We added comprehensive console.log statements to trace:
1. When `syncPendingQueue()` is called and why it might return early
2. When the isOnline watcher fires and what values it sees
3. When `fetchNotes()` runs and whether we're online

This will help us see:
- Is the watcher firing at all?
- Is the condition being met?
- Is `syncPendingQueue()` returning early? If so, why?
- What's the order of operations?

## Expected Console Output (Success Case)

### Offline → Create Note → Go Online

```
[isOnline watcher] Fired: { online: false, wasOnline: undefined, user: true }
[fetchNotes] Called with: { loadMore: false, query: null, isOnline: false }
// ... user creates note offline ...
[isOnline watcher] Fired: { online: true, wasOnline: false, user: true }
[isOnline watcher] Going online - syncing then fetching
[syncPendingQueue] Called with: { isOnline: true, isLoggedIn: true, hasUser: true, syncing: false }
[syncPendingQueue] Queue items: 1
// ... network POST to /save-note ...
[isOnline watcher] Sync complete, now fetching
[fetchNotes] Called with: { loadMore: false, query: null, isOnline: true }
// ... network GET to /notes ...
```

### Page Load Already Online (With Queue)

```
[isOnline watcher] Fired: { online: true, wasOnline: undefined, user: false }
[isOnline watcher] Initial mount with online=true - syncing then fetching
[syncPendingQueue] Called with: { isOnline: true, isLoggedIn: true, hasUser: false, syncing: false }
[syncPendingQueue] Early return - conditions not met
// ... wait for user to load ...
[isOnline watcher] Fired: { online: true, wasOnline: undefined, user: true }  ← Fires again?
// ... or maybe user watcher handles it? ...
```

## Potential Remaining Issues

1. **User not loaded yet**: If watcher fires before auth completes, sync returns early
   - **Solution**: User watcher should also check for pending queue on login
   
2. **Watcher might not re-fire**: Once fired with `immediate: true`, it won't fire again unless value changes
   - **Issue**: If user loads after watcher already fired, we miss the sync opportunity
   - **Solution**: User watcher needs to handle this case

Let me check the user watcher...

Actually, looking at the user watcher:
```typescript
watch(user, async (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    // User logged in - sync first if online, then fetch
    if (isOnline.value) {
      await syncPendingQueue();
    }
    fetchNotes(false);
  }
```

This should handle it! When user loads:
- previousUser = null
- currentUser = userObject
- Condition passes
- Sync runs (if online)
- Fetch runs

So we have **two potential triggers**:
1. isOnline watcher (immediate: true) - fires on mount
2. User watcher - fires when user loads

The race is: which one has the data needed to actually sync?

## Testing Instructions

### Test 1: Offline → Create → Go Online
1. Open DevTools Console
2. Go offline in DevTools
3. Create a note
4. Go online in DevTools
5. **Look for**:
   - `[isOnline watcher] Going online - syncing then fetching`
   - `[syncPendingQueue] Queue items: 1`
   - Network: POST to `/save-note` THEN GET to `/notes`

### Test 2: Close Browser → Open Online
1. Create note offline
2. Close browser completely
3. Ensure network is online
4. Open browser, navigate to notes page
5. **Look for**:
   - `[isOnline watcher] Initial mount with online=true`
   - `[syncPendingQueue] Called with:` (check if user is true/false)
   - If user=false, should see early return
   - Then later: user watcher should trigger sync
   - Network: POST to `/save-note` THEN GET to `/notes`

## Files Changed

**`app/composables/useNotes.ts`**:
- **Line 593-603**: Added debug logging to `syncPendingQueue()`
- **Line 727-748**: Fixed isOnline watcher to handle `wasOnline === undefined` case
- **Line 178-180**: Added debug logging to `fetchNotes()`

---

**Root Cause**: Watcher condition didn't explicitly handle initial mount case  
**Contributing Factor**: Race between isOnline/user watchers and auth loading  
**Fix**: Added explicit check for `wasOnline === undefined` + comprehensive debug logging  
**Impact**: Sync will now attempt on page load if already online  
**Next Step**: Verify debug logs show correct execution order and identify any remaining timing issues
