# Technology Stack

## Framework & Runtime
- **Nuxt 4** - Vue.js meta-framework with SSR/SSG capabilities
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe JavaScript development
- **Node.js** - JavaScript runtime environment

## UI & Styling
- **Nuxt UI** - Component library built on Tailwind CSS
- **Tailwind CSS 4** - Utility-first CSS framework
- **Nuxt Icon** - Icon system with Heroicons and Lucide icons
- **VueUse** - Collection of Vue composition utilities

## Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Authentication and user management
- **Real-time subscriptions** - Live data updates via Supabase

## PWA & Performance
- **Vite PWA** - Progressive Web App capabilities
- **Service Worker** - Offline functionality and caching
- **Web App Manifest** - Native app-like installation

## Package Management
- **pnpm** - Fast, disk space efficient package manager (preferred)
- Supports npm, yarn, and bun as alternatives

## Development & Deployment
- **Netlify** - Static site hosting and deployment
- **Supabase CLI** - Local development and database management

## Common Commands

### Development
```bash
# Install dependencies (preferred)
pnpm install

# Start development server
pnpm dev

# Run Supabase locally
supabase start
```

### Build & Deploy
```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Generate static site
pnpm generate
```

### Database Management
```bash
# Generate TypeScript types from Supabase schema
supabase gen types typescript --project-id HighNotes > types/database.types.ts

# Reset local database
supabase db reset

# Apply migrations
supabase db push
```

## Environment Setup
- Requires `.env` file with `SUPABASE_URL` and `SUPABASE_KEY`
- Local Supabase instance runs on port 54321 (API), 54322 (DB), 54323 (Studio)
- Development server runs on `http://localhost:3000`