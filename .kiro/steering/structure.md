# Project Structure

## Root Configuration
- `nuxt.config.ts` - Main Nuxt configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `playwright.config.ts` - E2E testing configuration
- `netlify.toml` - Deployment configuration
- `.env` - Environment variables (not committed)

## Source Code Organization

### `/pages/` - File-based Routing
- `index.vue` - Landing/welcome page
- `login.vue` - User authentication
- `signup.vue` - User registration
- `notes.vue` - Main notes interface
- `confirm.vue` - Email confirmation
- `reset.vue` - Password reset

### `/components/` - Reusable Vue Components
- `AppHeader.vue` - Global navigation header
- Follow PascalCase naming convention
- Use composition API with `<script setup>`

### `/composables/` - Vue Composition Functions
- `useAuth.ts` - Authentication logic
- `useNotes.ts` - Notes CRUD operations
- `useSupabase.ts` - Supabase client utilities
- `useLayout.ts` - Layout state management
- Follow camelCase naming with `use` prefix

### `/types/` - TypeScript Definitions
- `database.types.ts` - Generated Supabase types
- `types.ts` - Custom application types

### `/assets/` - Static Assets
- `/css/` - Global stylesheets and Tailwind imports

### `/public/` - Static Files
- PWA icons and manifest files
- `robots.txt` and SEO assets

### `/tests/` - E2E Testing
- `*.spec.ts` - Playwright test files
- Organized by feature (auth, notes, basic)

### `/supabase/` - Database Configuration
- `config.toml` - Local Supabase configuration
- Database migrations and seeds

## Naming Conventions
- **Files**: kebab-case for pages, PascalCase for components
- **Composables**: camelCase with `use` prefix
- **Types**: PascalCase interfaces, camelCase properties
- **CSS Classes**: Tailwind utility classes preferred

## Import Patterns
- Use auto-imports for Nuxt/Vue utilities
- Explicit imports for custom composables
- Type-only imports for TypeScript definitions

## Code Organization Principles
- Keep components focused and single-purpose
- Extract business logic into composables
- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Maintain clear separation between UI and logic