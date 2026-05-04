import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.startsWith('your_')) {
    throw new Error('Supabase not configured');
  }
  return createClient(url, key);
}

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.startsWith('your_')) {
    throw new Error('Supabase not configured');
  }
  return createClient(url, serviceKey);
}
