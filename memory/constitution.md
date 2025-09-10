# High Notes Constitution

## Core Principles

### I. Full-Stack & Serverless
The High Notes application is a modern, single-page web app built on Nuxt for the frontend and Supabase for all backend services. This includes database (Postgres), authentication, realtime subscriptions, and serverless edge functions.

### II. Offline-First by Design
The application is architected to be fully functional without a network connection. It leverages IndexedDB for local data caching (`notes`) and maintains a FIFO queue (`queue`) for create, update, and delete operations. Changes are synchronized with the server once connectivity is restored.

### III. Realtime Data Synchronization
Data is kept current across all clients through Supabase's realtime capabilities. The client subscribes to `postgres_changes` events on a user-specific channel (`notes:{userId}`), ensuring a reactive and collaborative user experience.

### IV. End-to-End Type Safety
A strong emphasis is placed on type safety throughout the stack. Database types are generated directly from the Supabase schema into `types/database.types.ts` and are used across both the client-side Nuxt application and server-side Deno functions.

### V. Secure & Sanitized Content
All user-generated content is sanitized to prevent XSS attacks. Sanitization is performed both on the client before rendering and on the server within the `save-note` edge function using `sanitize-html` before persisting to the database.

## Technology Stack & Key Patterns

- **Framework**: Nuxt 4 (with `app/` as `srcDir`)
- **Runtime**: TypeScript, Vite
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions)
- **Package Manager**: pnpm
- **PWA & Offline**: `@vite-pwa/nuxt`, custom IndexedDB implementation in `app/composables/useOfflineNotes.ts`.
- **Editor**: TipTap, with content stored as sanitized HTML.
- **Authentication**: Handled by the `@nuxtjs/supabase` module, managing user sessions and page protection.
- **Local IDs**: Offline-created notes use a temporary `local-<uuid>` format. All code consuming note IDs must handle this state.

## Development Workflow

- **Dependencies**: Install with `pnpm install`.
- **Local Development**: Run the dev server with `pnpm dev`.
- **Builds**: Create a production build with `pnpm build` or a static site with `pnpm generate`.
- **Database Changes**: After altering the database schema, regenerate types with `supabase gen types typescript --project-id <project-ref> > types/database.types.ts`.
- **Server Logic**: Backend logic is deployed as Deno-based Supabase Edge Functions (e.g., `supabase/functions/save-note/`).

## Governance

This Constitution codifies the established architecture and patterns for the High Notes project. All new features, contributions, and reviews must align with these principles.

- **Prefer Existing Patterns**: Before inventing a new solution, always default to the patterns established in `app/composables/useNotes.ts` and `app/composables/useOfflineNotes.ts`.
- **Compliance**: All pull requests and code reviews must verify compliance with the principles outlined here.
- **Amendments**: Changes to these core principles require updating this document and justifying the deviation from the established architecture.

**Version**: 1.0.0 | **Ratified**: 2025-09-08 | **Last Amended**: 2025-09-08