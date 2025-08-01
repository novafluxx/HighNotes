---
inclusion: always
---

# High Notes - Product Guidelines

High Notes is a modern PWA for note-taking built with Vue 3 and Nuxt 3. When working on this project, follow these product conventions and architectural patterns.

## Core Features & Behavior

- **Authentication**: Email/password auth via Supabase Auth with protected routes
- **Note Management**: CRUD operations with auto-save functionality
- **PWA Capabilities**: Offline support, installable, mobile-optimized
- **Theme System**: Dark/light mode toggle with localStorage persistence
- **Responsive UI**: Mobile-first with collapsible sidebar navigation

## User Experience Patterns

- **Auto-save**: Notes save automatically without explicit save actions
- **Instant Feedback**: UI updates immediately, sync happens in background
- **Progressive Enhancement**: Core functionality works offline, enhanced when online
- **Mobile-first**: Touch-friendly interface, thumb-accessible navigation
- **Minimal UI**: Clean, distraction-free editing experience

## Code Style & Architecture

- **Composition API**: Use `<script setup>` syntax exclusively
- **Composables Pattern**: Extract business logic to reusable composables
- **Type Safety**: Leverage generated Supabase types and custom interfaces
- **Component Naming**: PascalCase for components, camelCase for composables
- **State Management**: Use Vue reactivity, avoid external state libraries
- **Error Handling**: Graceful degradation with user-friendly error messages

## Authentication Flow

- Redirect unauthenticated users to `/login`
- Persist auth state across sessions
- Handle email confirmation and password reset flows
- Show loading states during auth operations

## Data Patterns

- **Notes Schema**: `id`, `title`, `content`, `created_at`, `updated_at`, `user_id`
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Real-time Sync**: Use Supabase realtime subscriptions where beneficial
- **Search**: Client-side filtering for responsive search experience