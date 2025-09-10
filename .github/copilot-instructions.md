## High Notes — Copilot / AI agent quick guide

This file gives targeted, actionable guidance so an AI coding agent can be productive in the High Notes codebase.

Key facts
- Framework: Nuxt 4 (srcDir = `app`). See `nuxt.config.ts`.
- Runtime: TypeScript + Vite. Package manager: pnpm (see `package.json`, `packageManager`).
- Backend: Supabase (Auth, Realtime, Postgres). Types are generated to `types/database.types.ts`.
- PWA + offline: `@vite-pwa/nuxt` and an IndexedDB offline queue in `app/composables/useOfflineNotes.ts`.

Where to look first (high value files)
- `nuxt.config.ts` — app srcDir, Supabase module config, PWA and nitro settings.
- `app/composables/useNotes.ts` — core client-side logic (CRUD, realtime subscriptions, search, pagination, dirty checks, save gating). Most app behavior lives here.
- `app/composables/useOfflineNotes.ts` — IndexedDB queue & cache helpers; functions: `enqueue`, `readQueueFIFO`, `cacheNote`, `replaceLocalId`.
- `app/components/NoteEditor.vue` — TipTap editor usage, character-count extension, emits `update:content`.
- `supabase/functions/save-note/index.ts` — Deno-based edge function used to sanitize and upsert notes; expects Authorization header.
- `types/database.types.ts` — generated Supabase types; reference for DB row shapes.

Important architecture & patterns (do not invent alternatives)
- Single-page Nuxt app with serverless functions hosted via Supabase functions. App code lives in `app/` (not `src/`).
- Auth model: Nuxt Supabase module provides `useSupabaseClient`, `useSupabaseUser`, and redirectOptions in `nuxt.config.ts`. Runtime keys are exposed via `runtimeConfig.public.supabaseUrl` / `supabaseKey` (set from `.env`).
- Realtime: client subscribes to `client.channel('notes:{userId}')` with `postgres_changes` (see `useNotes.ts`). Handle INSERT/UPDATE/DELETE payloads as implemented.
- Offline-first flow: when offline the app serves cached notes (IDB) and enqueues create/update/delete operations into the `queue` store. When online, queued items are processed; `replaceLocalId` maps temporary local ids to server ids after create.
- Editor: TipTap with `@tiptap/extension-character-count`. Editor content is stored as sanitized HTML; server-side `save-note` also sanitizes with `sanitize-html`.

Developer workflows & quick commands
- Install deps: `pnpm install` (pnpm@10.14.0+ required).
- Dev server: `pnpm dev` (app served at http://localhost:3000).
- Build / preview: `pnpm build`, `pnpm preview`. Static generation: `pnpm generate`.
- Supabase MCP: All database and function access is via the Supabase MCP (Managed Cloud Platform). No local Supabase CLI or local DB is required. Use the provided `SUPABASE_URL` and `SUPABASE_KEY` in your `.env` file (see `.env.example`). These are mapped to `runtimeConfig.public` via `nuxt.config.ts`.

Project-specific gotchas (examples and how to handle)
- srcDir is `app` — don't move code to `src/` or change Nuxt entry paths without updating `nuxt.config.ts`.
- Temporary local IDs: offline-created notes use `local-<uuid>` ids (see `useNotes.ts`). Code that consumes note ids must tolerate `null` or `local-*` ids until server returns a real id.
- Text search uses a `search_vector` full-text index and `textSearch` in Supabase queries (see `useNotes.ts`). Queries shorter than 3 chars are ignored by the UI debounce.
- Realtime channel name: `notes:{userId}` — subscribe/unsubscribe carefully when user changes.
- Server function `supabase/functions/save-note/index.ts` runs on Deno and imports `sanitize-html` via npm:. It expects an Authorization header and returns CORS-friendly JSON. When testing locally with the Supabase CLI, ensure function env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) are set.

How to extend or modify behavior (concise rules)
- When adding DB fields: regenerate `types/database.types.ts` with `supabase gen types` and update client typings (search for `Database` and `Note` types).
- When changing note shape/storage: update both `useNotes.ts` (client flow) and `supabase/functions/save-note/index.ts` (server sanitize/upsert). Keep client/server field names aligned.
- When changing PWA precache or icons, edit `nuxt.config.ts` pwa.manifest and `public/` assets.

Search examples to reference while coding
- Find realtime logic: `app/composables/useNotes.ts` (subscribeToNotes handler).
- Offline queue & IDB schema: `app/composables/useOfflineNotes.ts` (object stores `notes` and `queue`).
- Server sanitization & upsert: `supabase/functions/save-note/index.ts`.

If uncertain, prefer the existing behavior in `useNotes.ts` and `useOfflineNotes.ts` over changing approach.

## Recent Changes
- 002-delete-account-the: Added account deletion functionality using Supabase auth.admin.deleteUser() with cascade data deletion and offline queue handling
