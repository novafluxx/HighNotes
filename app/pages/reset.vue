<template>
  <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
    
    <!-- Use Tailwind for centering and padding -->
    <main class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- UCard provides a container -->
      <UCard class="max-w-md w-full space-y-8">
        <template #header>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <h2 class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">Enter your email to receive a reset link</h2>
        </template>

        <!-- UForm for structure -->
        <UForm :state="{ email }" class="space-y-6 mx-auto max-w-sm w-full flex flex-col items-center" @submit="resetPassword">
          <UFormField label="Email Address" name="email" required>
            <UInput v-model="email" type="email" placeholder="you@example.com" :disabled="!!successMsg" class="focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
              <template #leading>
                <Icon name="lucide:mail" class="w-5 h-5" />
              </template>
            </UInput>
          </UFormField>

          <!-- Display success message -->
          <UAlert
            v-if="successMsg"
            color="primary"
            variant="soft"
            title="Email Sent"
            :description="successMsg"
          >
            <template #icon>
              <Icon name="lucide:check-circle" class="w-5 h-5" />
            </template>
          </UAlert>

          <!-- Display error message -->
          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            title="Reset Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
            @close="errorMsg = null"
          >
            <template #icon>
              <Icon name="lucide:alert-triangle" class="w-5 h-5" />
            </template>
          </UAlert>

          <!-- Disable button if success message is shown -->
          <UButton type="submit" block label="Send Reset Link" :loading="loading" :disabled="!!successMsg" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
        </UForm>

        <template #footer>
          <div class="text-sm text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Remembered your password? 
              <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Login</NuxtLink>
            </p>
          </div>
        </template>
      </UCard>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  ssr: true // Enable SSR for public password reset page
});

const supabase = useSupabaseClient();
const email = ref('');
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);
const loading = ref(false); // Added loading state

const resetPassword = async () => {
  loading.value = true; // Start loading
  successMsg.value = null;
  errorMsg.value = null;
  try {
    // Ensure window is defined (runs on client-side)
    const redirectUrl = window.location.origin + '/confirm';
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    successMsg.value = 'Password reset email sent! Please check your inbox.';
  } catch (error: any) {
    errorMsg.value = error.message || 'Failed to send reset email.';
    // Error message cleared via UAlert close button
    // setTimeout(() => {
    //   errorMsg.value = null;
    // }, 5000);
  } finally {
    loading.value = false; // Stop loading
  }
};
</script>
