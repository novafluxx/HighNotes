---
inclusion: always
---

# Technical Guidelines & Stack Constraints

## Core Stack Requirements
- **Always use Nuxt 4** with Vue 3 Composition API - never suggest Options API
- **TypeScript is mandatory** - all new files must use `.ts` or `.vue` with `<script setup lang="ts">`
- **Nuxt UI components are preferred** - use these before creating custom components
- **Tailwind CSS 4** for styling - avoid inline styles or CSS modules
- **pnpm is the package manager** - never suggest npm or yarn commands

## Code Generation Rules
- Use `<script setup lang="ts">` syntax in all Vue components
- Import types with `import type { }` syntax for better tree-shaking
- Auto-imports are available for: Vue composables, Nuxt utilities, app components
- Manual imports required for: external libraries, specific utilities
- Always use `~/` prefix for app directory imports

## Database & Backend Patterns
- **Supabase is the only backend** - never suggest alternatives
- All database queries must use generated TypeScript types from `types/database.types.ts`
- User data isolation is critical - always filter by `user_id` in queries
- Use Supabase real-time subscriptions for live data updates
- Authentication state via `useAuth()` composable only

## Development Workflow Commands
```bash
# Always use pnpm (never npm/yarn)
pnpm install
pnpm dev

# Database type generation (run after schema changes)
supabase gen types typescript --project-id HighNotes > types/database.types.ts

# Local Supabase development
supabase start
supabase db reset
```

## PWA & Performance Constraints
- All features must work offline-first
- Use service workers for caching strategies
- Optimize for mobile-first responsive design
- Lazy load components and pages where appropriate

## Environment Configuration
- `.env` file required with `SUPABASE_URL` and `SUPABASE_KEY`
- Local development uses ports: 3000 (app), 54321 (Supabase API), 54323 (Studio)
- Production deployment via Netlify with automatic builds

## Icon and Asset Guidelines
- Use `UIcon` component with Heroicons or Lucide icon sets
- Place static assets in `public/` directory
- Optimize images for web performance