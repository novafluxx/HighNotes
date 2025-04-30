<template>
  <main class="container">
    <h2>Almost done!</h2>
    <p>To complete your sign up, please confirm below:</p>
    <button @click="confirm" :disabled="!confirmationUrl">Click to Confirm</button>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const confirmationUrl = route.query.confirmation_url as string | undefined;

async function confirm() {
  if (confirmationUrl) {
    // Visit the confirmation URL to complete the signup
    await fetch(confirmationUrl, { credentials: 'include' });
    // Redirect to login page
    window.location.href = '/login';
  }
}
</script>

<style scoped>
main.container {
  max-width: 500px;
  margin-top: 5rem;
  text-align: center;
}
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
