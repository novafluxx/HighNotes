// composables/useSupabase.ts
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#app';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const useSupabase = () => {
  if (!supabaseInstance) {
    const config = useRuntimeConfig();
    const supabaseUrl = config.public.supabaseUrl;
    const supabaseKey = config.public.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is missing in runtime config.');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};
