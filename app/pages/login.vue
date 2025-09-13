<template>
  <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
    <!-- Use Tailwind for centering and padding -->
    <main class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- UCard provides a container -->
      <UCard
        class="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-900/80 shadow-xl border border-gray-200 dark:border-gray-800 rounded-2xl ring-1 ring-blue-100 dark:ring-blue-900/30 backdrop-blur-md"
      >
        <template #header>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
          <h2 class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">Access your High Notes</h2>
        </template>

        <!-- UForm for structure and potential validation -->
        <UForm :state="{ email, password }" class="space-y-6 mx-auto max-w-sm w-full flex flex-col items-center" @submit="login">
          <UFormField label="Email Address" name="email" required>
            <UInput v-model="email" type="email" placeholder="you@example.com" autocomplete="email" class="focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
              <template #leading>
                <Icon name="lucide:mail" class="w-5 h-5" />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput v-model="password" type="password" placeholder="Password" autocomplete="current-password" class="focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
              <template #leading>
                <Icon name="lucide:lock" class="w-5 h-5" />
              </template>
            </UInput>
          </UFormField>

          <!-- Display error message using UAlert -->
          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            title="Login Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
            @close="errorMsg = null"
            data-testid="login-error"
          >
            <template #icon>
              <Icon name="lucide:alert-triangle" class="w-5 h-5" />
            </template>
          </UAlert>

          <UButton type="submit" block label="Login" :loading="loading" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
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
import { useAuth } from '~/composables/useAuth';

const { login: loginUser, loading } = useAuth();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref<string | null>(null);

const login = async () => {
  errorMsg.value = null;
  const { error } = await loginUser(email.value, password.value);
  if (error) {
    errorMsg.value = error.message;
  } else {
    // Wait for the user to be set before redirecting
    const user = useSupabaseUser();
    watch(user, (newUser) => {
      if (newUser) {
        router.push('/notes');
      }
    }, { immediate: true });
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
