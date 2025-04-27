<template>
  <div>
    <AppHeader />
    <main class="container login-container">
      <article class="grid">
        <div> 
          <hgroup>
            <h1>Sign In</h1>
            <h2>Access your <strong>High Notes</strong></h2>
          </hgroup>
          <form @submit.prevent="login">
            <label for="email">Email Address</label> 
            <input type="email" id="email" v-model="email" placeholder="Email address" required /> 

            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" placeholder="Password" required /> 

            <button type="submit">Login</button>
            <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p> 
          </form>
          <p>Don't have an account? <NuxtLink to="/signup">Sign Up</NuxtLink></p> 
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
const errorMsg = ref<string | null>(null);

const login = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    router.push('/notes'); 
  } catch (error: any) {
    console.error('Login failed:', error); 
    errorMsg.value = error.message;
    setTimeout(() => {
        errorMsg.value = null; 
    }, 5000)
  }
};

// Optional: Add middleware or check if user is already logged in
// const user = useSupabaseUser();
// watchEffect(() => {
//   if (user.value) {
//     router.push('/notes');
//   }
// });
</script>

<style scoped>
/* Add PicoCSS or custom styles if needed */
.login-container { 
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
</style>
