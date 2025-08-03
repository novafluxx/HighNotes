// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // Use app directory as source (Nuxt 4 default)
  srcDir: 'app',
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],
  ui: {
    fonts: false // Disable default Nuxt UI font handling
  },
  supabase: {
    // Options https://supabase.nuxtjs.org/get-started/options
    redirectOptions: {
      login: '/login',
      callback: '/confirm', // Assuming you have a /confirm route for email confirmations
      exclude: ['/', '/signup', '/reset', '/confirm'], // Allow access to the pages without signing in
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },
  app: {
    head: {
      title: 'High Notes',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  nitro: {
    externals: {
      inline: ['@vueuse/core', '@vueuse/shared']
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      cleanupOutdatedCaches: true,
      navigateFallback: '/',
      // Minimal precaching for development
      globPatterns: process.env.NODE_ENV === 'production' 
        ? ['**/*.{js,css,html,png,svg,ico}'] 
        : []
    },
    devOptions: {
      enabled: true,
      type: 'module'
    },
    manifest: {
      name: 'High Notes',
      short_name: 'High Notes',
      description: 'A modern note-taking app.',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    }
  },
  tailwindcss: {
    config: {
      plugins: [
        require('@tailwindcss/typography'),
      ],
    },
  },
})
