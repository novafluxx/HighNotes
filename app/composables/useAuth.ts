// composables/useAuth.ts
import { ref, readonly, computed } from 'vue';
import type { AuthError } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types'; // Import generated DB types
import { useRouter } from '#app'; // Nuxt's router composable
// useSupabaseClient will be auto-imported by Nuxt

// This composable now primarily provides login/logout *actions*
// and a loading state for those actions.
// User state management is delegated to useSupabaseUser().

export const useAuth = () => {
  const client = useSupabaseClient<Database>(); // Use standard composable with DB types
  const router = useRouter();
  const loading = ref(false); // Loading state specifically for login/logout actions

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    loading.value = true;
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    // NOTE: User state updates handled by useSupabaseUser() reactively.
    // NOTE: Redirection is handled by the @nuxtjs/supabase module config or the calling page (login.vue)
    loading.value = false;
    return { error };
  };

  const logout = async () => {
    loading.value = true;
    const { error } = await client.auth.signOut();
    if (!error) {
      // User state will update automatically via useSupabaseUser()
      router.push('/'); // Redirect after logout
    } else {
      console.error('Logout error:', error);
    }
    loading.value = false;
  };

  // --- Return reactive state and methods ---
  return {
    loading: readonly(loading), // Loading state for login/logout actions
    login,
    logout,
  };
};
