<template>
  <main class="container">
    <article v-if="showReset">
      <h2>Reset Your Password</h2>
      <form @submit.prevent="submitNewPassword">
        <label for="new-password">New Password</label>
        <input type="password" id="new-password" v-model="newPassword" placeholder="Enter new password" required minlength="8" />
        <button type="submit">Set New Password</button>
        <p v-if="successMsg" class="success-message">{{ successMsg }}</p>
        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
      </form>
    </article>

    <article v-else>
      <h2>Checking credentials...</h2>
      <p aria-busy="true">Please wait while we confirm your login.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { watchEffect, ref } from 'vue';

const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();

const newPassword = ref('');
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);
const showReset = ref(false);

// Watch for changes in user state
watchEffect(() => {
  // Explicitly handle recovery type first
  if (route.query.type === 'recovery') {
    showReset.value = true;
    return;
  }

  // If user becomes available (logged in) and it's not a recovery flow,
  // assume confirmation succeeded and redirect.
  if (user.value) {
    // Maybe redirect to a dashboard or home page instead of showing reset?
    router.push('/notes'); 
  }
  
  // If user is null and type is not 'recovery', the component will show
  // the 'Checking credentials...' message by default (showReset is false).
  // Supabase listener should handle the session update eventually.
  // If it remains null indefinitely, the user might need to log in manually.
});

const submitNewPassword = async () => {
  errorMsg.value = null;
  successMsg.value = null;
  if (!newPassword.value || newPassword.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.';
    return;
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    successMsg.value = 'Password updated! You can now log in with your new password.';
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to update password.';
  }
};
</script>

<style scoped>
  main.container {
    max-width: 500px;
    margin-top: 5rem;
    text-align: center;
  }
</style>
