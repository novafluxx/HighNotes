<template>
  <div class="flex flex-col min-h-dvh">
    <AppHeader />
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// No script needed for this basic layout
</script>
