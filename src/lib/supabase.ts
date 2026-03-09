import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser client — for client-side React islands (admin dashboard).
 * Uses the anon key; RLS enforces access control.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server client — for Astro SSR routes (dashboard, API endpoints).
 * Uses cookie-based auth via @supabase/ssr.
 */
export function createSupabaseServerClient(
  cookies: AstroCookies,
  headers: Headers
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
