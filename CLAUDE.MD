# CLAUDE.MD - High Notes Project Guide

This document provides context for AI assistants working on the High Notes codebase.

## Project Overview

High Notes is a modern, offline-first note-taking Progressive Web App (PWA) built with Nuxt 4 and Supabase. It emphasizes fast editing, reliable offline sync using IndexedDB, and real-time updates across devices.

### Core Technologies

- **Frontend**: Nuxt 4.2.1 (TypeScript + Vite)
- **Backend**: Supabase (Auth, Realtime, Postgres)
- **Editor**: TipTap 3.10.7 with character-count extension
- **Styling**: Nuxt UI 4.1.0 + Tailwind CSS 4.1.17
- **Offline Storage**: IndexedDB (via `idb` 8.0.3)
- **PWA**: @vite-pwa/nuxt 1.0.7
- **Utilities**: @vueuse/core 14.0.0 (externalized from SSR/Nitro bundles)

### Key Features

1. **Offline-First Architecture**: Local cache + FIFO queue for CRUD operations
2. **Real-time Sync**: Supabase Realtime channels for cross-device updates
3. **Secure**: Server-side sanitization via Edge Functions
4. **PWA**: Installable with service worker precaching
5. **Rich Text Editing**: TipTap with character count and formatting

## Project Structure

```
app/                          # Application source (srcDir)
├── composables/
│   ├── useNotes.ts          # Core note CRUD, realtime, pagination
│   ├── useOfflineNotes.ts   # IndexedDB queue and cache logic
│   ├── useNotesPrefetch.ts  # Background prefetch for note content
│   ├── useOfflineUser.ts    # Offline user state persistence
│   ├── useAccountDeletion.ts # Account deletion with offline queue
│   ├── useAuth.ts           # Authentication helpers
│   ├── useLayout.ts         # Layout state management
│   └── useSupabase.ts       # Supabase client helpers
├── components/
│   ├── NoteEditor.vue       # TipTap editor implementation
│   ├── AppHeader.vue        # Navigation header
│   ├── PwaInstallPrompt.vue # PWA install UI
│   └── PwaReloadPrompt.vue  # PWA update UI
├── pages/
│   ├── index.vue            # Landing page
│   ├── notes.vue            # Main notes interface
│   ├── login.vue            # Auth - login
│   ├── signup.vue           # Auth - signup
│   ├── confirm.vue          # Email confirmation
│   ├── reset.vue            # Password reset
│   ├── settings.vue         # User settings
│   └── changelog.vue        # App changelog
└── layouts/
    └── default.vue          # Default layout

supabase/
├── functions/
│   ├── save-note/index.ts   # Edge function for note upsert
│   └── delete-account/index.ts # Edge function for account deletion
└── migrations/              # Database migrations

types/
└── database.types.ts        # Generated Supabase types
```

## Key Files to Understand

### Core Logic
- `app/composables/useNotes.ts` - Main client logic for CRUD operations, real-time subscriptions, pagination, and save gating
- `app/composables/useOfflineNotes.ts` - IndexedDB operations: `enqueue`, `readQueueFIFO`, `cacheNote`, `replaceLocalId`
- `app/composables/useNotesPrefetch.ts` - Background prefetcher for full note content (caches top N notes)
- `app/composables/useOfflineUser.ts` - Persists user state in localStorage for offline access
- `app/composables/useAccountDeletion.ts` - Account deletion with offline queue support
- `supabase/functions/save-note/index.ts` - Server-side note sanitization and upsert (requires Authorization header)
- `supabase/functions/delete-account/index.ts` - Server-side account deletion edge function

### Configuration
- `nuxt.config.ts` - App configuration including srcDir, Supabase module, PWA, and Nitro settings
- `package.json` - Dependencies and scripts (pnpm@10.22.0, Node 24+)

### UI Components
- `app/components/NoteEditor.vue` - TipTap editor with character count extension
- `app/pages/notes.vue` - Main notes interface

## Environment Variables

Required environment variables (set in `.env`):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Publishable key for Nuxt client
- `SUPABASE_ANON_KEY` - Mirrors publishable key (backwards compatibility)

