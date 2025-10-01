## High Notes – AI Agent Guide (Productive Start)

Goal: Enable fast, safe contributions that respect the app's offline-first + realtime model. Keep changes aligned with existing composables before inventing new patterns.

### 1. Architecture Snapshot
- Nuxt 4 (TypeScript, Vite) — code rooted in `app/` (configured via `srcDir: 'app'`).
- Supabase: Auth, Realtime (channel per user), Postgres (RLS). Generated types: `types/database.types.ts` (mirror also under `app/types/`).
- Edge Functions (Deno): primary write path is `supabase/functions/save-note` (sanitizes + upserts). Account deletion: `delete-account` function.
- Offline/PWA: IndexedDB (`useOfflineNotes.ts`) + queue replay (`syncPendingQueue` in `useNotes.ts`) + PWA via `@vite-pwa/nuxt` (`nuxt.config.ts`).

### 2. Core Data / Note Lifecycle
1. User edits in TipTap (`NoteEditor.vue`) → live HTML kept in `currentEditorContent` (NOT instantly persisted to `selectedNote.content` until save).
2. Save triggers edge function `save-note` (online) OR queues an operation (offline) with a temporary id `local-<uuid>`.
3. Realtime subscription (`channel('notes:{userId}')`) merges INSERT/UPDATE/DELETE into in-memory `notes` list; selection & editor state updated if active note affected.
4. Background prefetch (`useNotesPrefetch`) hydrates full content after listing (IDs first, then content) to keep initial payload small.

### 3. Offline Queue Semantics (`useOfflineNotes.ts` + `useNotes.ts`)
- Operations stored in `queue` store: types `create|update|delete|delete-account` with FIFO replay.
- Local note IDs replaced post-create via `replaceLocalId` then subsequent queued ops are patched to the real ID.
- Sync algorithm processes sequentially; if an `update` still references a local id not yet mapped, it defers and re-runs once earlier creates resolve.
- Always update both cache (`notes` store) and memory when mutating offline to keep UI responsive.

### 4. Search & Pagination
- Listing: server returns only `id,title,updated_at` (lightweight). Full content fetched lazily on selection or background prefetch.
- Text search: transforms terms into `term:*` joined with `&` and runs `textSearch('search_vector', ...)`; disables pagination for search result sets.
- Client ignores queries < 3 chars (watcher logic in `useNotes.ts`).

### 5. Validation & Save Gating
- Gated conditions: title/content length (`TITLE_MAX_LENGTH=255`, `CONTENT_MAX_LENGTH=5000` for UI), non-empty trimmed title, and dirtiness check comparing `currentEditorContent` + title vs deep-cloned `originalSelectedNote`.
- Silent autosave on note switch if dirty (see `selectNote`). Avoid introducing parallel save paths—reuse `saveNote(silent?)`.

### 6. Realtime & Consistency Patterns
- Channel naming: `notes:{userId}`; unsubscribe & resubscribe when auth state changes.
- On UPDATE: merge partial fields; if selected note matches, also sync `currentEditorContent`.
- On DELETE: clear selection and editor state if active note removed.

### 7. Edge Function Contract (`save-note`)
- Expects body `{ note }` with `title`, `content` HTML (unsanitized). Sanitizes with `sanitize-html` adding heading/list/code tags.
- If `note.id` null → insert; else update scoped by `user_id` (RLS enforced). Returns complete row (used to refresh cache + selection).
- Always update `updated_at` server-side; client relies on returned value—do not fabricate timestamps locally when online.

### 8. PWA & Performance Touches
- Preconnect to Supabase origin (`nuxt.config.ts`) to reduce first-query latency.
- Workbox precaches only static assets (not HTML) to keep install fast; rely on runtime caching + IndexedDB for note content.
- Icon pre-bundling ensures offline toolbar rendering (`icon.clientBundle.icons`).

### 9. When Changing Note Schema
- Update DB migration + regenerate types (`supabase gen types typescript --project ... > types/database.types.ts`).
- Reflect changes in: `save-note` function (sanitization / whitelist), `useNotes.ts` (select fields in list query), `useOfflineNotes.ts` (IDB shape if needed) and any prefetch logic.
- Maintain backward compatibility for queued offline notes if possible (migrate in replay step if fields renamed).

### 10. Common Pitfalls / Do & Avoid
- Do NOT move `app/` to `src/`—breaks configured `srcDir`.
- Avoid duplicating save paths; ALWAYS use edge function for persistence (keeps sanitization centralized).
- Preserve temporary `local-*` IDs until sync; never assume numeric/UUID canonical form client-side.
- When introducing new offline ops, extend queue `type` union conservatively and update sync branching once.

### 11. Quick Commands
```bash
pnpm install      # deps
pnpm dev          # local dev (http://localhost:3000)
pnpm build        # production build
pnpm preview      # preview build
pnpm generate     # static generation (if deploying static)
```

### 12. Where to Look Before Adding Code
1. Listing/sync logic: `app/composables/useNotes.ts`
2. Offline queue + ID remap: `app/composables/useOfflineNotes.ts`
3. Editor wiring: `app/components/NoteEditor.vue`
4. Edge sanitization/upsert: `supabase/functions/save-note/index.ts`
5. Runtime + PWA + auth redirects: `nuxt.config.ts`

If uncertain, mirror the patterns already present in `useNotes.ts` & `useOfflineNotes.ts` rather than inventing new abstractions.

---
_Last updated: 2025-09-27_
