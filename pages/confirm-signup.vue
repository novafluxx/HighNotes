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

function confirm() {
  if (confirmationUrl) {
    window.location.href = confirmationUrl;
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
