# Project Structure & Organization

## Root Level Files
- `app.vue` - Main application entry point with UApp wrapper
- `nuxt.config.ts` - Nuxt configuration with modules and runtime config
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (not committed)

## Core Directories

### `/pages` - File-based Routing
- `index.vue` - Landing/home page
- `login.vue` - User authentication login
- `signup.vue` - User registration
- `reset.vue` - Password reset
- `confirm.vue` - Email confirmation
- `notes.vue` - Main notes application interface

### `/components` - Reusable Vue Components
- `AppHeader.vue` - Global navigation header with auth state
- Follow PascalCase naming convention
- Use composition API with `<script setup>`

### `/composables` - Vue Composition Functions
- `useAuth.ts` - Authentication logic (login/logout actions)
- `useSupabase.ts` - Supabase client singleton
- `useNotes.ts` - Notes CRUD operations and state management
- `useLayout.ts` - UI layout state (sidebar, mobile responsiveness)
- Follow camelCase naming with `use` prefix

### `/types` - TypeScript Definitions
- `database.types.ts` - Generated Supabase database types
- `types.ts` - Custom application types (Note interface)
- Import database types in composables for type safety

### `/assets` - Static Assets
- `/css` - Global stylesheets and Tailwind imports

### `/public` - Static Files
- PWA icons and manifest files
- `favicon.ico`, `robots.txt`
- Served directly at root URL

## Generated/Build Directories
- `/.nuxt` - Nuxt build artifacts (auto-generated)
- `/dist` - Production build output
- `/node_modules` - Dependencies

## Configuration Files
- `/supabase/config.toml` - Supabase local development config
- `netlify.toml` - Netlify deployment configuration
- `pnpm-lock.yaml` - Package lock file

## Architectural Patterns

### Composables Pattern
- Business logic extracted to composables
- Reactive state management with Vue's reactivity system
- Single responsibility principle per composable

### Component Structure
- Use `<script setup>` syntax for composition API
- Props and emits defined with `defineProps()` and `defineEmits()`
- Template-first approach with minimal script logic

### Type Safety
- Import and use generated Supabase types
- Custom interfaces in `/types` for application-specific data
- Strict TypeScript configuration

### Authentication Flow
- Supabase Auth integration via `@nuxtjs/supabase`
- Route protection configured in `nuxt.config.ts`
- User state managed globally via `useSupabaseUser()`

### State Management
- No external state management library
- Composables provide reactive state
- Local component state for UI-specific data