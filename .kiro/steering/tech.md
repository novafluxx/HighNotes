---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Stack
- **Nuxt 4** (v4.0.2) with Vue 3 (v3.5.18) and TypeScript
- **Nuxt UI** (@nuxt/ui v3.3.0) for components - prefer UI components over custom implementations
- **Tailwind CSS** (v4.1.11) for styling - use utility classes, avoid custom CSS when possible
- **Supabase** for backend services with `@nuxtjs/supabase` (v1.6.0) integration
- **pnpm** (v10.14.0) for package management - always use `pnpm` commands, never `npm` or `yarn`

## Development Rules

### Package Management
- Use `pnpm install` for dependencies
- Use `pnpm dev` to start development server
- Use `pnpm build` for production builds
- Check `.node-version` for Node.js version requirements

### UI Component Guidelines
- Prefer Nuxt UI components over building custom ones
- Use `@nuxt/icon` with Heroicons or Lucide for icons
- Apply Tailwind utilities directly in templates
- Follow mobile-first responsive design patterns

### Supabase Integration
- Use `@nuxtjs/supabase` module, not direct client imports
- Access client via `useSupabaseClient()` composable
- Use `useSupabaseUser()` for auth state
- Import types from `types/database.types.ts`
- Regenerate types with: `supabase gen types typescript --project-id PROJECT_ID > types/database.types.ts`

### Environment & Configuration
- Store secrets in `.env` file (never commit)
- Use `nuxt.config.ts` runtime config for environment variables
- Required variables: `SUPABASE_URL`, `SUPABASE_KEY`
- Access runtime config via `useRuntimeConfig()`

### PWA & Performance
- Leverage `@vite-pwa/nuxt` for PWA features
- Use `@vueuse/core` utilities for common functionality
- Optimize for offline-first experience
- Implement proper loading states and error handling

### Build & Deployment
- Build target: Netlify (configured via `netlify.toml`)
- Use `pnpm generate` for static generation when needed
- Automatic deployment on git push to main branch
- Preview builds with `pnpm preview`