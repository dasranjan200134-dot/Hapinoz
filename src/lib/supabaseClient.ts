import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://ccperjtlliuhamxbblwj.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_q4QtvJKuIQK2XYgvARumaA_LriO8CWb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseAnonKey.includes('your-supabase-anon')
);

// Production Supabase Client instance for Hapinoz Pure Spices
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const getSupabaseStatus = () => {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 32)}...` : 'Not set',
    projectId: 'ccperjtlliuhamxbblwj',
  };
};
