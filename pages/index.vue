<template>
  <div>
    <AppHeader /> <!-- Use the shared header component -->
    <main class="container main-container">
      <article class="grid">
        <div>
          <hgroup>
            <h1>Sign In</h1>
            <h2>Access your <strong>High Notes</strong></h2>
          </hgroup>
          <form @submit.prevent="handleLogin">
            <label for="email">
              Email address
              <input type="email" id="email" name="email" placeholder="Email address" v-model="email" required>
            </label>

            <label for="password">
              Password
              <input type="password" id="password" name="password" placeholder="Password" v-model="password" required>
            </label>

            <button type="submit" :disabled="loading" :aria-busy="loading">Login</button>
            <p v-if="authError" class="error-message">{{ authError.message }}</p>
          </form>
        </div> <!-- Closing div for grid column, if applicable (assuming it was there before) -->
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import AppHeader from '~/components/AppHeader.vue';
import type { AuthError } from '@supabase/supabase-js'; // Import type if needed

const { login, loading: authLoading } = useAuth(); // Use login function and loading state from useAuth

const email = ref('')
const password = ref('')
const authError = ref<AuthError | null>(null); // Store potential auth error

// Computed property to pass loading state to button
const loading = computed(() => authLoading.value);

const handleLogin = async () => {
  authError.value = null; // Clear previous errors
  try {
    // Call the login function from useAuth
    const { error } = await login(email.value, password.value);
    if (error) {
      authError.value = error;
      console.error('Login Error:', error);
    }
    // Redirect is handled within the useAuth login function on success
  } catch (error) {
    // Handle unexpected errors if login itself throws (unlikely with current setup)
    console.error('Unexpected Login Process Error:', error);
    authError.value = { name: 'UnexpectedError', message: 'An unexpected error occurred.' } as AuthError;
  }
}
</script>

<style scoped>
.main-container { /* Keep container styles */
  margin-top: var(--pico-block-spacing-vertical);
  max-width: 600px;
}

hgroup h1 {
  margin-bottom: 0;
}

article {
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--card-box-shadow);
}

button {
  width: 100%;
}

.error-message {
  color: var(--pico-color-red);
  margin-top: 1rem;
}
</style>
