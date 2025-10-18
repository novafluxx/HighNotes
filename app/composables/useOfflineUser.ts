import { readonly } from 'vue';
import type { User } from '@supabase/supabase-js';
import { useState } from '#imports';

const STORAGE_KEY = 'highnotes.offline-user';

type OfflineUserSnapshot = {
  id: string;
  email?: string | null;
  lastAuthenticatedAt: number;
};

export type { OfflineUserSnapshot };
export const OFFLINE_USER_STORAGE_KEY = STORAGE_KEY;

export function useOfflineUser() {
  const state = useState<OfflineUserSnapshot | null>('offline-user', () => {
    if (import.meta.server) {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as OfflineUserSnapshot;
      return parsed?.id ? parsed : null;
    } catch {
      return null;
    }
  });

  const persistOfflineUser = (user: Pick<User, 'id' | 'email'> | OfflineUserSnapshot | null) => {
    if (import.meta.server) {
      state.value = user
        ? { id: user.id, email: 'email' in user ? user.email ?? null : (user as OfflineUserSnapshot).email ?? null, lastAuthenticatedAt: Date.now() }
        : null;
      return;
    }

    if (user) {
      const snapshot: OfflineUserSnapshot = {
        id: user.id,
        email: 'email' in user ? user.email ?? null : (user as OfflineUserSnapshot).email ?? null,
        lastAuthenticatedAt: Date.now(),
      };
      state.value = snapshot;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {}
    } else {
      state.value = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  const clearOfflineUser = () => persistOfflineUser(null);

  return {
    offlineUser: readonly(state),
    persistOfflineUser,
    clearOfflineUser,
  };
}
