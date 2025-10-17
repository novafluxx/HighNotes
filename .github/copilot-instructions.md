# High Notes – AI Agent Guide

**Purpose**: Enable productive contributions to this offline-first, realtime note-taking PWA built with Nuxt 4 + Supabase.

## Architecture Overview

**Stack**: Nuxt 4 (TypeScript, Vite) + Supabase (Auth, Realtime, Postgres) + Deno Edge Functions + IndexedDB

**Critical Path**: User edits → TipTap editor → Edge function (server-side sanitization) OR IndexedDB queue (offline) → Postgres + Realtime broadcast

### Directory Structure
- **`app/`** — Nuxt source root (configured via `srcDir: 'app'` in `nuxt.config.ts`); DO NOT move to `src/`
- **`app/composables/`** — Core business logic (see Key Files below)
- **`supabase/functions/`** — Deno edge functions (`save-note`, `delete-account`)
- **`types/database.types.ts`** — Generated Supabase types (regenerate after schema changes)

## Key Files & Patterns

### 1. `app/composables/useNotes.ts` (743 lines)
**Central coordinator** for all note CRUD, search, pagination, and realtime sync.

**Critical patterns**:
- **Lazy content loading**: List queries fetch only `id, title, updated_at`; full `content` loaded on selection or via background prefetch
- **Dirty tracking**: Compares `currentEditorContent` + `title` against `originalSelectedNote` (deep clone); silent autosave on note switch
- **Realtime subscription**: `channel('notes:{userId}')` handles INSERT/UPDATE/DELETE; updates in-memory `notes` array and syncs `selectedNote` if affected
- **Search**: Transforms queries into `term:*` joined with `&`, uses Postgres `textSearch('search_vector', ...)`, disables pagination for search results
- **Offline queue replay** (`syncPendingQueue`): FIFO processing with local→server ID remapping; re-runs if updates reference unmapped IDs

**State management**:
```typescript
const notes = ref<Note[]>([])              // In-memory list (partial data)
const selectedNote = ref<Note | null>      // Currently edited note (full data)
const currentEditorContent = ref<string>() // Live HTML from TipTap (NOT synced to selectedNote.content until save)
const originalSelectedNote = ref<Note>     // Deep clone for dirty checking
```

### 2. `app/composables/useOfflineNotes.ts` (174 lines)
**IndexedDB layer** for offline-first caching and queue management.

**Stores**:
- `notes`: Cached note data (by `id` + `user_id` index)
- `queue`: Pending operations (`create|update|delete|delete-account`) with timestamp for FIFO ordering

**Key functions**:
- `enqueue(item)` — Add operation to queue with `type`, `note`, `note_id`, `timestamp`
- `readQueueFIFO(userId)` — Retrieve queue sorted by timestamp
- `replaceLocalId(localId, serverId)` — Update cache + queue after server returns real ID
- `cacheNote(note)` / `cacheNotesBulk(notes)` — Update IndexedDB cache

**Local ID format**: `local-<uuid>` (generated via `crypto.randomUUID()`)

### 3. `supabase/functions/save-note/index.ts` (285 lines)
**Server-side write path** — sanitizes HTML, upserts to Postgres, enforces RLS.

**Contract**:
- **Input**: `{ note: { id?, title, content } }` via POST body
- **Validation**: Title 1-255 chars, content ≤100KB, UUID format check
- **Sanitization**: Uses `sanitize-html` with heading/list/code/strong/em/strike tags allowed
- **Output**: Full note row (client refreshes cache + selection with returned data)
- **Logic**: If `note.id` is null → INSERT; else UPDATE where `user_id` matches (RLS enforced)
- **CORS**: Dynamic origin validation from `ALLOWED_ORIGINS` env var

**Never fabricate timestamps client-side when online** — always use server-returned `updated_at`.

### 4. `app/components/NoteEditor.vue` (279 lines)
**TipTap editor** with character count extension (limit: 5000 visible chars, 100KB HTML).

**Props flow**:
- `modelValue` (Note) and `currentEditorContent` managed by parent (`notes.vue`)
- Editor emits HTML on update → parent stores in `currentEditorContent` (not immediately persisted)

**Toolbar**: Bold, italic, strike, code, H1/H2/H3, bullet/ordered lists

### 5. `app/composables/useNotesPrefetch.ts` (118 lines)
**Background content hydration** to reduce perceived latency.

