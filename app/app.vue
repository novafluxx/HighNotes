<script setup lang="ts">
// Enable PWA in development
if (process.dev) {
  // This helps with PWA development
}
</script>

<template>
  <UApp>
    <NuxtPage />
    <VitePwaManifest />
  </UApp>
</template>
