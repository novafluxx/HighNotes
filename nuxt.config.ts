// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui'
  ],
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
        //{ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@picocss/pico@latest/css/pico.min.css' } // Removed PicoCSS
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // PWA / Manifest icons (uncomment and ensure files exist if needed)
        // { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192x192.png' },
        // { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512x512.png' },
        // { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  nitro: {
    externals: { 
      inline: ['@vueuse/core', '@vueuse/shared'] 
    },
    compressPublicAssets: true, // generate gzip/brotli static assets
    routeRules: {
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/**': { swr: 60 } // stale-while-revalidate caching
    }
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'supabase': ['@supabase/supabase-js']
          }
        }
      }
    }
  }
})
