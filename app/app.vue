<script setup lang="ts">
// Enable PWA in development
if (process.dev) {
  // This helps with PWA development
}
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <VitePwaManifest />
  </UApp>
</template>
