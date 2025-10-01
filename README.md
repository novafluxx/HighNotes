# High Notes
[![CodeQL](https://github.com/novafluxx/HighNotes/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/novafluxx/HighNotes/actions/workflows/github-code-scanning/codeql) [![Dependabot Updates](https://github.com/novafluxx/HighNotes/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=main)](https://github.com/novafluxx/HighNotes/actions/workflows/dependabot/dependabot-updates)


A modern note-taking Progressive Web App (PWA) built for seamless cross-platform usage with offline capabilities and secure cloud synchronization.

![High Notes logo](./public/android-chrome-192x192.png)

## ✨ Features

- 📝 **Rich Text Editor** - Advanced note editing with TipTap editor, supporting formatting, character count, and more
- 🔐 **Secure Authentication** - Complete auth flow with email/password, signup, email confirmation, and password reset
- 📱 **Progressive Web App** - Installable on any device with offline capabilities and automatic updates
- ☁️ **Real-time Sync** - Automatic synchronization across all your devices via Supabase
- 🎨 **Modern UI** - Clean, responsive design built with Nuxt UI 3 and Tailwind CSS 4


# High Notes

A lightweight, offline-first note-taking Progressive Web App (PWA) built with Nuxt 4 and Supabase. High Notes focuses on fast editing, reliable offline sync (IndexedDB queue), and realtime updates.

## Highlights

- TipTap rich-text editor with character-count and lightweight formatting
- Offline-first: local cache + FIFO queue for create/update/delete operations
- Realtime sync via Supabase Realtime channels
- Server-side sanitization and upsert via a Supabase Edge Function
- PWA support with service-worker precaching

> [!NOTE]
> This README is concise — see the `app/` and `supabase/` folders for implementation details.

## Quick start

Prerequisites: Node 22+, pnpm (recommended).

Install and run locally:

```bash
pnpm install
pnpm dev

Build and preview:

```bash
pnpm build
pnpm preview
```

## Configuration

Provide Supabase credentials via environment variables (for example in `.env`):

- `SUPABASE_URL`
- `SUPABASE_KEY` — publishable key for the Nuxt client (use anon key locally if preferred)

These are mapped to `runtimeConfig.public.supabaseUrl` and `runtimeConfig.public.supabaseKey` in `nuxt.config.ts`.

Edge Functions require their own secrets (manage with `pnpx supabase secrets set`):

- `SUPABASE_SERVICE_ROLE_KEY`
- `EDGE_SUPABASE_PUBLISHABLE_KEY` — must match the publishable key used by the frontend

## Where to look first

- `nuxt.config.ts` — app `srcDir`, Supabase module, PWA and Nitro settings
- `app/composables/useNotes.ts` — core client logic (CRUD, realtime, pagination, save gating)
- `app/composables/useOfflineNotes.ts` — IndexedDB queue and cache helpers (`enqueue`, `readQueueFIFO`, `cacheNote`, `replaceLocalId`)
- `app/components/NoteEditor.vue` — TipTap editor wiring and character-count extension
- `supabase/functions/save-note/index.ts` — Edge function that sanitizes and upserts notes (expects Authorization header)
- `types/database.types.ts` — generated Supabase types (DB row shapes)

## Architecture (short)

- Frontend: Nuxt 4 (TypeScript + Vite). App source lives in `app/` (note: `srcDir` is `app`).
- Backend: Supabase for Auth, Realtime, and Postgres. Server sanitization with an Edge Function.
- Offline: IndexedDB stores for `notes` and `queue`. Queue processors run when connectivity returns and call the Edge Function to upsert notes.

## Developer notes

- Offline-created notes use temporary IDs like `local-<uuid>` until the server returns a real id — client code must tolerate these IDs.
- Text search uses a `search_vector` in the DB; UI debouncing may ignore very short queries.
- Realtime channel name pattern: `notes:{userId}` — subscribe/unsubscribe when the user context changes.
- When changing DB fields, regenerate `types/database.types.ts` with Supabase's type generator and update client typings.
- Edge Functions validate JWTs against the Supabase JWKS; deploy with `pnpx supabase functions deploy <name> --no-verify-jwt` so the platform doesn't expect legacy verification.

> [!TIP]
> Start with `app/composables/useNotes.ts` and `app/composables/useOfflineNotes.ts` when adding features — most app behavior is encapsulated there.

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm generate     # Generate static site
pnpm preview      # Preview production build
```

## Troubleshooting

- If realtime or DB calls fail, verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` and that your Supabase project allows requests from the app origin.
- For local testing of Edge Functions, ensure the function env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) are available to the runner.
