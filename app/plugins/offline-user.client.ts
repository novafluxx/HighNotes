import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useOfflineUser } from '~/composables/useOfflineUser';

export default defineNuxtPlugin(() => {
  if (import.meta.server) {
    return;
  }

  const client = useSupabaseClient();
  const supabaseUser = useSupabaseUser();
  const { offlineUser, persistOfflineUser, clearOfflineUser } = useOfflineUser();

  const snapshotFromSession = (session: Session | null) => {
    if (session?.user) {
      persistOfflineUser(session.user);
    }
  };

  if (supabaseUser.value && (supabaseUser.value as any).id) {
    persistOfflineUser({
      id: String((supabaseUser.value as any).id),
      email: (supabaseUser.value as any).email ?? null,
      lastAuthenticatedAt: Date.now(),
    });
  } else if (!offlineUser.value) {
    client.auth.getSession().then(({ data }) => {
      snapshotFromSession(data?.session ?? null);
    }).catch(() => {
      /* ignore */
    });
  }

  const { data: subscription } = client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    if (session?.user) {
      persistOfflineUser(session.user);
      return;
    }

    if (event === 'SIGNED_OUT') {
      clearOfflineUser();
    }
  });

  if (subscription?.subscription && typeof window !== 'undefined') {
    const unsubscribe = () => subscription.subscription.unsubscribe();
    window.addEventListener('beforeunload', unsubscribe, { once: true });
  }
});
