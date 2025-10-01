<template>
  <div class="flex flex-col h-screen">
    <AppHeader />
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// No script needed for this basic layout
</script>
