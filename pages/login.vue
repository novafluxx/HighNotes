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
            color="red"
            variant="soft"
            title="Login Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
            @close="errorMsg = null"
          />

          <UAlert
            v-if="isLocked"
            icon="i-heroicons-clock"
            color="warning"
            variant="soft"
            title="Too Many Attempts"
            :description="`Please wait ${remainingLockSeconds} seconds before retrying.`"
          />

          <UButton type="submit" block label="Login" :loading="loading" :disabled="isLocked" />
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
import { ref, computed, onMounted, watch } from 'vue';

const supabase = useSupabaseClient();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref<string | null>(null);
const loading = ref(false); // Added loading state for button
const failedAttempts = ref(0);
const lockoutUntil = ref<number | null>(null);
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 60 * 1000; // 1 minute

const isLocked = computed(() => lockoutUntil.value !== null && Date.now() < lockoutUntil.value);
const remainingLockSeconds = computed(() =>
  lockoutUntil.value ? Math.ceil((lockoutUntil.value - Date.now()) / 1000) : 0
);

// Persist lockout state across refresh via localStorage
onMounted(() => {
  const fa = localStorage.getItem('loginFailedAttempts');
  if (fa) failedAttempts.value = parseInt(fa);
  const lu = localStorage.getItem('loginLockoutUntil');
  if (lu) lockoutUntil.value = parseInt(lu);
});
watch(failedAttempts, val => {
  localStorage.setItem('loginFailedAttempts', val.toString());
});
watch(lockoutUntil, val => {
  if (val) {
    localStorage.setItem('loginLockoutUntil', val.toString());
  } else {
    localStorage.removeItem('loginLockoutUntil');
    localStorage.removeItem('loginFailedAttempts');
  }
});

const login = async () => {
  if (isLocked.value) {
    errorMsg.value = `Too many failed login attempts. Try again in ${remainingLockSeconds.value} seconds.`;
    return;
  }
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
    failedAttempts.value++;
    if (failedAttempts.value >= LOCKOUT_THRESHOLD) {
      lockoutUntil.value = Date.now() + LOCKOUT_DURATION;
      setTimeout(() => {
        failedAttempts.value = 0;
        lockoutUntil.value = null;
      }, LOCKOUT_DURATION);
    }
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
