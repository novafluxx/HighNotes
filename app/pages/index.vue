<template>
  <div>

    <!-- Replace main container and styles with Tailwind -->
    <main class="flex flex-col justify-center items-center min-h-[80vh] text-center px-4">
      <h1 class="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to High Notes</h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">Your space for brilliant thoughts.</p>
      <!-- Use a click handler to navigate so the Nuxt router handles routing reliably -->
      <UButton @click="navigateTo('/login')" label="Login" size="lg" class="mb-4" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        or <NuxtLink to="/signup"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
          Sign Up</NuxtLink>
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Be sure to check out the
        <NuxtLink to="/changelog" label="Changelog"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
          Changelog</NuxtLink>
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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
