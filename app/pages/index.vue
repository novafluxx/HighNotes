<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
    <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse">
      </div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000">
      </div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/30 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-pulse delay-500">
      </div>
    </div>

    <!-- Main content -->
    <main class="relative z-10 flex flex-col justify-center items-center min-h-screen text-center px-4 py-12">
      <!-- Hero section -->
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Icon/Logo area -->
        <div class="mb-8">
          <div
            class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40 mb-6">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        </div>

        <!-- Title and subtitle -->
        <div class="space-y-4">
          <h1
            class="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
            High Notes
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Your space for <span class="font-semibold text-blue-600 dark:text-blue-400">brilliant thoughts</span> and
            creative inspiration
          </p>
        </div>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <UButton @click="navigateTo('/login')" size="xl"
            class="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <span class="font-semibold">Get Started</span>
          </UButton>

          <UButton @click="navigateTo('/signup')" variant="ghost" size="xl"
            class="min-w-[200px] border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:ring-1 hover:ring-blue-200 dark:hover:ring-blue-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
            <span class="font-semibold">Sign Up Free</span>
          </UButton>
        </div>

        <!-- Feature highlights -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-16 max-w-4xl mx-auto place-items-center">
          <div
            class="group p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white hover:border-gray-300 hover:ring-1 hover:ring-blue-200 dark:hover:bg-gray-800/90 dark:hover:border-gray-600 dark:hover:ring-1 dark:hover:ring-blue-900/40 max-w-sm w-full mx-auto text-center">
            <div
              class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Real-time Sync</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Access your notes anywhere, anytime</p>
          </div>

          <div
            class="group p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white hover:border-gray-300 hover:ring-1 hover:ring-blue-200 dark:hover:bg-gray-800/90 dark:hover:border-gray-600 dark:hover:ring-1 dark:hover:ring-blue-900/40 max-w-sm w-full mx-auto text-center">
            <div
              class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Offline Ready</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Work seamlessly without internet connection</p>
          </div>
        </div>

        <!-- Footer links -->
        <div class="pt-8 space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            New to High Notes?
            <NuxtLink to="/signup"
              class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 ml-1 hover:underline transition-colors duration-200">
              Create your free account
            </NuxtLink>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Check out our latest updates in the
            <NuxtLink to="/changelog"
              class="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 ml-1 hover:underline transition-colors duration-200">
              Changelog
            </NuxtLink>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  ssr: true // Enable SSR for public landing page
});

// Redirect authenticated users to the notes page
const user = useSupabaseUser();

// Use a one-time watcher with a guard to prevent multiple redirects
const hasRedirected = ref(false);
watch(user, (newUser) => {
  if (newUser && !hasRedirected.value) {
    hasRedirected.value = true;
    navigateTo('/notes');
  }
}, { immediate: true });
</script>
