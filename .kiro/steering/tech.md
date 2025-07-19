# Technology Stack & Build System

## Core Framework
- **Nuxt 3** (v3.17.7) - Vue.js meta-framework with SSR/SSG capabilities
- **Vue 3** (v3.5.17) - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript development

## UI & Styling
- **Nuxt UI** (@nuxt/ui v3.2.0) - Component library built on Tailwind CSS
- **Tailwind CSS** (v4.1.11) - Utility-first CSS framework
- **Heroicons & Lucide** - Icon libraries via @nuxt/icon

## Backend & Database
- **Supabase** - Backend-as-a-Service for authentication and database
  - `@nuxtjs/supabase` (v1.5.3) - Nuxt integration
  - `@supabase/supabase-js` (v2.51.0) - JavaScript client
- **PostgreSQL** - Database (via Supabase)

## PWA & Performance
- **Vite PWA** (@vite-pwa/nuxt v1.0.4) - Progressive Web App capabilities
- **VueUse** (@vueuse/core v13.5.0) - Vue composition utilities

## Package Management
- **pnpm** - Fast, disk space efficient package manager
- **Node.js** - Runtime environment (see .node-version for specific version)

## Development Tools
- **Nuxt DevTools** - Built-in development experience
- **Supabase CLI** - Local development and database management

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Generate static site
pnpm generate

# Preview production build
pnpm preview
```

### Build & Deploy
```bash
# Build for production
pnpm build

# Deploy to Netlify (configured via netlify.toml)
# Automatic deployment on git push
```

### Database
```bash
# Generate TypeScript types from Supabase schema
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## Environment Configuration
- Environment variables managed via `.env` file
- Runtime config in `nuxt.config.ts` for public/private variables
- Supabase credentials required: `SUPABASE_URL` and `SUPABASE_KEY`