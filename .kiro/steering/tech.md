# Technology Stack

## Framework & Runtime
- **Nuxt 3** (v3.17.7) - Vue.js meta-framework with SSR/SSG capabilities
- **Vue 3** (v3.5.17) - Progressive JavaScript framework
- **Node.js** - JavaScript runtime (see .node-version for specific version)
- **TypeScript** - Type-safe JavaScript development

## UI & Styling
- **Nuxt UI** (v3.2.0) - Component library built on Headless UI and Tailwind CSS
- **Tailwind CSS** (v4.1.11) - Utility-first CSS framework
- **Heroicons & Lucide** - Icon libraries via @nuxt/icon

## Backend & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication & user management
  - Real-time subscriptions
  - Row Level Security (RLS)

## PWA & Performance
- **@vite-pwa/nuxt** - Progressive Web App capabilities
- **@vueuse/core** - Vue composition utilities

## Deployment
- **Netlify** - Static site hosting and deployment
- **Supabase Cloud** - Database and backend services

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
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

### Database (Supabase)
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database
supabase db reset
```