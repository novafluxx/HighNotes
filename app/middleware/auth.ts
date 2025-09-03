export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();
  if (!user.value) {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return navigateTo('/login');
    }
  }
});
