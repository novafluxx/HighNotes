import { useOfflineUser } from '~/composables/useOfflineUser';

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();
  if (user.value) {
    return;
  }

  const { offlineUser } = useOfflineUser();
  const supabase = useSupabaseClient();
  const hasNavigator = typeof navigator !== 'undefined';
  const offline = import.meta.client && hasNavigator ? !navigator.onLine : false;

  if (offline) {
    if (offlineUser.value) {
      return;
    }
    return navigateTo('/login');
  }

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      return;
    }
  } catch (error) {
    if (import.meta.client && offlineUser.value && hasNavigator && !navigator.onLine) {
      return;
    }
  }

  return navigateTo('/login');
});
