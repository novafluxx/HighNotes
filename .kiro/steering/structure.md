# Project Structure

## Root Configuration
- `nuxt.config.ts` - Main Nuxt configuration with modules and PWA settings
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (not committed)
- `netlify.toml` - Netlify deployment configuration

## Source Code Organization

### `/pages/` - File-based routing
- `index.vue` - Landing/home page
- `login.vue` - User authentication
- `signup.vue` - User registration
- `reset.vue` - Password reset
- `confirm.vue` - Email confirmation
- `notes.vue` - Main notes application interface

### `/components/` - Reusable Vue components
- `AppHeader.vue` - Application header with navigation

### `/composables/` - Vue composition functions
- `useAuth.ts` - Authentication logic and state
- `useSupabase.ts` - Supabase client initialization
- `useNotes.ts` - Notes CRUD operations and state
- `useLayout.ts` - Layout and responsive behavior

### `/types/` - TypeScript definitions
- `database.types.ts` - Generated Supabase database types
- `types.ts` - Custom application types

### `/assets/css/` - Styling
- `main.css` - Global styles and Tailwind imports

### `/public/` - Static assets
- PWA icons and manifest files
- `favicon.ico` and related icons
- `robots.txt`

## Build & Deployment

### `/.nuxt/` - Generated build files (auto-generated)
### `/dist/` - Production build output
### `/.netlify/` - Netlify deployment artifacts

## Database & Backend

### `/supabase/` - Supabase configuration
- `config.toml` - Supabase project configuration
- `.gitignore` - Supabase-specific ignore rules

## Development Tools

### `/.kiro/` - Kiro AI assistant configuration
### `/.roo/` - Additional tooling configuration

## Naming Conventions
- **Files**: kebab-case for components (`AppHeader.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth.ts`)
- **Types**: PascalCase for interfaces and types
- **Pages**: lowercase for routes (`notes.vue` → `/notes`)

## Architecture Patterns
- **Composition API**: All Vue components use `<script setup>` syntax
- **Composables**: Business logic extracted into reusable composables
- **Type Safety**: Full TypeScript integration with generated Supabase types
- **Auto-imports**: Nuxt auto-imports for composables, components, and utilities