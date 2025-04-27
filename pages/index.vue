<template>
  <div>
    <AppHeader /> <!-- Use the shared header component -->
    <main class="container welcome-container">
      <h1>Welcome to High Notes</h1>
      <p>Your space for brilliant thoughts.</p>
      <NuxtLink to="/login" role="button">Login</NuxtLink> 
      <p>or <NuxtLink to="/signup">Sign Up</NuxtLink></p>
    </main>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for the welcome page itself anymore
// Login/auth checks might be handled by middleware or layout
</script>

<style scoped>
/* PicoCSS is included globally via nuxt.config.ts */
.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* Adjust as needed */
  text-align: center;
}

h1 {
  margin-bottom: 0.5rem;
}

p {
  margin-bottom: 1.5rem;
}

/* Optional: Adjust button spacing if needed */
[role="button"] {
    margin-bottom: 0.5rem; /* Space between login button and signup text */
}
</style>
