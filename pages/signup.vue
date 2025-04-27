<template>
  <div>
    <AppHeader />
    <main class="container signup-container">
      <article class="grid">
        <div>
          <hgroup>
            <h1>Sign Up</h1>
            <h2>Create your <strong>High Notes</strong> account</h2>
          </hgroup>
          <form @submit.prevent="handleSignup">
            <label for="email">Email address</label>
            <input type="email" id="email" v-model="email" placeholder="Email address" required />

            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" placeholder="Password (min. 6 characters)" required />

            <!-- Optional: Add Confirm Password -->
            <!--
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="Confirm Password" required />
            -->

            <button type="submit">Sign Up</button>
            <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
            <p v-if="successMsg" class="success-message">{{ successMsg }}</p>
          </form>
          <p>Already have an account? <NuxtLink to="/login">Login</NuxtLink></p>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref('');
const password = ref('');
// const confirmPassword = ref(''); // Uncomment if using confirm password
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const handleSignup = async () => {
  errorMsg.value = null;
  successMsg.value = null;

  // Optional: Check if passwords match
  // if (password.value !== confirmPassword.value) {
  //   errorMsg.value = 'Passwords do not match.';
  //   return;
  // }

  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    successMsg.value = 'Account created successfully! Please check your email to confirm your registration.';
    // Optionally redirect after a delay or keep user on page
    // setTimeout(() => router.push('/login'), 5000); 
  } catch (error: any) {
    errorMsg.value = error.message;
    setTimeout(() => {
        errorMsg.value = null; // Clear error after 5 seconds
    }, 5000)
  }
};
</script>

<style scoped>
/* Styles adapted from login.vue */
.signup-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0;
}

article {
  padding: 2rem;
}

hgroup h1 {
  margin-bottom: 0;
}

hgroup h2 {
    margin-bottom: var(--pico-block-spacing-vertical);
}

form {
  display: grid;
  gap: var(--pico-form-element-spacing-vertical);
}

button {
  margin-top: var(--pico-form-element-spacing-vertical);
  width: 100%;
}

p {
    text-align: center;
    margin-top: 1rem;
}

.error-message {
  color: var(--pico-color-red);
  margin-top: 1rem;
  text-align: center;
}

.success-message {
  color: var(--pico-color-green);
  margin-top: 1rem;
  text-align: center;
}
</style>
