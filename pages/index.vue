<template>
  <main class="container">
    <nav>
      <ul>
        <li><strong>High Notes</strong></li>
      </ul>
    </nav>
    <article>
      <hgroup>
        <h1>Sign In</h1>
        <h2>Access your high notes</h2>
      </hgroup>
      <form @submit.prevent="login">
        <label for="email">
          Email address
          <input type="email" id="email" name="email" placeholder="Email address" v-model="email" required>
        </label>

        <label for="password">
          Password
          <input type="password" id="password" name="password" placeholder="Password" v-model="password" required>
        </label>

        <button type="submit" :disabled="loading">Login</button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </article>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createClient, AuthError } from '@supabase/supabase-js'
import { useRouter, useRuntimeConfig } from '#app'

// Initialize Supabase client with validated config
const config = useRuntimeConfig()
const supabaseUrl = config.public.supabaseUrl as string
const supabaseKey = config.public.supabaseKey as string
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in runtimeConfig')
}
const supabase = createClient(supabaseUrl, supabaseKey)

// Get router for navigation
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const login = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    if (error) {
      errorMessage.value = (error as AuthError).message
    } else {
      router.push('/notes')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = String(err)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
  main.container {
    max-width: 768px; /* Adjust as needed */
    margin-top: 2rem;
  }
  nav {
    margin-bottom: 2rem;
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
    color: var(--pico-color-red-500);
    margin-top: 1rem;
  }
</style>
