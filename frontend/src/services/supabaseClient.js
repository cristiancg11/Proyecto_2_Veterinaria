import { createClient } from '@supabase/supabase-js';

// Read configuration from Vite environment variables with robust fallbacks
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://xqkqogrfakobdxrfusdg.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_J0B8Xwod53qVb7c2Q-bQgg__nkzi55I';

let client = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    console.error(
      '[supabaseClient] Faltan variables de entorno requeridas: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.'
    );
  }
} catch (err) {
  console.error('[supabaseClient] Error crítico al inicializar createClient hacia ' + SUPABASE_URL + ':', err);
}

export const supabase = client;
export default supabase;
