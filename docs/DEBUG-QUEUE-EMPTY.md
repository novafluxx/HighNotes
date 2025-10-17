# Debug Logging: Queue Empty Investigation

**Date**: October 17, 2025  
**Issue**: Queue shows 0 items when going online, despite note created offline  
**Status**: 🔍 Debugging with comprehensive logging

## What We Know So Far

From the console/network screenshots:
1. ✅ isOnline watcher fires correctly (false → true)
2. ✅ syncPendingQueue is called with all conditions met
3. ❌ **Queue items: 0** ← No items to sync!
4. ❌ No POST to `/save-note` (because queue is empty)
5. ✅ Only GET to `/notes` happens (fetchNotes after "sync" completes)

## Root Cause Hypothesis

**The note is never being added to the IndexedDB queue in the first place!**

Possible reasons:
1. `saveNote()` isn't being called when offline
2. `saveNote()` is taking the online path instead of offline path
3. `enqueue()` is failing silently
4. IndexedDB write is failing
5. The note is being saved to cache but not queue
6. `isOnline.value` is returning `true` even when throttled to offline

## Added Debug Logging

### In `useNotes.ts`

**`saveNote()` function (line ~427)**:
```typescript
console.log('[saveNote] Called with:', { 
  silent, 
  hasSelectedNote: !!selectedNote.value,
  isLoggedIn: isLoggedIn.value,
  isSaveDisabled: isSaveDisabled.value,
  isOnline: isOnline.value
});

// ... inside offline path ...
console.log('[saveNote] OFFLINE path - caching and queueing');
console.log('[saveNote] Enqueueing item:', { type: queueItem.type, noteId: queueItem.note.id });
await enqueue(queueItem);
console.log('[saveNote] Item enqueued successfully');
```

### In `useOfflineNotes.ts`

**`enqueue()` function (line ~88)**:
```typescript
console.log('[enqueue] Called with:', { type: item.type, id: item.id, noteId: item.note?.id || item.note_id });
if (!isClient) {
  console.log('[enqueue] Not client-side, returning');
  return;
}
// ... after IndexedDB write ...
console.log('[enqueue] Item successfully written to IndexedDB');
```

**`readQueueFIFO()` function (line ~95)**:
```typescript
console.log('[readQueueFIFO] Reading queue for user:', userId);
// ... after reading items ...
console.log('[readQueueFIFO] Found items:', items.length, items.map(i => ({ type: i.type, id: i.id })));
```

## Expected Console Output

### When Creating Note Offline

If working correctly, you should see:
```
[saveNote] Called with: { 
  silent: false,
  hasSelectedNote: true,
  isLoggedIn: true,
  isSaveDisabled: false,
  isOnline: false  ← Should be false!
}
[saveNote] OFFLINE path - caching and queueing
[saveNote] Enqueueing item: { type: 'create', noteId: 'local-xxxxx' }
[enqueue] Called with: { type: 'create', id: 'local-xxxxx', noteId: 'local-xxxxx' }
[enqueue] Item successfully written to IndexedDB
[saveNote] Item enqueued successfully
```

### When Going Online

If working correctly, you should see:
```
[isOnline watcher] Fired: { online: true, wasOnline: false, user: true }
[isOnline watcher] Going online - syncing then fetching
[syncPendingQueue] Called with: { isOnline: true, isLoggedIn: true, hasUser: true, syncing: false }
[readQueueFIFO] Reading queue for user: <uuid>
[readQueueFIFO] Found items: 1 [{ type: 'create', id: 'local-xxxxx' }]
// ... POST to /save-note happens ...
[isOnline watcher] Sync complete, now fetching
[fetchNotes] Called with: { loadMore: false, query: null, isOnline: true }
```

## Test Procedure

### Step 1: Clear Everything
1. Open DevTools → Application tab → IndexedDB
2. Right-click `HighNotesDB` → Delete database
3. Clear all console logs
4. Refresh page

### Step 2: Create Note Offline
1. Go offline (DevTools Network tab → throttle to "Offline")
2. Create a new note, add some content
3. Click Save
4. **Check console** - look for the `[saveNote]` logs
5. **Check IndexedDB** - Application tab → IndexedDB → HighNotesDB → queue store
   - Should have 1 item with type='create'

### Step 3: Go Online and Sync
1. Go online (DevTools Network tab → throttle to "No throttling")
2. **Check console immediately** - look for:
   - `[isOnline watcher]` logs
   - `[syncPendingQueue]` logs
   - `[readQueueFIFO]` logs showing queue items
3. **Check Network tab** - should see POST to `/save-note` THEN GET to `/notes`

## Diagnostic Decision Tree

### If `[saveNote]` never appears:
→ **Problem**: Save button isn't calling saveNote, or guard conditions are blocking
→ **Check**: Is save button enabled? Is note actually being edited?

### If `[saveNote]` shows `isOnline: true` when offline:
→ **Problem**: `isOnline` ref not tracking DevTools network throttle correctly
→ **Check**: How is `isOnline` implemented? Does it use `navigator.onLine`?

### If `[saveNote]` shows offline path but `[enqueue]` never appears:
→ **Problem**: Error thrown before enqueue is called (caching failing?)
→ **Check**: Are there any errors in console? Try wrapping in try/catch with logging

### If `[enqueue]` appears but "successfully written" doesn't:
→ **Problem**: IndexedDB write is failing
→ **Check**: Browser console for IndexedDB errors, check DB permissions

### If item written but `[readQueueFIFO]` shows 0 items:
→ **Problem**: Items being written to wrong user_id, or index not working
→ **Check**: Manually inspect queue store in IndexedDB, verify user_id matches

### If queue has items but sync doesn't POST:
→ **Problem**: syncPendingQueue logic skipping items or failing silently
→ **Check**: Add more logging inside the sync loop

## Key Questions to Answer

1. **Is saveNote being called?** → Look for `[saveNote] Called with:`
2. **Is isOnline reporting correctly?** → Check `isOnline: false` in offline mode
3. **Is offline path being taken?** → Look for `[saveNote] OFFLINE path`
4. **Is enqueue being called?** → Look for `[enqueue] Called with:`
5. **Is IndexedDB write succeeding?** → Look for `[enqueue] Item successfully written`
6. **Is queue readable?** → Look for `[readQueueFIFO] Found items: X`
7. **Do user IDs match?** → Compare user in readQueueFIFO vs item.user_id in IndexedDB

## Files Modified

- `app/composables/useNotes.ts` - Added logging to saveNote (lines ~427-480)
- `app/composables/useOfflineNotes.ts` - Added logging to enqueue and readQueueFIFO (lines ~88-107)

## Next Steps

After you run through the test procedure, share:
1. **Console logs** - all `[saveNote]`, `[enqueue]`, `[readQueueFIFO]` messages
2. **IndexedDB screenshot** - showing queue store contents after creating note offline
3. **Network tab** - showing whether POST happens when going online

This will tell us EXACTLY where the flow is breaking! 🔍
