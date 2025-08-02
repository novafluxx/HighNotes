# High Notes

A modern note-taking Progressive Web App (PWA) built for seamless cross-platform usage with offline capabilities and secure cloud synchronization.

## Features

- 📝 **Note Management** - Create, edit, and organize your personal notes
- 🔐 **Secure Authentication** - User accounts with email/password authentication
- 📱 **Progressive Web App** - Install on any device, works offline
- ☁️ **Real-time Sync** - Automatic synchronization across all your devices
- 🎨 **Modern UI** - Clean, accessible design built with Nuxt UI and Tailwind CSS

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript
- **UI**: Nuxt UI, Tailwind CSS 4, Heroicons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **PWA**: Vite PWA with service worker
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- Supabase account and project

## Setup

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd highnotes
pnpm install
```

2. **Environment Configuration:**

Copy `.env.example` to `.env` and configure your Supabase credentials:

```bash
cp .env.example .env
```

Update `.env` with your Supabase project details:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

3. **Start Supabase locally (optional):**

```bash
supabase start
```

## Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

The app will be available at:
- **Web App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (if running locally)

## Database

### Generate Types

Update TypeScript types from your Supabase schema:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

### Local Development

```bash
# Start local Supabase
supabase start

# Reset local database
supabase db reset

# Apply migrations
supabase db push
```

## Production

Build the application for production:

```bash
pnpm build
```

Preview production build locally:

```bash
pnpm preview
```

Generate static site:

```bash
pnpm generate
```

## Deployment

The app is configured for deployment on Netlify. Make sure to set your environment variables in your Netlify dashboard:

- `SUPABASE_URL`
- `SUPABASE_KEY`

## Project Structure

```
├── app/                   # Main application source
│   ├── pages/            # File-based routing
│   ├── components/       # Vue components
│   ├── composables/      # Vue composition functions
│   └── assets/           # Stylesheets and assets
├── supabase/             # Database migrations and config
├── types/                # TypeScript definitions
└── public/               # Static assets and PWA icons
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]