Edge Function secrets (manage with `pnpx supabase secrets set`):

- `SUPABASE_SERVICE_ROLE_KEY` - Server-side secret key
- `EDGE_SUPABASE_PUBLISHABLE_KEY` - Must match frontend publishable key (falls back to SUPABASE_ANON_KEY)

## Important Patterns & Constraints

### Offline-First Design

1. **Temporary IDs**: Offline-created notes use `local-<uuid>` format until server returns real ID
2. **Queue Processing**: Operations are queued in IndexedDB and processed FIFO when connectivity returns
   - Queue item types: `'create' | 'update' | 'delete' | 'delete-account'`
   - Each item has: `id`, `user_id`, `type`, `timestamp`, and optional `note`, `note_id`, or `data`
3. **Cache Synchronization**: Client code must handle ID replacement when server confirms operations
4. **User State Persistence**: User info persisted in localStorage via `useOfflineUser` for offline access
5. **Background Prefetch**: `useNotesPrefetch` proactively caches note content for offline availability
6. **Account Deletion Queue**: Even account deletion can be queued offline and processed when connection restored

### User ID Handling (CRITICAL)

- **Computed UID**: Use `resolvedUid` computed property in `useNotes.ts` which handles both `user.id` and `user.sub`
- **UUID Validation**: Always validate UUIDs before making server queries using `isUUID()` helper
- **Offline User**: Falls back to `offlineUser.value?.id` when Supabase user is unavailable
- **Sub vs ID**: Some environments expose `sub` before `id` - code must handle both gracefully
- This pattern prevents invalid queries and race conditions during auth state changes

### Real-time Sync

- Channel pattern: `notes:{userId}`
- Subscribe/unsubscribe when user context changes
- Handle updates from other devices gracefully
- Use `resolvedUid` for subscription channels to ensure valid user ID

### Database Changes

1. Update Postgres schema/migrations
2. Regenerate `types/database.types.ts` using Supabase type generator
3. Update client TypeScript types accordingly

### Edge Functions

- Validate JWTs against Supabase JWKS
- Deploy with `pnpx supabase functions deploy <name> --no-verify-jwt`
- Ensure proper Authorization headers from client

### Text Search

- Uses `search_vector` column in database
- UI debouncing may ignore very short queries
- Full-text search capabilities for note content

## Development Workflow

### Prerequisites

- **Node.js**: Version 24+ (specified in `.node-version`)
- **Package Manager**: pnpm 10.22.0 (specified in `package.json`)
- Install pnpm: `npm install -g pnpm@10.22.0`

### Local Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
```

### Building

```bash
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm generate         # Generate static site
```

### Supabase Local Development

```bash
pnpx supabase start   # Start local Supabase
pnpx supabase status -o env  # Get local credentials
pnpx supabase stop    # Stop local Supabase
```

### Edge Functions

```bash
# Serve locally with env file
pnpx supabase functions serve --env-file .env

