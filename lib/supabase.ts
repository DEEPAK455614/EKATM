import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || 'https://invalid.local', key || 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-client-info': 'ekatma-yatra-intelligence/1.0' }
  }
});

export type AuthUser = {
  id: string;
  email?: string;
};
