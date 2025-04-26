<template>
  <main class="container">
    <article>
      <h2>Checking credentials...</h2>
      <p aria-busy="true">Please wait while we confirm your login.</p>
    </article>
  </main>
</template>

<script setup>
// The Supabase module automatically handles the session confirmation
// when the user lands on this page (the callback route).
// We might add a redirect here later if needed.

// Example: Redirecting after a short delay or checking status
// const user = useSupabaseUser()
// watch(user, () => {
//   if (user.value) {
//     navigateTo('/') // Or '/notes'
//   }
// }, { immediate: true })

</script>

<style scoped>
  main.container {
    max-width: 500px;
    margin-top: 5rem;
    text-align: center;
  }
</style>
