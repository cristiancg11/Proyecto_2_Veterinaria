import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdxzoiededgmfysfoozd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_U9-Rfmm6aiSvTSqmn-oQ4w_XamHPVQ8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
