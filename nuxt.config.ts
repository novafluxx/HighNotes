// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
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
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
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
    manifest: {
      name: 'High Notes',
      short_name: 'HighNotes',
      description: 'A modern note-taking app.',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      display_override: ["window-controls-overlay", "standalone"],
      start_url: '/notes',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      cleanupOutdatedCaches: true
    }
  }
})
