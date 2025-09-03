export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();
  console.log('Auth middleware: user.value =', user.value);
  if (!user.value) {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth middleware: session =', session);
    if (!session?.user) {
      return navigateTo('/login');
    }
  }
});
