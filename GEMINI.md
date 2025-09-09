# High Notes

## Project Overview

High Notes is a modern note-taking Progressive Web App (PWA) built with Nuxt.js 4 and Supabase. It is designed for seamless cross-platform usage with offline capabilities and secure cloud synchronization. The application features a rich text editor using TipTap, secure authentication, and real-time data synchronization.

**Key Technologies:**

*   **Frontend:** Nuxt.js 4, Vue.js 3, Tailwind CSS 4, Nuxt UI 3
*   **Backend:** Supabase (Authentication, Realtime Database, Edge Functions)
*   **Offline Storage:** IndexedDB
*   **Testing:** Vitest

**Architecture:**

The application follows a client-server architecture. The frontend is a Nuxt.js application that interacts with a Supabase backend. User authentication is handled by Supabase Auth, and notes are stored in a PostgreSQL database. Real-time updates are achieved using Supabase Realtime subscriptions. A Supabase Edge Function is used to sanitize and save notes, providing a secure and efficient way to handle data. The application is also a PWA, with offline capabilities enabled by a service worker and IndexedDB.

## Building and Running

**Prerequisites:**

*   Node.js 18+
*   pnpm

**Installation:**

```bash
pnpm install
```

**Development:**

To run the development server:

```bash
pnpm dev
```

**Building:**

To build the application for production:

```bash
pnpm build
```

**Testing:**

To run the test suite:

```bash
pnpm test
```

To run the crypto tests specifically:

```bash
pnpm test:crypto
```

## Development Conventions

*   The application source code is located in the `app/` directory.
*   The core client-side logic for handling notes is encapsulated in the `app/composables/useNotes.ts` composable.
*   Offline functionality is managed by `app/composables/useOfflineNotes.ts`.
*   Supabase Edge Functions are located in the `supabase/functions/` directory. The `save-note` function is responsible for sanitizing and saving notes.
*   Database types are generated from the Supabase schema and stored in `types/database.types.ts`.
*   The application uses `pnpm` as the package manager.
