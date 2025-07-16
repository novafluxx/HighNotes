# Technology Stack

## Framework & Runtime
- **Nuxt 3** - Vue.js meta-framework with SSR/SSG capabilities
- **Vue 3** - Frontend framework with Composition API
- **Node.js** - JavaScript runtime environment

## Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **@nuxtjs/supabase** - Official Nuxt integration for Supabase
- **@supabase/supabase-js** - JavaScript client library

## UI & Styling
- **Nuxt UI** - Component library built on Tailwind CSS
- **Tailwind CSS v4** - Utility-first CSS framework
- **@nuxt/icon** - Icon system with Heroicons and Lucide icons
- **@vueuse/core** - Vue composition utilities

## PWA & Performance
- **@vite-pwa/nuxt** - PWA capabilities with Vite
- **Workbox** - Service worker for caching strategies

## Development Tools
- **TypeScript** - Type safety and better DX
- **Playwright** - End-to-end testing framework
- **ESLint** - Code linting and formatting

## Package Management
- **pnpm** - Fast, disk space efficient package manager

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm generate     # Generate static site
```

### Testing
```bash
pnpm test         # Run Playwright tests
```

### Dependencies
```bash
pnpm install      # Install dependencies
pnpm postinstall  # Run Nuxt preparation
```

## Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `TEST_USER` - Test user email
- `TEST_PASSWORD` - Test user password