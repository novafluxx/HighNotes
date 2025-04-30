<template>
  <div>
    <AppHeader />
    <main class="container login-container">
      <article class="grid">
        <div>
          <hgroup>
            <h1>Reset Password</h1>
            <h2>Enter your email to receive a reset link</h2>
          </hgroup>
          <form @submit.prevent="resetPassword">
            <label for="email">Email Address</label>
            <input type="email" id="email" v-model="email" placeholder="Email address" required />
            <button type="submit">Send Reset Link</button>
            <p v-if="successMsg" class="success-message">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
          </form>
          <p>Remembered your password? <NuxtLink to="/login">Login</NuxtLink></p>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const email = ref('');
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);

const resetPassword = async () => {
  successMsg.value = null;
  errorMsg.value = null;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/confirm',
    });
    if (error) throw error;
    successMsg.value = 'Password reset email sent! Please check your inbox.';
  } catch (error: any) {
    errorMsg.value = error.message || 'Failed to send reset email.';
    setTimeout(() => {
      errorMsg.value = null;
    }, 5000);
  }
};
</script>

<style scoped>
.success-message {
  color: green;
  margin-top: 10px;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>