# Deploy to production
pnpx supabase functions deploy <function-name> --no-verify-jwt
```

## Common Tasks

### Adding a New Feature

1. Start with `app/composables/useNotes.ts` or `useOfflineNotes.ts` for data layer changes
2. Update UI components in `app/components/` or `app/pages/`
3. Test offline behavior thoroughly
4. Ensure real-time sync works correctly
5. Update types if database schema changes

### Modifying the Editor

- Edit `app/components/NoteEditor.vue`
- TipTap extensions are configured here
- Character count and other extensions managed in this component

### Database Schema Changes

1. Create new migration in `supabase/migrations/`
2. Apply migration locally: `pnpx supabase db reset`
3. Regenerate types: `pnpx supabase gen types typescript --local > types/database.types.ts`
4. Update client code to use new types

### Adding Authentication Features

- Auth flow components: `login.vue`, `signup.vue`, `confirm.vue`, `reset.vue`
- Supabase Auth module handles most heavy lifting
- Edge functions validate JWT for protected operations

## Troubleshooting

### Real-time or DB Calls Failing

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check that Supabase project allows requests from app origin
- Ensure user is authenticated for protected operations
- Verify user ID is a valid UUID before querying (use `isUUID()` helper)

### Edge Functions Not Working Locally

- Ensure function env vars are available to runner
- Use `--env-file` flag when serving functions
- Check that JWT keys match between frontend and functions

### Offline Sync Issues

- Check IndexedDB stores (`notes` and `queue`) in browser DevTools
- Verify queue processing logic in `useOfflineNotes.ts`
- Ensure `replaceLocalId` is called after server confirms operations
- Check that `syncPendingQueue` completes before fetching notes (prevents race conditions)

### Race Conditions & Watcher Issues

- **User Watcher**: Removed `immediate: true` to prevent double-triggering
- **Online Status**: Use immediate trigger for `isOnline` watcher to sync when coming online
- **Temporal Dead Zone**: Watchers must be ordered correctly in `useNotes.ts`
- **Queue Before Fetch**: Always await `syncPendingQueue()` before `fetchNotes()` to prevent data inconsistency

### PWA Not Updating

- Check service worker registration
- Verify `PwaReloadPrompt.vue` is rendering
- Clear service worker cache in browser DevTools

### User ID Problems

- If queries fail with invalid UUID errors, check that `resolvedUid` is being used
- Ensure `offlineUser` is persisted correctly in localStorage
- Verify user object has either `id` or `sub` property available

## Code Style & Conventions

- TypeScript strict mode enabled
- Use composables for shared logic
- Keep components focused and single-responsibility
- Prefer async/await over promises
- Use Nuxt UI components for consistency
- Follow Vue 3 Composition API patterns

## Testing Notes

- Test offline behavior: disable network in DevTools
- Verify queue processing when connectivity returns
- Test real-time sync across multiple browser tabs
- Check PWA installation and updates
- Validate authentication flows end-to-end

## Security Considerations

- Never commit `.env` files
- Server-side sanitization in Edge Functions is critical
- JWT validation on all protected operations
- Use service role key only in Edge Functions
- Validate and sanitize all user input

## Performance Tips

- IndexedDB operations are async - batch when possible
- Debounce save operations (save gating in `useNotes.ts`)
- Lazy load components where appropriate
- Use Nuxt's built-in code splitting
- Optimize PWA cache strategy for your use case

## Additional Resources

- Main README: See project root for quick start and architecture overview
- Supabase Docs: https://supabase.com/docs
- Nuxt 4 Docs: https://nuxt.com
- TipTap Docs: https://tiptap.dev
- PWA Best Practices: https://web.dev/progressive-web-apps/

## Notes for AI Assistants

- Always check `useNotes.ts` and `useOfflineNotes.ts` before modifying data layer
- Respect offline-first architecture - don't bypass queue for mutations
- Maintain real-time sync compatibility when changing data structures
- Test both online and offline scenarios
- Keep Edge Functions lightweight and focused
- Regenerate types after any database schema changes
- Prefer editing existing files over creating new ones
- Follow the established patterns in the codebase

### Recent Bug Fixes & Lessons Learned

1. **User ID Handling**: Always use `resolvedUid` computed property, never direct `user.id` or `user.sub`
2. **Race Conditions**: Multiple watchers can trigger simultaneously - use careful ordering and avoid `immediate: true`
3. **Queue Before Fetch**: Always await `syncPendingQueue()` before calling `fetchNotes()` to prevent data loss
4. **UUID Validation**: Use `isUUID()` helper before making Supabase queries to prevent errors
5. **Offline User State**: User state must be persisted in localStorage for true offline-first behavior
6. **Notes Array Clearing**: Never clear the notes array before new data arrives - causes UI flicker
7. **Watcher Order**: Temporal dead zone issues can occur if watchers reference each other - order matters
8. **Account Deletion**: Must support offline queueing like all other mutations

### Architecture Decisions

- **No Client-Side Encryption**: Crypto features were explored but removed to keep architecture simple
- **Edge Function Sanitization**: All mutations go through Edge Functions for server-side validation
- **IndexedDB Stores**: Two stores - `notes` for cache, `queue` for pending operations
- **Background Prefetch**: Proactive caching of note content for better offline experience
- **@vueuse/core v14**: Externalized from SSR/Nitro bundles to avoid CommonJS parsing issues
