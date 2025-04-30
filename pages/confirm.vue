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
    <article v-else-if="showVerification">
      <h2>Thank you for verifying your email!</h2>
      <p>Redirecting you to the login page...</p>
    </article>
    <article v-else>
      <h2>Checking credentials...</h2>
      <p aria-busy="true">Please wait while we confirm your login.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();

const newPassword = ref('');
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);
const showReset = ref(false);
const showVerification = ref(false);

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

onMounted(async () => {
  // If type is explicitly 'recovery', always show reset
  if (route.query.type === 'recovery') {
    showReset.value = true;
    return;
  }
  // If type is explicitly 'signup', always show verification
  if (route.query.type === 'signup') {
    showVerification.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 3000);
    return;
  }
  // If only code is present, wait for Supabase to process, then check user
  if (route.query.code) {
    setTimeout(() => {
      if (!user.value) {
        showVerification.value = true;
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        showReset.value = true;
      }
    }, 2000); // Give Supabase time to process session
    return;
  }
});
</script>

<style scoped>
  main.container {
    max-width: 500px;
    margin-top: 5rem;
    text-align: center;
  }
</style>