**Strategy**:
- Fetch top 100 note IDs (by `updated_at DESC`)
- Filter out notes already cached with content
- Batch-fetch remaining notes in chunks of 20
- Runs on idle + fast network only (`requestIdleCallback` + Network Information API)
- **Deduplication**: Tracks `startedUsers` to prevent re-runs per session

## Data Flow & State Transitions

### Online Save
1. User clicks Save → `saveNote()` → Edge function `/save-note`
2. Server sanitizes HTML, upserts row, returns full note
3. Update in-memory `notes` array + `selectedNote` + IndexedDB cache
4. Realtime broadcast → other clients receive UPDATE event

### Offline Save
1. User clicks Save → `saveNote()` detects `!isOnline`
2. Assign local ID (`local-<uuid>`) if new note
3. Update in-memory `notes` + cache → enqueue operation
4. When online: `syncPendingQueue()` → Edge function → `replaceLocalId(local, server)` → patch subsequent queue items

### Realtime Sync
- **INSERT**: Prepend to `notes` array, update cache
- **UPDATE**: Merge fields; if `selectedNote.id` matches, sync `currentEditorContent`
- **DELETE**: Remove from array + cache; clear selection if active note deleted

## Critical Constants & Validation

```typescript
TITLE_MAX_LENGTH = 255           // Client + server enforce
CONTENT_MAX_LENGTH = 5000        // UI limit (visible chars)
CONTENT_MAX_LENGTH_SERVER = 100000 // DB limit (includes HTML tags)
```

**Save gating** (`isSaveDisabled`):
- Title/content within limits
- Non-empty trimmed title
- Note is dirty (differs from `originalSelectedNote`)
- Not already loading

## Development Workflows

### Local Dev
```powershell
pnpm install
pnpm dev           # http://localhost:3000
```

### Supabase Setup
Required env vars (`.env`):
```
SUPABASE_URL=...
SUPABASE_KEY=...           # Publishable key (from pnpx supabase status -o env)
SUPABASE_ANON_KEY=...      # Mirror of SUPABASE_KEY for backwards compat
```

Edge function secrets (for local testing):
```
SUPABASE_SERVICE_ROLE_KEY=...        # From supabase status
EDGE_SUPABASE_PUBLISHABLE_KEY=...    # Must match frontend key
```

### Testing PWA Features
```powershell
pnpm build
pnpm preview    # Test service worker + offline behavior
```

### Schema Changes
1. Update migration in `supabase/migrations/`
2. Regenerate types: `pnpx supabase gen types typescript --project-id <id> > types/database.types.ts`
3. Update:
   - `save-note/index.ts` (sanitization whitelist)
   - `useNotes.ts` (select fields in queries)
   - `useOfflineNotes.ts` (IDB schema if needed)
   - `useNotesPrefetch.ts` (prefetch queries)
4. Consider backward compatibility for queued offline operations

## Common Pitfalls

❌ **Don't** move `app/` to `src/` (breaks `srcDir` config)  
❌ **Don't** create alternate save paths (bypasses sanitization)  
❌ **Don't** assume `note.id` is always UUID (may be `local-<uuid>` until synced)  
❌ **Don't** fabricate timestamps client-side when online (use server-returned values)  
❌ **Don't** duplicate state management (use existing composables)

✅ **Do** reuse `saveNote(silent?)` for all persistence  
✅ **Do** handle `local-*` IDs in UI/logic until `replaceLocalId` completes  
✅ **Do** update both IndexedDB cache AND in-memory state for offline ops  
✅ **Do** follow FIFO queue ordering (timestamp-based)  
✅ **Do** test offline→online transitions (queue replay, ID remapping)

## Where to Start

**Reading notes**: `useNotes.ts` → `fetchNotes()` → `selectNote()`  
**Editing notes**: `NoteEditor.vue` → `currentEditorContent` → `saveNote()`  
**Offline logic**: `useOfflineNotes.ts` → `enqueue()` → `syncPendingQueue()`  
**Server persistence**: `supabase/functions/save-note/index.ts`  
**Realtime**: `useNotes.ts` → `subscribeToNotes()` → postgres_changes handler

## PWA & Performance

- Preconnect to Supabase origin reduces first-query latency
- Workbox precaches static assets only (not HTML)
- Icon pre-bundling ensures offline toolbar rendering
- Runtime caching for pages + API calls (NetworkFirst strategy)

---
_Generated: 2025-10-16 | Nuxt 4.1.3 + Supabase 2.75.0_
