<template>
  <div>
    <AppHeader />
    <!-- Use Tailwind for centering and padding -->
    <main class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- UCard provides a container -->
      <UCard class="max-w-md w-full space-y-8">
        <template #header>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
          <h2 class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">Access your High Notes</h2>
        </template>

        <!-- UForm for structure and potential validation -->
        <UForm :state="{ email, password }" class="space-y-6 mx-auto max-w-sm w-full flex flex-col items-center" @submit="login">
          <UFormField label="Email Address" name="email" required>
            <UInput v-model="email" type="email" placeholder="you@example.com" icon="i-heroicons-envelope" autocomplete="email" />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput v-model="password" type="password" placeholder="Password" icon="i-heroicons-lock-closed" autocomplete="current-password" />
          </UFormField>

          <!-- Display error message using UAlert -->
          <UAlert
            v-if="errorMsg"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            title="Login Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
            @close="errorMsg = null"
            data-testid="login-error"
          />

          <UButton type="submit" block label="Login" :loading="loading" />
        </UForm>

        <template #footer>
          <div class="text-sm text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Don't have an account? 
              <NuxtLink to="/signup" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Sign Up</NuxtLink>
            </p>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Forgot your password? 
              <NuxtLink to="/reset" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Reset it here</NuxtLink>
            </p>
          </div>
        </template>
      </UCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref<string | null>(null);
const loading = ref(false); // Added loading state for button

const login = async () => {
  loading.value = true; // Start loading
  errorMsg.value = null; // Clear previous errors
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    router.push('/notes');
  } catch (error: any) {
    console.error('Login failed:', error);
    errorMsg.value = error.message || 'An unexpected error occurred.';
    // Removed the automatic timeout for error message, using UAlert close button instead
    // setTimeout(() => {
    //     errorMsg.value = null; 
    // }, 5000)
  } finally {
    loading.value = false; // Stop loading regardless of outcome
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
