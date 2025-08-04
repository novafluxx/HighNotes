---
inclusion: always
---

# Technical Stack & Development Constraints

## Mandatory Stack Components
**NEVER suggest alternatives to these core technologies:**
- **Nuxt 4** with Vue 3 Composition API only
- **TypeScript** for all new files (`.ts` or `.vue` with `<script setup lang="ts">`)
- **Nuxt UI** components as first choice before custom components
- **Tailwind CSS 4** for all styling
- **pnpm** as package manager
- **Supabase** as the only backend solution

## Code Generation Rules
**When creating Vue components:**
- Generate `<script setup lang="ts">` syntax exclusively
- Import types using `import type { }` for tree-shaking
- Use `~/` prefix for all app directory imports
- Leverage auto-imports for: Vue composables, Nuxt utilities, app components
- Manually import: external libraries, specific utilities

**When writing TypeScript:**
- Reference database types from `types/database.types.ts`
- Use generated Supabase types for all database operations
- Implement proper type safety throughout

## Database & Authentication Patterns
**Critical security requirements:**
- Filter ALL database queries by authenticated `user_id`
- Use only the `useAuth()` composable for authentication state
- Implement Supabase real-time subscriptions for live updates
- Never expose cross-user data

**Required commands for database work:**
```bash
# Type generation after schema changes
supabase gen types typescript --project-id HighNotes > types/database.types.ts

# Local development
supabase start
supabase db reset
```

## Development Workflow
**Package management (use exclusively):**
```bash
pnpm install
pnpm dev
```

**Environment setup requirements:**
- `.env` file with `SUPABASE_URL` and `SUPABASE_KEY`
- Local ports: 3000 (app), 54321 (Supabase API), 54323 (Studio)
- Netlify deployment with automatic builds

## PWA & Performance Requirements
**All features must:**
- Function offline-first
- Use service workers for caching
- Follow mobile-first responsive design
- Implement lazy loading for non-critical components

## UI & Asset Standards
**For icons and assets:**
- Use `UIcon` component with Heroicons or Lucide icon sets
- Place static assets in `public/` directory
- Optimize all images for web performance

**Styling constraints:**
- Use Tailwind CSS 4 classes only
- Avoid inline styles or CSS modules
- Prioritize Nuxt UI components over custom styling