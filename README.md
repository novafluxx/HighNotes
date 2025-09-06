
# High Notes

> **A modern, offline-first note-taking app powered by Nuxt 4, Supabase, and PWA technologies.**

![High Notes Logo](public/android-chrome-192x192.png)

---

## Overview

High Notes is a single-page, offline-capable note-taking application built with Nuxt 4 and Supabase. It features real-time sync, robust offline support, and a beautiful, distraction-free editor powered by TipTap. Designed for speed, privacy, and reliability, High Notes lets you capture and manage your notes anywhere, anytime.

---

## Features

- **Offline-first**: Full offline support with IndexedDB queue and cache. Notes are queued and synced automatically when back online.
- **Realtime sync**: Instant updates across devices using Supabase Realtime channels.
- **Secure authentication**: Email/password login via Supabase Auth.
- **Rich text editing**: Modern editor with character count, powered by TipTap.
- **Full-text search**: Fast, indexed search with debounce and relevance ranking.
- **PWA**: Installable on desktop and mobile, with custom icons and manifest.
- **Serverless backend**: All data and logic handled via Supabase (Postgres, Edge Functions).

---

## Quick Start

> [!TIP]
> **pnpm is required** (see [pnpm.io](https://pnpm.io/)).

```sh
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
	composables/      # Core logic: notes, offline, auth, etc.
	components/       # UI components (editor, header, prompts)
	pages/            # Nuxt pages (index, login, notes, etc.)
	layouts/          # App layout(s)
	middleware/       # Route guards (auth)
public/             # Icons, manifest, static assets
supabase/           # Edge functions, config
```

Key files:
- `app/composables/useNotes.ts`: Main client logic (CRUD, sync, search)
- `app/composables/useOfflineNotes.ts`: Offline queue/cache helpers
- `app/components/NoteEditor.vue`: TipTap editor
- `supabase/functions/save-note/index.ts`: Serverless note upsert/sanitization
- `types/database.types.ts`: Supabase DB types
- `nuxt.config.ts`: Nuxt, Supabase, and PWA config

---

## Configuration

1. Copy `.env.example` to `.env` and set your Supabase credentials:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

2. These are mapped to Nuxt runtime config in `nuxt.config.ts`.

---

## Supabase Functions & Database

- All backend logic is handled via Supabase Edge Functions and Postgres.
- No local Supabase CLI or DB is required—use the [Supabase MCP](https://supabase.com/) dashboard.
- To update DB types, run:

```sh
supabase gen types typescript --project-id <your-project-id> > app/types/database.types.ts
```

---

## Development Notes

- **srcDir is `app/`**: All Nuxt app code lives in `app/`, not `src/`.
- **Offline IDs**: Notes created offline use `local-<uuid>` IDs until synced.
- **Realtime**: Subscribes to `notes:{userId}` channel for live updates.
- **Editor**: Content is sanitized both client- and server-side.

---

## Acknowledgements

- [Nuxt 4](https://nuxt.com/)
- [Supabase](https://supabase.com/)
- [TipTap Editor](https://tiptap.dev/)
- [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/)

---

> [!NOTE]
> For more details, see the code comments and composables in the `app/` directory.
