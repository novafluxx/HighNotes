## High Notes — Copilot / AI Agent Guide

This guide provides concise, actionable instructions for AI coding agents to be productive in the High Notes codebase.

### Key Architecture
- **Frontend:** Nuxt 4 (TypeScript, Vite, srcDir = `app`).
- **Backend:** Supabase (Auth, Realtime, Postgres). All DB types in `types/database.types.ts`.
- **Offline/PWA:** IndexedDB queue/cache in `app/composables/useOfflineNotes.ts` and PWA via `@vite-pwa/nuxt`.
- **Edge Functions:** Deno-based, e.g. `supabase/functions/save-note/index.ts` (sanitizes/upserts notes, expects Authorization header).

### Where to Start (Key Files)
- `nuxt.config.ts`: Nuxt config, Supabase/PWA setup, runtime keys.
- `app/composables/useNotes.ts`: Core client logic (CRUD, realtime, search, pagination, dirty checks, save gating).
- `app/composables/useOfflineNotes.ts`: IndexedDB queue/cache helpers (`enqueue`, `readQueueFIFO`, `cacheNote`, `replaceLocalId`).
- `app/components/NoteEditor.vue`: TipTap editor, character-count extension.
- `supabase/functions/save-note/index.ts`: Server-side sanitization/upsert.
- `types/database.types.ts`: Generated Supabase types (DB row shapes).

### Essential Patterns & Conventions
- **App code lives in `app/`** (not `src/`). Do not move or rename without updating `nuxt.config.ts`.
- **Auth:** Use Nuxt Supabase composables (`useSupabaseClient`, `useSupabaseUser`). Auth redirects in `nuxt.config.ts`.
- **Realtime:** Subscribe to `client.channel('notes:{userId}')` (see `useNotes.ts`). Handle INSERT/UPDATE/DELETE as implemented.
- **Offline-first:** When offline, serve cached notes and enqueue operations in IndexedDB. On reconnect, process queue and map local IDs to server IDs (`replaceLocalId`).
- **Temporary IDs:** Offline-created notes use `local-<uuid>` ids. All code must tolerate `null` or `local-*` ids until server returns a real id.
- **Text search:** Uses `search_vector` and Supabase `textSearch`. UI ignores queries <3 chars.
- **Editor:** TipTap with `@tiptap/extension-character-count`. Content is sanitized HTML (client/server).
- **Account deletion:** Queued if offline, processed via edge function when online (`useAccountDeletion.ts`).

### Developer Workflows
- **Install:** `pnpm install` (pnpm@10.17.0+ required)
- **Dev server:** `pnpm dev` (http://localhost:3000)
- **Build/preview:** `pnpm build`, `pnpm preview`, static: `pnpm generate`
- **Supabase MCP:** All DB/function access via Supabase MCP. No local CLI/DB needed. Use `.env` for `SUPABASE_URL`/`SUPABASE_KEY` (see `.env.example`).

### Project-Specific Gotchas
- Do not move code to `src/` or change entry paths without updating config.
- Always update both client (`useNotes.ts`) and server (`save-note/index.ts`) when changing note shape/storage.
- Regenerate DB types with `supabase gen types` after DB changes.
- When testing edge functions locally, ensure env vars are set.

### Reference Patterns
- **Realtime logic:** `app/composables/useNotes.ts` (subscribeToNotes)
- **Offline queue/IDB:** `app/composables/useOfflineNotes.ts`
- **Server sanitization:** `supabase/functions/save-note/index.ts`

If uncertain, prefer the existing approach in `useNotes.ts` and `useOfflineNotes.ts`.

---
_Last updated: 2025-09-12_
