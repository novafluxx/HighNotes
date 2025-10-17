# Offline Sync - Temporal Dead Zone Hotfix

**Date**: October 16, 2025  
**Error**: `Cannot access 'syncPendingQueue' before initialization`  
**Status**: ✅ Fixed

## Problem

After deploying the offline sync fix with `immediate: true` watchers, users experienced a 500 error when refreshing the notes page:

```
Cannot access 'syncPendingQueue' before initialization
```

## Root Cause

**Temporal Dead Zone (TDZ) Violation**

The watchers were defined **before** the `syncPendingQueue` function:

```typescript
// ❌ BEFORE (Line ~291)
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    fetchNotes(false);
    if (isOnline.value) {
      syncPendingQueue(); // ← ERROR: syncPendingQueue not defined yet!
    }
  }
  // ...
}, { immediate: true }); // ← immediate: true tries to run immediately

// ... 300 lines later ...

// Line ~588
const syncPendingQueue = async () => {
  // Function definition here
};
```

With `immediate: true`, the watcher callback runs **synchronously** during composable initialization, before the function is defined.

## Solution

**Move watchers AFTER function definitions**

```typescript
// ✅ AFTER (Line ~588)
const syncPendingQueue = async () => {
  // Function definition
};

// Line ~690 - Now safe to call syncPendingQueue
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    fetchNotes(false);
    if (isOnline.value) {
      syncPendingQueue(); // ✓ Function is defined
    }
  }
  // ...
}, { immediate: true });

// Line ~708 - Also safe
watch(isOnline, (online, wasOnline) => {
  if (online && !wasOnline) {
    syncPendingQueue(); // ✓ Function is defined
    fetchNotes(false, searchQuery.value || null);
  }
}, { immediate: true });
```

## Changes Made

**File**: `app/composables/useNotes.ts`

1. **Removed** user watcher from line ~291
2. **Removed** isOnline watcher from line ~706  
3. **Added both watchers** after `syncPendingQueue` definition (lines 690-714)
4. **Added comments** to prevent future TDZ issues

## Code Order (Final)

```
Line 1-587:   Imports, state, other functions
Line 588:     const syncPendingQueue = async () => { ... }
Line 690:     watch(user, ...) - User login watcher
Line 708:     watch(isOnline, ...) - Online status watcher
Line 716:     return { ... } - Export composable API
```

## Why This Matters

JavaScript/TypeScript has strict temporal dead zones for `const` declarations:
- ❌ Can't access before declaration
- ❌ Can't hoist like `var` or `function`
- ✅ Must reference AFTER definition

With `immediate: true`, Vue runs the watcher callback during setup, so order matters!

## Testing

After this fix:
- ✅ Page loads without 500 error
- ✅ Offline sync still works on network restore
- ✅ Login while online triggers sync
- ✅ Refresh while offline doesn't crash

## Related Issues

This is why the original code didn't have `immediate: true` - it avoided the TDZ issue but broke offline sync on mount.

The correct solution: **Both** `immediate: true` AND proper function ordering.

---

**Deployed**: October 16, 2025  
**Verified**: Production testing successful
