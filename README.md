# High Notes
[![CodeQL](https://github.com/novafluxx/HighNotes/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/novafluxx/HighNotes/actions/workflows/github-code-scanning/codeql) [![Dependabot Updates](https://github.com/novafluxx/HighNotes/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=main)](https://github.com/novafluxx/HighNotes/actions/workflows/dependabot/dependabot-updates)

A modern note-taking Progressive Web App (PWA) built for seamless cross-platform usage with offline capabilities and secure cloud synchronization.

## ✨ Features

- 📝 **Rich Text Editor** - Advanced note editing with TipTap editor, supporting formatting, character count, and more
- 🔐 **Secure Authentication** - Complete auth flow with email/password, signup, email confirmation, and password reset
- 📱 **Progressive Web App** - Installable on any device with offline capabilities and automatic updates
- ☁️ **Real-time Sync** - Automatic synchronization across all your devices via Supabase
- 🎨 **Modern UI** - Clean, responsive design built with Nuxt UI 3 and Tailwind CSS 4
- 🌐 **Full-stack Type Safety** - End-to-end TypeScript with generated database types
- ⚡ **Fast Performance** - Optimized with Nuxt 4's latest features and Vite bundling
- 📱 **PWA Install Prompt** - Custom installation prompt for better user experience
- 💾 **Offline-First** - Create, edit, and delete notes even when offline. Changes are synced automatically when you reconnect.

## 🛠️ Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) - The latest Vue.js framework
- **UI Components**: [Nuxt UI 3](https://ui.nuxt.com/) - Beautiful, accessible components
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- **Editor**: [TipTap](https://tiptap.dev/) - Headless rich text editor
- **Backend**: [Supabase](https://supabase.com/) - PostgreSQL, Auth, Real-time subscriptions
- **PWA**: [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/) - Service worker and offline support
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Deployment**: [Netlify](https://www.netlify.com/) - Automatic deployments and hosting

## 📋 Prerequisites

- Node.js 18+ or 20+ (LTS recommended)
- pnpm 10.14.0+ (specified package manager)
- Supabase account and project (for backend services)
- Git for version control

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd HighNotes
pnpm install
```

### 2. Environment Configuration

Copy the example environment file and configure your Supabase credentials:

```bash
cp .env.example .env
```

Update `.env` with your Supabase project details:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Supabase Setup (Optional - Local Development)

For local development with Supabase:

```bash
# Start local Supabase instance
supabase start

# The local Supabase Studio will be available at http://localhost:54323
```

## 💻 Development

### Start Development Server

```bash
pnpm dev
```

The app will be available at:
- **Web App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (if running locally)
- **PWA**: Enabled in development mode for testing

## 🗄️ Database Management

### TypeScript Type Generation

Keep your types in sync with your Supabase schema:

```bash
# Generate types from remote database
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

### Local Database Development

```bash
# Start local Supabase instance
supabase start

# Reset local database (reapplies migrations)
supabase db reset

# Push local schema changes to remote
supabase db push

# Pull remote schema changes
supabase db pull

# Stop local Supabase
supabase stop
```

## 🏗️ Production Build

### Build for Production

```bash
# Standard SSR build
pnpm build

# Static site generation
pnpm generate
```

### Preview Production Build

```bash
pnpm preview
```

## 🚢 Deployment

### Netlify Deployment

The app is configured for automatic deployment on Netlify with the included `netlify.toml` configuration.

#### Environment Variables

Set these in your Netlify dashboard:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anonymous key

#### Deployment Configuration

The project includes:
- `netlify.toml` - Build and redirect configurations
- `windsurf_deployment.yaml` - Deployment metadata
- Automatic builds on push to main branch

## 📁 Project Structure

```
├── app/                   # Main application source (Nuxt 4 srcDir)
│   ├── pages/            # File-based routing
│   │   ├── index.vue     # Landing page
│   │   ├── login.vue     # Authentication page
│   │   ├── signup.vue    # User registration
│   │   ├── reset.vue     # Password reset
│   │   ├── confirm.vue   # Email confirmation
│   │   ├── notes.vue     # Main notes application
│   │   └── changelog.vue # App changelog
│   ├── components/       # Reusable Vue components
│   │   ├── AppHeader.vue # Application header
│   │   ├── NoteEditor.vue# TipTap rich text editor
│   │   └── PwaInstallPrompt.vue
│   ├── composables/      # Vue composition functions
│   ├── layouts/          # App layouts
│   ├── assets/           # CSS and static assets
│   └── types/            # TypeScript type definitions
├── supabase/             # Supabase configuration
│   ├── config.toml       # Local Supabase config
│   └── functions/        # Edge functions
├── public/               # Static assets
│   └── [PWA icons]       # Generated PWA icons
├── types/                # Global TypeScript types
├── nuxt.config.ts        # Nuxt configuration
├── tailwind.config.ts    # Tailwind CSS config
├── package.json          # Dependencies
└── pnpm-lock.yaml        # Lock file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with descriptive messages (`git commit -m 'Add amazing feature'`)
5. Test thoroughly (including PWA functionality)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🐛 Known Issues / Roadmap

- [ ] Add note categories/tags
- [ ] Enable note sharing capabilities

## 📜 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm generate     # Generate static site
pnpm preview      # Preview production build
pnpm postinstall  # Prepare Nuxt after installation
```

## License

MIT License

Copyright (c) 2025 Justin High

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
