<template>
  <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
    
    <main class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <UCard class="max-w-md w-full space-y-8">
        <!-- Conditional Header -->
        <template #header>
          <h1 v-if="showReset" class="text-center text-2xl font-bold text-gray-900 dark:text-white">Reset Your Password</h1>
          <h1 v-else class="text-center text-2xl font-bold text-gray-900 dark:text-white">Checking credentials...</h1>
        </template>

        <!-- Conditional Default Slot Content -->
        <!-- Password Reset Form -->
        <UForm v-if="showReset" :state="{ newPassword }" class="space-y-6" @submit="submitNewPassword">
          <UFormField label="New Password" name="newPassword" required help="Minimum 8 characters">
            <UInput v-model="newPassword" type="password" placeholder="Enter new password" :disabled="!!successMsg" class="focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
              <template #leading>
                <Icon name="lucide:lock" class="w-5 h-5" />
              </template>
            </UInput>
          </UFormField>

          <UAlert
            v-if="successMsg"
            color="primary"
            variant="soft"
            title="Password Updated"
            :description="successMsg"
          >
            <template #icon>
              <Icon name="lucide:check-circle" class="w-5 h-5" />
            </template>
          </UAlert>

          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            title="Update Error"
            :description="errorMsg"
            :close-button="{ icon: 'i-lucide-x', variant: 'link', padded: false }"
            @close="errorMsg = null"
          >
            <template #icon>
              <Icon name="lucide:alert-triangle" class="w-5 h-5" />
            </template>
          </UAlert>

          <UButton type="submit" block label="Set New Password" :loading="loading" :disabled="!!successMsg" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
        </UForm>

        <!-- Checking Credentials / Loading State -->
        <div v-else class="text-center space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-300">Please wait while we confirm your login or email verification.</p>
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
        </div>

      </UCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { watchEffect, ref } from 'vue';

definePageMeta({
  ssr: true // Enable SSR for public confirmation page
});

const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();

const newPassword = ref('');
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);
const showReset = ref(false);
const loading = ref(false);

watchEffect(() => {
  // Ensure route is available before accessing query
  if (!route) {
    return;
  }

  // Safely handle query params (defend against array injection)
  const type = Array.isArray(route.query.type) ? route.query.type[0] : route.query.type;
  const accessToken = Array.isArray(route.query.access_token) ? route.query.access_token[0] : route.query.access_token;

  if (type === 'recovery') {
    showReset.value = true;
    return;
  }
  // Check user AFTER route check
  if (user.value) {
    router.push('/notes');
  }
});

const submitNewPassword = async () => {
  loading.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  if (!newPassword.value || newPassword.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.';
    loading.value = false;
    return;
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    successMsg.value = 'Password updated! Redirecting to login...';
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to update password.';
  } finally {
    loading.value = false;
  }
};
</script>
