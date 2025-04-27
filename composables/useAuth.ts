// composables/useAuth.ts
import { ref, onMounted, readonly } from 'vue';
import type { User, AuthError } from '@supabase/supabase-js';
import { useSupabase } from './useSupabase';
import { useRouter } from '#app';

const user = ref<User | null>(null);
const loading = ref(true);

export const useAuth = () => {
  const supabase = useSupabase();
  const router = useRouter();

  const fetchUser = async () => {
    loading.value = true;
    const { data: { session } } = await supabase.auth.getSession();
    user.value = session?.user ?? null;
    loading.value = false;
  };

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    loading.value = true;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      await fetchUser(); // Update user state after login
      router.push('/notes');
    } else {
        // Ensure loading is false even on error
        loading.value = false;
    }
    return { error };
  };

  const logout = async () => {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    if (!error) {
      user.value = null;
      router.push('/'); // Redirect to login
    } else {
      console.error('Logout error:', error);
    }
    loading.value = false;
  };

  // Fetch user on initial load (client-side)
  onMounted(() => {
    if (process.client) {
        fetchUser();

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session);
          user.value = session?.user ?? null;
          // Optionally handle specific events like PASSWORD_RECOVERY, USER_UPDATED etc.
        });
    }
  });

  return {
    user: readonly(user), // Expose user as readonly ref
    isLoggedIn: computed(() => !!user.value),
    loading: readonly(loading),
    login,
    logout,
    fetchUser, // Expose fetchUser if needed elsewhere
  };
};
