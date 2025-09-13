// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  // Use app directory as source (Nuxt 4 default)
  srcDir: 'app',
  modules: [
    '@nuxt/icon',
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
      exclude: ['/', '/signup', '/reset', '/confirm', '/changelog'], // Allow access to the pages without signing in
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      ...(process.env.NODE_ENV === 'development' && {
        testUser: process.env.TEST_USER,
        testPassword: process.env.TEST_PASSWORD
      })
    }
  },
  app: {
    head: {
      title: 'High Notes',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    },
    // Global page transition (can be overridden per-page with definePageMeta)
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
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
      // Consistent precaching for both environments
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    devOptions: {
      enabled: true,
      type: 'classic'
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
  // Pre-bundle critical icons so they render offline
  icon: {
    clientBundle: {
      // Pre-bundle Lucide icon to work offline
      icons: [
        'lucide:wifi-off',
        'lucide:sun',
        'lucide:moon',
        'lucide:menu',
        'lucide:user',
        'lucide:pencil',
        'lucide:clipboard-list',
        'lucide:log-in',
        'lucide:log-out',
        // Notes page icons
        'lucide:search',
        'lucide:x',
        'lucide:plus-circle',
        'lucide:arrow-down-circle',
        'lucide:trash',
        // Auth & alerts
        'lucide:mail',
        'lucide:lock',
        'lucide:check-circle',
        'lucide:alert-triangle',
        // Editor toolbar
        'lucide:bold',
        'lucide:italic',
        'lucide:strikethrough',
        'lucide:code',
        'lucide:list',
        'lucide:list-ordered',
        'lucide:x-circle',
        // PWA prompt
        'lucide:download',
      ]
    }
  },
});
