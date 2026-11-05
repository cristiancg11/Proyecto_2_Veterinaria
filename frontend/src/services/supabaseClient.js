import { createClient } from '@supabase/supabase-js';

// Strict environment variable resolution with clear console warnings if missing
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://xqkqogrfakobdxrfusdg.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_J0B8Xwod53qVb7c2Q-bQgg__nkzi55I';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[supabaseClient] Advertencia: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas en el entorno Vite. Utilizando credenciales de respaldo.'
  );
}

// Single instance export of Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
