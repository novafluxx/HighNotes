// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

const supabaseUrl = process.env.SUPABASE_URL
let supabaseOrigin: string | undefined
try {
  supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined
} catch {}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false, // SPA mode for static generation
  // Use app directory as source (Nuxt 4 default)
  srcDir: 'app',
  experimental: {
    payloadExtraction: true
  },
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
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // Speed up first Supabase request
        ...(supabaseOrigin ? [
          { rel: 'preconnect', href: supabaseOrigin },
          { rel: 'dns-prefetch', href: supabaseOrigin }
        ] as any : [])
      ]
    },
    // Enable native View Transition API for smoother route changes (supported browsers only)
    //viewTransition: true,
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
    compressPublicAssets: true
  },
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      cleanupOutdatedCaches: true,
      navigateFallback: '/',
      // Keep precache lean: avoid html to reduce install time on mobile
      globPatterns: ['**/*.{js,css,png,svg,ico,woff,woff2}']
    },
    devOptions: {
      enabled: process.env.NODE_ENV !== 'production',
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
