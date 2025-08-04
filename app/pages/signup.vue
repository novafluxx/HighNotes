<template>
  <div>
    
    <!-- Use Tailwind for centering and padding -->
    <main class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- UCard provides a container -->
      <UCard class="max-w-md w-full space-y-8">
        <template #header>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Sign Up</h1>
          <h2 class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">Create your High Notes account</h2>
        </template>

        <!-- UForm for structure and potential validation -->
        <UForm :state="{ email, password }" class="space-y-6" @submit="handleSignup">
          <UFormField label="Email Address" name="email" required>
            <UInput v-model="email" type="email" placeholder="you@example.com" icon="i-heroicons-envelope" />
          </UFormField>

          <UFormField label="Password" name="password" required help="Minimum 8 characters">
            <UInput v-model="password" type="password" placeholder="Password" icon="i-heroicons-lock-closed" />
          </UFormField>

          <!-- Optional: Add Confirm Password using UFormField/UInput if needed -->

          <!-- Display success message -->
           <UAlert
            v-if="successMsg"
            icon="i-heroicons-check-circle"
            color="primary"
            variant="soft"
            title="Account Created"
            :description="successMsg"
          />

          <!-- Display error message -->
          <UAlert
            v-if="errorMsg"
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="soft"
            title="Signup Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
            @close="errorMsg = null"
          />

          <!-- Disable button if success message is shown -->
          <UButton type="submit" block label="Sign Up" :loading="loading" :disabled="!!successMsg" />
        </UForm>

        <template #footer>
          <div class="text-sm text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Already have an account? 
              <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Login</NuxtLink>
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
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref('');
const password = ref('');
// const confirmPassword = ref(''); // Uncomment if using confirm password
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);
const loading = ref(false); // Added loading state

const handleSignup = async () => {
  loading.value = true; // Start loading
  errorMsg.value = null;
  successMsg.value = null; // Clear previous success message

  // Optional: Check if passwords match
  // if (password.value !== confirmPassword.value) {
  //   errorMsg.value = 'Passwords do not match.';
  //   loading.value = false;
  //   return;
  // }

  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      // Optional: Add options like redirect URL or data
      // options: {
      //   emailRedirectTo: `${window.location.origin}/confirm` // Redirect to confirm page after email link click
      // }
    });
    if (error) throw error;
    successMsg.value = 'Account created! Please check your email to confirm your registration.';
    // Clear form potentially
    // email.value = '';
    // password.value = '';
    // Optionally redirect after a delay or keep user on page
    // setTimeout(() => router.push('/login'), 5000); 
  } catch (error: any) {
    errorMsg.value = error.message || 'An unexpected error occurred during sign up.';
    // Removed the automatic timeout for error message
    // setTimeout(() => {
    //     errorMsg.value = null; // Clear error after 5 seconds
    // }, 5000)
  } finally {
    loading.value = false; // Stop loading
  }
};
</script>
