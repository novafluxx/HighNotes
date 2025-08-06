## Project Overview

This project is a modern note-taking Progressive Web App (PWA) called High Notes. It's built with Nuxt 4 and Vue 3, using TypeScript for the frontend. The UI is built with Nuxt UI and Tailwind CSS. The backend is powered by Supabase, providing a PostgreSQL database, authentication, and real-time features. The application is designed to be installable on any device, work offline, and sync notes in real-time across devices.

## Building and Running

### Prerequisites

*   Node.js 18+
*   pnpm
*   A Supabase account and project

### Setup

1.  **Clone the repository and install dependencies:**
    ```bash
    git clone <repository-url>
    cd highnotes
    pnpm install
    ```

2.  **Configure your environment:**

    Copy `.env.example` to `.env` and add your Supabase project URL and anonymous key.

    ```bash
    cp .env.example .env
    ```

    **.env**
    ```
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

### Development

To start the development server, run:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the application for production, run:

```bash
pnpm build
```

To preview the production build locally, run:

```bash
pnpm preview
```

## Development Conventions

*   **Package Manager**: This project uses `pnpm` for package management.
*   **State Management**: State is managed through Vue's Composition API, with composables like `useAuth`, `useNotes`, and `useSupabase`.
*   **Styling**: Styling is done with Tailwind CSS and Nuxt UI.
*   **Database Types**: TypeScript types for the Supabase database should be generated whenever the schema changes:
    ```bash
    supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
    ```
*   **Deployment**: The project is configured for deployment on Netlify.
