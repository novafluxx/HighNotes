---
inclusion: always
---

# Project Structure & Code Organization

## File Structure Rules

### Core Directories
- `/app/pages/` - File-based routing (index, login, signup, reset, confirm, notes)
- `/app/components/` - Vue components using PascalCase (AppHeader.vue)
- `/app/composables/` - Business logic with camelCase `use` prefix (useAuth.ts, useNotes.ts)
- `/app/types/` - TypeScript definitions (database.types.ts from Supabase, custom types.ts)
- `/app/assets/` - Stylesheets and static assets
- `/public/` - Static files served at root (PWA icons, favicon, robots.txt)

### Key Files
- `app/app.vue` - Main entry point with UApp wrapper
- `nuxt.config.ts` - Configuration with modules and runtime config
- `types/database.types.ts` - Generated Supabase types (regenerate with `supabase gen types`)

## Code Architecture Patterns

### Component Rules
- **Always use** `<script setup>` syntax with Composition API
- **PascalCase** for component names and files
- Define props/emits with `defineProps()` and `defineEmits()`
- Keep template logic minimal, extract complex logic to composables

### Composables Pattern
- **camelCase** naming with `use` prefix (useAuth, useNotes, useLayout)
- Extract all business logic from components
- Use Vue's reactivity system for state management
- Single responsibility per composable
- Import Supabase types for type safety

### Type Safety Requirements
- Import generated `database.types.ts` in all composables
- Use strict TypeScript configuration
- Define custom interfaces in `/app/types/types.ts`
- Type all Supabase operations with generated types

### Authentication Architecture
- Use `@nuxtjs/supabase` module integration
- Global user state via `useSupabaseUser()`
- Route protection configured in `nuxt.config.ts`
- Auth logic centralized in `useAuth.ts` composable

### State Management
- **No external state libraries** - use Vue reactivity
- Composables provide reactive state across components
- Local component state only for UI-specific data
- Auto-save patterns for data persistence